"""Build a self-contained NoCode artifact. Execute the packaging in Cloud IDE."""
import base64
import json
import re
from pathlib import Path

root=Path(__file__).resolve().parents[1]
output=root/'dist'
output.mkdir(exist_ok=True)
html=(root/'index.html').read_text()

def data_url(path):
    types={'.svg':'image/svg+xml','.ipynb':'application/x-ipynb+json','.md':'text/markdown','.py':'text/x-python'}
    mime=types.get(path.suffix,'text/plain')
    return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode()

files={}
for path in sorted((root/'materials').iterdir()):
    if path.is_file():
        files['materials/'+path.name]=data_url(path)
for name in ['README.md','DESIGN.md','QA.md']:
    files[name]=data_url(root/name)
bootstrap='const embeddedFiles = '+json.dumps(files,ensure_ascii=False)+';\n'
# Package-time content is source-controlled, but avoid closing the outer script tag.
def script(text):
    return '<script>\n'+re.sub(r'</script',r'<\\/script',text,flags=re.I)+'\n</script>'
html=re.sub(r'<link rel="stylesheet" href="css/minimal.css">','<style>\n'+(root/'css/minimal.css').read_text()+'\n</style>',html)
html=html.replace('href="favicon.svg"','href="'+data_url(root/'favicon.svg')+'"')
# Material URLs and local documents must not become routes on the NoCode SPA.
ui=(root/'js/ui.js').read_text()
ui=ui.replace("    const node = document.createElement(tag);", "    if (tag === 'a' && attrs.href) {\n      const key = decodeURIComponent(attrs.href);\n      if (embeddedFiles[key]) attrs = {...attrs, href:embeddedFiles[key], download:attrs.download || key.split('/').pop()};\n    }\n    const node = document.createElement(tag);")
scripts=[]
for match in re.finditer(r'  <script defer src="(js/[^"]+)"></script>',html):
    name=match[1]
    scripts.append(ui if name=='js/ui.js' else (root/name).read_text())
assert len(scripts)==7
html=re.sub(r'  <script defer src="js/[^"]+"></script>\n','',html)
# Preserve hash-based navigation when inside a srcDoc iframe whose base URL is the host page.
navigation="""
document.addEventListener('click', event => {
  const anchor = event.target.closest('a');
  const target = anchor && anchor.getAttribute('href');
  if (target && target.startsWith('#') && target !== '#content') {
    event.preventDefault();
    location.hash = target;
  }
});
"""
html=html.replace('</body>',script(bootstrap+'\n'.join(scripts)+'\n'+navigation)+'\n</body>')
artifact=output/'agents-runtime-workshop.html'
artifact.write_text(html)
(output/'package-summary.json').write_text(json.dumps({'artifact':artifact.name,'bytes':artifact.stat().st_size,'embedded_materials':list(files),'scripts':7,'css':'inline','navigation':'srcDoc-safe hash links'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'artifact':str(artifact),'bytes':artifact.stat().st_size,'embedded_materials':len(files)},ensure_ascii=False))
