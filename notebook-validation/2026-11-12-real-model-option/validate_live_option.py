"""Exercise Notebook cells against a fake HTTP endpoint; never use real credentials."""
import ast
import asyncio
from contextlib import redirect_stdout
from io import StringIO
import json
import logging
import os
from pathlib import Path
import sys

import httpx2 as httpx
from openai import AsyncOpenAI as RealAsyncOpenAI
from agents.testing import ScriptedModel

notebook = json.loads(Path('workshop.ipynb').read_text())
cells = {c['id']: ''.join(c['source']) for c in notebook['cells']}
ns = {'ScriptedModel': ScriptedModel}
with redirect_stdout(StringIO()):
    exec(cells['helpers'], ns)
    exec(cells['optional-real'], ns)

async def run_cell(cell_id, source=None):
    code = compile(source or cells[cell_id], cell_id, 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    result = eval(code, ns)
    if result is not None:
        await result

class FakeEndpoint:
    def __init__(self, style, kind, failure=None):
        self.style, self.kind, self.failure = style, kind, failure
        self.requests = []

    async def __call__(self, request):
        assert request.url.host == 'unit-test.invalid', 'Unexpected network target'
        expected_path = '/v1/responses' if self.style == 'responses' else '/v1/chat/completions'
        assert request.url.path == expected_path
        body = json.loads(request.content)
        self.requests.append(body)
        if self.failure == 'connection':
            raise httpx.ConnectError('Mock connection failure', request=request)
        if self.failure:
            return httpx.Response(self.failure, json={'error': {'message': 'Mock service failure', 'type': 'invalid_request_error', 'code': 'mock_error'}}, request=request)
        first = len(self.requests) == 1
        tool_name = 'real_demo_weather' if self.kind == 'weather' else 'transfer_to_refund_agent'
        args = json.dumps({'city': '上海'} if self.kind == 'weather' else {}, ensure_ascii=False)
        if first:
            available = [t['name'] if self.style == 'responses' else t['function']['name'] for t in body['tools']]
            assert tool_name in available, available
        elif self.style == 'responses':
            assert any(i.get('type') == 'function_call_output' and i['call_id'] == 'call_test' for i in body['input'])
        else:
            assert any(i.get('role') == 'tool' and i['tool_call_id'] == 'call_test' for i in body['messages'])
        assert len(self.requests) <= 2, 'Unexpected third model call'
        if self.style == 'responses':
            output = ([{'id': 'fc_test', 'type': 'function_call', 'call_id': 'call_test', 'name': tool_name, 'arguments': args, 'status': 'completed'}] if first else
                      [{'id': 'msg_test', 'type': 'message', 'role': 'assistant', 'status': 'completed', 'content': [{'type': 'output_text', 'text': 'HTTP模拟返回：教学实验完成。', 'annotations': [], 'logprobs': []}]}])
            data = {'id': f'resp_test_{len(self.requests)}', 'object': 'response', 'created_at': 1, 'model': 'mock-tool-model', 'status': 'completed', 'output': output,
                    'usage': {'input_tokens': 12, 'output_tokens': 4, 'total_tokens': 16, 'input_tokens_details': {'cached_tokens': 0}, 'output_tokens_details': {'reasoning_tokens': 0}}}
        else:
            message = ({'role': 'assistant', 'content': None, 'tool_calls': [{'id': 'call_test', 'type': 'function', 'function': {'name': tool_name, 'arguments': args}}]} if first else
                       {'role': 'assistant', 'content': 'HTTP模拟返回：教学实验完成。'})
            data = {'id': f'chat_test_{len(self.requests)}', 'object': 'chat.completion', 'created': 1, 'model': 'mock-tool-model',
                    'choices': [{'index': 0, 'finish_reason': 'tool_calls' if first else 'stop', 'message': message}],
                    'usage': {'prompt_tokens': 12, 'completion_tokens': 4, 'total_tokens': 16}}
        return httpx.Response(200, json=data, request=request)

def install_endpoint(style, kind, failure=None):
    endpoint = FakeEndpoint(style, kind, failure)
    def factory(**kwargs):
        assert kwargs['api_key'] == 'not-a-real-key-for-http-mock'
        assert kwargs['max_retries'] == 0
        return RealAsyncOpenAI(**kwargs, http_client=httpx.AsyncClient(transport=httpx.MockTransport(endpoint)))
    ns.update(AsyncOpenAI=factory, RUN_REAL_MODEL=True, KEY_SOURCE='environment', REAL_MODEL='mock-tool-model', API_STYLE=style, API_BASE_URL='https://unit-test.invalid/v1')
    return endpoint

async def main():
    tests = []
    def no_key_read():
        raise AssertionError('Default branch attempted to read credentials')
    original_key_reader = ns['read_live_key']
    ns['read_live_key'] = no_key_read
    default_output = StringIO()
    with redirect_stdout(default_output):
        await run_cell('real-weather')
        await run_cell('real-handoff')
    ns['read_live_key'] = original_key_reader
    assert '已跳过' in default_output.getvalue()
    tests.append({'scenario': 'default_disabled_no_key_read', 'pass': True})

    for style in ('responses', 'chat_completions'):
        for kind in ('weather', 'handoff'):
            endpoint = install_endpoint(style, kind)
            output = StringIO()
            with redirect_stdout(output):
                if kind == 'weather':
                    await run_cell('real-weather')
                    result, observer = ns['live_result'], ns['live_observer']
                    assert observer.events.count('tool_body:上海') == 1
                    assert any(i.type == 'tool_call_output_item' for i in result.new_items)
                else:
                    await run_cell('real-handoff', cells['real-handoff'].replace('RUN_REAL_HANDOFF = False', 'RUN_REAL_HANDOFF = True'))
                    result, observer = ns['live_handoff_result'], ns['live_handoff_observer']
                    assert result.last_agent.name == 'Refund Agent'
                    assert 'handoff:Triage Agent->Refund Agent' in observer.events
                assert observer.model_calls == 2
                assert len(endpoint.requests) == 2
                assert result.final_output == 'HTTP模拟返回：教学实验完成。'
                assert 'not-a-real-key-for-http-mock' not in output.getvalue()
            tests.append({'scenario': f'{style}_{kind}', 'pass': True, 'mock_http_requests': len(endpoint.requests), 'events': observer.events})

        for failure, message in ((401, '认证失败'), (429, '限流或额度错误'), (400, 'HTTP 400'), ('connection', '无法连接')):
            endpoint = install_endpoint(style, 'weather', failure)
            try:
                await ns['run_live_demo']('weather', '上海天气')
            except RuntimeError as exc:
                assert message in str(exc), str(exc)
                assert 'not-a-real-key-for-http-mock' not in str(exc)
            else:
                raise AssertionError(f'Expected controlled error: {failure}')
            assert len(endpoint.requests) == 1, 'Unexpected automatic retry'
            tests.append({'scenario': f'{style}_error_{failure}', 'pass': True, 'mock_http_requests': 1})

    install_endpoint('responses', 'weather')
    saved_key = os.environ.pop('OPENAI_API_KEY')
    try:
        try:
            await ns['run_live_demo']('weather', '上海天气')
        except RuntimeError as exc:
            assert '没有读取到密钥' in str(exc)
        else:
            raise AssertionError('Missing key was accepted')
    finally:
        os.environ['OPENAI_API_KEY'] = saved_key
    tests.append({'scenario': 'missing_key', 'pass': True})
    assert all(not c.get('outputs') and c.get('execution_count') is None for c in notebook['cells'] if c['cell_type'] == 'code')
    report = {'success': True, 'scenarios': len(tests), 'tests': tests, 'real_api_requests': 0, 'transport': 'httpx2.MockTransport', 'sdk': __import__('importlib.metadata').metadata.version('openai-agents')}
    Path('live-option-result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))

previous_key = os.environ.get('OPENAI_API_KEY')
os.environ['OPENAI_API_KEY'] = 'not-a-real-key-for-http-mock'
# Expected HTTP failures can be logged by the SDK; all requests above use a fake endpoint and fake key.
logging.basicConfig(level=logging.CRITICAL)
try:
    asyncio.run(main())
finally:
    if previous_key is None:
        os.environ.pop('OPENAI_API_KEY', None)
    else:
        os.environ['OPENAI_API_KEY'] = previous_key
