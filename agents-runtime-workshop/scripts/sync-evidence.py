"""Export evidence from a pinned git commit; never execute SDK code."""
import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
COMMIT = '17d994bd3045dae71acda676a4ef4762ed8ecd94'
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=SITE.parent / 'openai-agents-python')
args = parser.parse_args()
cache = {}
def source(path):
    if path not in cache:
        cache[path] = subprocess.check_output(['git', '-C', str(args.source), 'show', f'{COMMIT}:{path}'], text=True).splitlines()
    return cache[path]
def snippet(key, path, pattern, count=14, after=0, title=None):
    lines = source(path)
    matches = [i for i, line in enumerate(lines) if re.search(pattern, line) and i >= after]
    assert matches, (path, pattern)
    start = matches[0]
    return key, {'title': title or key, 'file': path, 'line': start + 1,
                 'url': f'https://github.com/openai/openai-agents-python/blob/{COMMIT}/{path}#L{start+1}',
                 'code': '\n'.join(lines[start:start+count]), 'commit': COMMIT}

specs = [
 ('runner','src/agents/run.py',r'^    async def run\(',16,0,'Runner.run · 公开入口'),
 ('delegate','src/agents/run.py',r'^        runner = DEFAULT_AGENT_RUNNER',13,0,'委托默认 AgentRunner'),
 ('agent-run','src/agents/run.py',r'^    async def run\(',12,560,'AgentRunner.run · 内部准备'),
 ('configuration','src/agents/run.py',r'^                    configuration_agent =',8,550,'选择配置准备所用 Agent'),
 ('core-call','src/agents/run.py',r'^                        return await self._run_impl',8,550,'委托 _run_impl'),
 ('impl','src/agents/run.py',r'^    async def _run_impl\(',15,0,'AgentRunner._run_impl'),
 ('init','src/agents/run.py',r'^                current_turn = 0',13,700,'初始化新任务'),
 ('loop','src/agents/run.py',r'^                while True:',10,900,'Agent Loop'),
 ('limit','src/agents/run.py',r'^                    current_turn \+= 1',13,1000,'新模型轮次计数'),
 ('first-turn','src/agents/run.py',r'^                            model_task = asyncio.create_task',15,1700,'首轮：异步任务与护栏'),
 ('later-turn','src/agents/run.py',r'^                            turn_result = await run_single_turn',14,1800,'后续轮次：执行单轮'),
 ('history','src/agents/run.py',r'^                    model_responses.append\(turn_result.model_response\)',9,1900,'更新运行历史'),
 ('final','src/agents/run.py',r'^                        if isinstance\(turn_result.next_step, NextStepFinalOutput\)',12,2000,'最终输出与输出护栏'),
 ('interrupt','src/agents/run.py',r'^                        elif isinstance\(turn_result.next_step, NextStepInterruption\)',12,2200,'中断分支'),
 ('handoff-branch','src/agents/run.py',r'^                        elif isinstance\(turn_result.next_step, NextStepHandoff\)',12,2300,'切换当前 Agent'),
 ('again','src/agents/run.py',r'^                        elif isinstance\(turn_result.next_step, NextStepRunAgain\)',12,2300,'继续下一轮'),
 ('single','src/agents/run_internal/run_loop.py',r'^async def run_single_turn\(',17,0,'run_single_turn · 非流式单轮'),
 ('model','src/agents/run_internal/turn_preparation.py',r'^def get_model\(',20,0,'get_model · 配置优先级'),
 ('request','src/agents/run_internal/run_loop.py',r'^    filtered = await maybe_filter_model_input\(',20,2900,'模型输入过滤和模型选择'),
 ('llm-start','src/agents/run_internal/run_loop.py',r'^        hooks.on_llm_start\(',14,2900,'模型调用前的生命周期回调'),
 ('retry','src/agents/run_internal/run_loop.py',r'^        new_response = await get_response_with_retry\(',20,2900,'统一模型调用与重试入口'),
 ('llm-end','src/agents/run_internal/run_loop.py',r'^    async def after_invocation_validation\(',19,2800,'非流式响应后的 llm_end 调用'),
 ('api','src/agents/models/openai_responses.py',r'^            response = await client.responses.create\(',5,0,'Responses API HTTP 请求'),
 ('parse','src/agents/run_internal/turn_resolution.py',r'^def process_model_response\(',18,0,'模型响应分类'),
 ('actions','src/agents/run_internal/turn_resolution.py',r'^async def execute_tools_and_side_effects\(',17,0,'执行工具及其他本地动作'),
 ('tool-schema','src/agents/tool.py',r'^        schema = function_schema\(',11,2700,'从 Python 函数生成 Schema'),
 ('tool-args','src/agents/tool.py',r'^        def _prepare_arguments\(',28,2700,'JSON 解析和参数校验'),
 ('tool-call','src/agents/tool.py',r'^            if not is_sync_function_tool:',12,2800,'调用实际 Python 函数'),
 ('tool-hooks','src/agents/run_internal/tool_execution.py',r'^                self.hooks.on_tool_start',10,2000,'本地函数工具开始回调'),
 ('tool-end','src/agents/run_internal/tool_execution.py',r'^            self.hooks.on_tool_end',9,2100,'本地工具结束回调'),
 ('nextstep','src/agents/run_internal/run_steps.py',r'^class NextStepHandoff:',39,0,'四种 NextStep'),
 ('lifecycle','src/agents/lifecycle.py',r'^    async def on_llm_start\(',19,0,'RunHooks 模型生命周期接口'),
 ('input-filter','src/agents/run_config.py',r'^    call_model_input_filter:',14,0,'明确的模型输入过滤扩展点'),
 ('handoff-config','src/agents/run_internal/turn_preparation.py',r'^async def get_handoffs\(',22,0,'解析可用 Handoffs'),
 ('handoff-convert','src/agents/models/openai_responses.py',r'^    def _convert_handoff_tool\(',13,0,'将 Handoff 转为 API 工具声明'),
 ('handoff','src/agents/run_internal/turn_resolution.py',r'^async def execute_handoffs\(',17,0,'Handoff 独立执行路径'),
]
snippets = dict(snippet(*spec) for spec in specs)
markers = []
local_run = args.source / 'src/agents/run.py'
for number, line in enumerate(local_run.read_text().splitlines(),1):
    if re.match(r'\s*# \*',line): markers.append({'line':number,'text':line.strip()[2:]})
logs = {name: (SITE.parent/name).read_text() for name in ['weather_loop_experiment.log','agent_handoff_hooks_experiment.log','源码观察-next-step-CloudIDE运行记录.log']}
payload = {'commit':COMMIT,'snippets':snippets,'markers':markers,'logs':logs}
(SITE/'js/sourceData.js').write_text('const sourceData = '+json.dumps(payload,ensure_ascii=False,indent=2)+';\n')
for name in ['notes_optimized.md','Agent运行循环-互动练习.ipynb','weather_loop_experiment.log','agent_handoff_hooks_experiment.log','源码观察-next-step-CloudIDE运行记录.log','weather_loop_experiment.py','agent_handoff_hooks_experiment.py','源码观察-next-step.patch']:
    src = SITE.parent / name
    if src.exists(): shutil.copyfile(src,SITE/'materials'/name)
(SITE/'materials/openai-agents-python-LICENSE.txt').write_text(subprocess.check_output(['git','-C',str(args.source),'show',f'{COMMIT}:LICENSE'],text=True))
print('Exported',len(snippets),'pinned source excerpts and',len(markers),'local teaching markers')
