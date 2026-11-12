import ast
import asyncio
from contextlib import redirect_stdout
from io import StringIO
import json
import logging
from pathlib import Path
import fake_api
from openai import RateLimitError
logging.disable(logging.CRITICAL)
n=json.loads(Path('workshop.ipynb').read_text())
cells={c['id']:''.join(c['source']) for c in n['cells']}
assert 'sk-proj-' not in json.dumps(n)
assert all(not c.get('outputs') and c.get('execution_count') is None for c in n['cells'] if c['cell_type']=='code')

def config(real=True):
    s=cells['mode-config'].replace('from openai import AsyncOpenAI','from fake_api import factory as AsyncOpenAI').replace('from getpass import getpass','from fake_api import fake_getpass as getpass')
    if real:s=s.replace('MODEL_MODE = "scripted"','MODEL_MODE = "openai"',1)
    return s
async def execute(source,ns):
    value=eval(compile(source,'validation','exec',flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT),ns)
    if value is not None:await value
async def main():
    results=[]
    fake_api.getpass_calls=0;fake_api.client_constructions=0;fake_api.requests.clear()
    ns={}
    with redirect_stdout(StringIO()):await execute(config(False),ns)
    assert fake_api.getpass_calls==0 and fake_api.client_constructions==0
    results.append({'scenario':'default_mode_no_key_or_client','pass':True})
    for style in ('responses','chat_completions'):
        ns={}
        fake_api.getpass_calls=0;fake_api.client_constructions=0;fake_api.requests.clear();fake_api.BEHAVIOR='error'
        with redirect_stdout(StringIO()):
            await execute(cells['step-02'],ns)
            await execute(config().replace('API_STYLE = "responses"',f'API_STYLE = "{style}"',1),ns)
            await execute(cells['helpers'],ns)
            try:await execute(cells['ch02-loop'],ns)
            except RateLimitError:pass
            else:raise AssertionError('Expected explicit HTTP error, not fallback')
        assert fake_api.getpass_calls==1 and len(fake_api.requests)==1
        assert ns['MODEL_MODE']=='openai' and ns['loop_model'].__class__.__name__=='ObservedModel'
        await ns['study_client'].close()
        results.append({'scenario':style+'_429_no_retry_or_fallback','pass':True,'mock_http_requests':1})
    ns={}
    fake_api.client_constructions=0;fake_api.requests.clear()
    with redirect_stdout(StringIO()):
        try:await execute(config().replace('from fake_api import fake_getpass as getpass','getpass = lambda prompt: ""'),ns)
        except RuntimeError as exc:assert '没有读取到 Key' in str(exc)
        else:raise AssertionError('Blank key was accepted')
    assert fake_api.client_constructions==0 and not fake_api.requests
    results.append({'scenario':'blank_key_no_client_or_request','pass':True})
    report={'success':True,'scenarios':results,'real_api_requests':0,'shared_notebook_outputs_empty':True,'credential_prefix_absent':True}
    Path('route-safety-result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
asyncio.run(main())
