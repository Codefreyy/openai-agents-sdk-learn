import ast
import json
import sys
import sqlite3
from pathlib import Path
import nbformat
from nbclient import NotebookClient

n=nbformat.read('workshop.ipynb',as_version=4)
for cell in n.cells:
    if cell.cell_type=='code' and not cell.source.lstrip().startswith('%'):
        compile(cell.source, cell.id, 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
print('All code cells passed syntax checks; SQLite',sqlite3.sqlite_version)
success=True
try:
    NotebookClient(n,timeout=300,kernel_name='agents-full-study',resources={'metadata':{'path':'.'}}).execute()
except Exception as exc:
    success=False
    print('NOTEBOOK_FAILED',type(exc).__name__,str(exc)[-3500:])
finally:
    nbformat.write(n,'workshop-executed.ipynb')
    lines=[]
    for i,cell in enumerate(n.cells):
        if cell.cell_type!='code':continue
        lines.append(f'CELL {i} {cell.id} execution_count={cell.execution_count}')
        for output in cell.get('outputs',[]):
            if output.output_type=='stream':lines.append(output.text)
            elif output.output_type=='error':lines.append('ERROR '+output.ename+': '+output.evalue)
    Path('execution-final.log').write_text('\n'.join(lines))
    print('\n'.join(lines)[-6500:])
    result={'success':success,'cells':len(n.cells),'code_cells':sum(c.cell_type=='code' for c in n.cells),'executed_code_cells':sum(c.cell_type=='code' and c.execution_count is not None for c in n.cells),'python':sys.version.split()[0],'sqlite':sqlite3.sqlite_version,'real_api_call_enabled':False}
    Path('execution-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print('NOTEBOOK_RESULT',json.dumps(result))
    sys.exit(0 if success else 1)
