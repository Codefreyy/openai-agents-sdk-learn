const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.WORKSHOP_PLAYWRIGHT);
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'dist/agents-runtime-workshop.html'),'utf8');
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>NoCode wrapper test</title><iframe id="host" title="Agent Runtime" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>');});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const b=await chromium.launch({executablePath:process.env.WORKSHOP_CHROMIUM,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const p=await b.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}`);await p.locator('#host').evaluate((node,text)=>node.srcdoc=text,html);
  const f=p.frameLocator('#host');await f.locator('[data-lesson="start"]').waitFor();
  for(const id of ['weather','runner','model','tools','control','hooks','labs','design']){
   await f.locator(`#chapter-nav a[href="#${id}"]`).click();await f.locator(`[data-lesson="${id}"]`).waitFor();
  }
  assert.equal(await p.locator('iframe').count(),1);
  await f.locator('#chapter-nav a[href="#weather"]').click();await f.getByRole('button',{name:'下一步',exact:true}).click();
  assert.ok((await f.locator('.journey-detail').innerText()).includes('function_call'));
  await f.locator('a[href="#resources"]').first().click();await f.getByRole('heading',{name:'每个结论，都有来处'}).waitFor();
  const downloadPromise=p.waitForEvent('download');await f.getByRole('link',{name:'下载本次随站练习本'}).click();const download=await downloadPromise;
  await download.saveAs(path.join(root,'qa/downloaded-notebook.ipynb'));
  const notebook=JSON.parse(fs.readFileSync(path.join(root,'qa/downloaded-notebook.ipynb'),'utf8'));assert.ok(notebook.cells.length>10);
  assert.equal(await f.locator('a[download]').evaluateAll(nodes=>nodes.every(n=>n.href.startsWith('data:'))),true);
  assert.deepEqual(errors,[]);
  await p.screenshot({path:path.join(root,'qa/nocode-package.png'),fullPage:false});
  fs.writeFileSync(path.join(root,'qa/nocode-package.log'),'PASS: single-file srcDoc renders all chapters; hash navigation stays inside one iframe; interactive weather step works; embedded notebook downloads and parses; all material links use embedded data; no page exceptions\n');
  console.log('PASS: srcDoc package, navigation, interaction and embedded downloads');
 }finally{await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
