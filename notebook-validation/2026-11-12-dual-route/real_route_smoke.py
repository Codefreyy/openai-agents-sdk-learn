import ast
import asyncio
from contextlib import redirect_stdout
from io import StringIO
import json
import logging
from pathlib import Path
import sys

logging.disable(logging.CRITICAL)
print('READY_FOR_KEY', flush=True)
key = sys.stdin.readline().strip()
if not key:
    print('NO_KEY_RECEIVED', flush=True)
    sys.exit(2)
notebook=json.loads(Path('workshop.ipynb').read_text())
cells={c['id']:''.join(c['source']) for c in notebook['cells']}
ns={'_read_test_key':lambda prompt:key}
report={'kind':'real_openai_smoke','sdk':'0.24.0','model':'gpt-4.1','scenarios':[],'success':False}
outputs=[]
async def execute(cell_id):
    source=cells[cell_id]
    if cell_id=='mode-config':
        source=source.replace('MODEL_MODE = "scripted"','MODEL_MODE = "openai"',1).replace('from getpass import getpass','getpass = _read_test_key')
    value=eval(compile(source,cell_id,'exec',flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT),ns)
    if value is not None:await value
async def main():
    try:
        for cell_id in ['step-02','mode-config','helpers','ch01-configuration','ch02-loop','ch05-handoff','ch06-approval','ch07-streaming']:
            output=StringIO()
            try:
                with redirect_stdout(output):await execute(cell_id)
            except Exception as exc:
                item={'cell':cell_id,'status':'failed','error_type':type(exc).__name__}
                if isinstance(getattr(exc,'status_code',None),int):item['http_status']=exc.status_code
                code=getattr(exc,'code',None)
                if code in {'insufficient_quota','invalid_api_key','model_not_found','rate_limit_exceeded','account_deactivated'}:item['error_code']=code
                report['scenarios'].append(item)
                break
            else:
                report['scenarios'].append({'cell':cell_id,'status':'passed'})
            finally:outputs.append('CELL '+cell_id+'\n'+output.getvalue())
        else:report['success']=True
        report['model_calls_observed']=sum(len(v.calls) for v in ns.values() if hasattr(v,'calls') and v.__class__.__name__=='ObservedModel')
        if 'loop_events' in ns:report['weather_tools']=ns['loop_events']
        if 'handoff_hooks' in ns:report['handoff_events']=ns['handoff_hooks'].events
        if 'refund_events' in ns:report['approved_tool_executions']=len(ns['refund_events'])
    finally:
        if ns.get('study_client') is not None:await ns['study_client'].close()
    Path('real-smoke-result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    Path('real-smoke-output.log').write_text('\n'.join(outputs).replace(key,'[REDACTED]'))
    print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
asyncio.run(main())
del key
sys.exit(0 if report['success'] else 1)
