import ast
import json
from pathlib import Path
import sys
import nbformat
from nbclient import NotebookClient
style=sys.argv[1]
behavior=sys.argv[2] if len(sys.argv)>2 else 'tools'
label='mock-'+style+'-'+behavior
n=nbformat.read('workshop.ipynb',as_version=4)
for c in n.cells:
    if c.id=='mode-config':
        c.source=c.source.replace('MODEL_MODE = "scripted"','MODEL_MODE = "openai"',1).replace('API_STYLE = "responses"',f'API_STYLE = "{style}"',1).replace('from openai import AsyncOpenAI','from fake_api import factory as AsyncOpenAI').replace('from getpass import getpass',f'from fake_api import fake_getpass as getpass\nimport fake_api\nfake_api.BEHAVIOR = "{behavior}"')
check='''import fake_api
assert fake_api.getpass_calls == 1
assert fake_api.client_constructions == 1
assert MODEL_MODE == "openai"
assert len(fake_api.requests) > 0
assert all(c["style"] == API_STYLE for c in fake_api.requests)
assert all(calls == 0 for calls in [len(guard_model.calls)])
print("TEST_FIXTURE", "getpass_calls", fake_api.getpass_calls, "mock_http_requests", len(fake_api.requests), "real_api_requests", 0)
await study_client.close()
'''
n.cells.append(nbformat.v4.new_code_cell(check,id='fixture-verification'))
for c in n.cells:
    if c.cell_type=='code' and not c.source.lstrip().startswith('%'):
        compile(c.source,c.id,'exec',flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
success=True
try:
    NotebookClient(n,timeout=120,kernel_name='agents-full-study',resources={'metadata':{'path':'.'}}).execute()
except Exception as exc:
    success=False
    print('FAILED',type(exc).__name__,str(exc)[-2500:])
finally:
    nbformat.write(n,label+'-executed.ipynb')
    lines=[]
    for c in n.cells:
        if c.cell_type!='code':continue
        lines.append('CELL '+c.id)
        for o in c.outputs:
            if o.output_type=='stream':lines.append(o.text)
            elif o.output_type=='error':lines.append(o.ename+': '+o.evalue)
    Path(label+'.log').write_text('\n'.join(lines))
    result={'success':success,'kind':'HTTP mock only','api_style':style,'behavior':behavior,'code_cells':sum(c.cell_type=='code' for c in n.cells),'executed_code_cells':sum(c.cell_type=='code' and c.execution_count is not None for c in n.cells),'real_api_requests':0}
    Path(label+'-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
    print('\n'.join(lines)[-1800:])
sys.exit(0 if success else 1)
