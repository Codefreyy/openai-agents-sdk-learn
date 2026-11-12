const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const scope=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'js/sourceData.js'),'utf8'),scope);
const data=vm.runInContext('sourceData',scope);
const files=new Map();
for(const excerpt of Object.values(data.snippets)){
  if(!files.has(excerpt.file))files.set(excerpt.file,cp.execFileSync('git',['-C',process.env.WORKSHOP_SDK,'show',`${data.commit}:${excerpt.file}`],{encoding:'utf8'}).split('\n'));
  const lines=files.get(excerpt.file),size=excerpt.code.split('\n').length;
  assert.equal(lines.slice(excerpt.line-1,excerpt.line-1+size).join('\n'),excerpt.code,excerpt.title);
}
const result=`PASS: ${Object.keys(data.snippets).length} source excerpts exactly match ${data.commit}; line offsets verified against Cloud IDE checkout\n`;
fs.writeFileSync(path.join(root,'qa/source-verification.log'),result);
console.log(result);
