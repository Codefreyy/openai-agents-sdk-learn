// Run only in Cloud IDE. The site itself has no runtime dependencies.
const {chromium}=require(process.env.WORKSHOP_PLAYWRIGHT);
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const report=[];
const errors=[];
const context=vm.createContext({});
for(const name of ['siteConfig','wordData','sourceData'])vm.runInContext(fs.readFileSync(path.join(root,'js',`${name}.js`),'utf8'),context);
const data=vm.runInContext('({lessons:WordRoots,sources:sourceData,config:siteConfig})',context);
for(const lesson of data.lessons){
  assert.ok(lesson.root&&lesson.description&&lesson.takeaway&&lesson.sections.length);
  assert.ok(lesson.quiz.options.length===4&&lesson.quiz.correctAnswer>=0&&lesson.quiz.correctAnswer<4);
  for(const section of lesson.sections)for(const key of section.sourceKeys||[])assert.ok(data.sources.snippets[key],key);
}
for(const excerpt of Object.values(data.sources.snippets))assert.ok(excerpt.url.includes(data.config.commit));
report.push('PASS: 9 chapters, quizzes and fixed-commit source references');
const server=http.createServer((req,res)=>{
  const requestPath=decodeURIComponent(req.url.split('?')[0]);
  const file=path.resolve(root,`.${requestPath==='/'?'/index.html':requestPath}`);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.ipynb':'application/json; charset=utf-8'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain; charset=utf-8'});fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:process.env.WORKSHOP_CHROMIUM,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.goto(base);
    await page.getByRole('heading',{level:1}).waitFor();
    await page.screenshot({path:path.join(root,'qa','desktop.png'),fullPage:false});
    for(const item of data.lessons){
      await page.goto(`${base}/#${item.id}`);
      await page.locator(`[data-lesson="${item.id}"]`).waitFor();
      assert.equal(await page.locator('nav a[aria-current="page"]').count(),1);
      assert.equal(await page.locator('.quiz-options button').count(),4);
    }
    report.push('PASS: all 9 chapter routes render, with current navigation and quizzes');
    await page.goto(`${base}/#weather`);
    assert.equal(await page.getByRole('button',{name:'上一步',exact:true}).isDisabled(),true);
    for(let i=0;i<5;i++)await page.getByRole('button',{name:'下一步',exact:true}).click();
    await page.getByRole('heading',{name:'候选输出进入结束分支'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'下一步',exact:true}).isDisabled(),true);
    await page.screenshot({path:path.join(root,'qa','weather.png'),fullPage:false});
    await page.getByRole('button',{name:'重置',exact:true}).click();
    await page.getByRole('heading',{name:'先建立这一次 Run'}).waitFor();
    report.push('PASS: weather stepper, end boundaries and reset');
    await page.goto(`${base}/#runner`);
    for(const button of await page.locator('.source-selector button').all()){
      await button.click();assert.equal(await page.locator('.source-line').count()>0,true);
    }
    assert.ok((await page.locator('.source-detail .source-caption').innerText()).includes('run.py:'));
    report.push('PASS: all 15 teaching markers show pinned source excerpts');
    await page.goto(`${base}/#tools`);
    await page.selectOption('#argument-case','invalid');
    await page.getByRole('heading',{name:'类型校验失败，函数体未执行'}).waitFor();
    await page.selectOption('#argument-case','missing');
    await page.getByRole('heading',{name:'缺少必填 city：等待你验证'}).waitFor();
    report.push('PASS: valid/error/missing argument scenarios retain evidence boundaries');
    await page.goto(`${base}/#control`);
    for(const button of await page.locator('.branch-options button').all())await button.click();
    assert.ok((await page.locator('.branch-visual').innerText()).includes('RunResult'));
    await page.goto(`${base}/#hooks`);
    for(const button of await page.locator('.event-list button').all())await button.click();
    assert.ok((await page.locator('.interactive .source-detail').innerText()).includes('on_tool_end'));
    report.push('PASS: four NextStep choices and all lifecycle event source selections');
    await page.goto(`${base}/#labs`);
    for(let i=0;i<5;i++){
      await page.selectOption('#lab-case',String(i));
      assert.equal(await page.getByRole('button',{name:'查看已有记录'}).isDisabled(),true);
      await page.locator('.lab-predictions button').nth(1).click();
      await page.getByRole('button',{name:'查看已有记录'}).click();
      assert.ok((await page.locator('.interactive').innerText()).includes('已有实测日志'));
    }
    await page.screenshot({path:path.join(root,'qa','labs.png'),fullPage:false});
    report.push('PASS: five prediction gates reveal saved logs and explanations');
    await page.goto(`${base}/#start`);
    await page.locator('.quiz-options button').nth(0).click();
    assert.ok((await page.locator('.quiz-feedback').innerText()).includes('再对照'));
    await page.locator('.quiz-options button').nth(1).click();
    assert.ok((await page.locator('.quiz-feedback').innerText()).includes('理解正确'));
    await page.getByRole('button',{name:'标记本章已读'}).click();
    await page.reload();
    assert.ok((await page.locator('#progress-text').innerText()).includes('1 / 9'));
    await page.getByRole('button',{name:'已读 · 再点可取消'}).click();
    report.push('PASS: quiz feedback, persisted read progress and reversal');
    await page.goto(`${base}/#review`);
    await page.getByRole('button',{name:'查看解释'}).click();
    assert.ok((await page.locator('.review-card').innerText()).includes('SDK'));
    await page.getByRole('button',{name:'下一张'}).click();
    assert.ok((await page.locator('.review-position').innerText()).includes('2 / 9'));
    await page.goto(`${base}/#glossary`);
    await page.fill('#term-search','call_id');assert.equal(await page.locator('.term-row').count(),1);
    await page.fill('#term-search','找不到的术语');assert.equal(await page.locator('.term-row').count(),0);
    report.push('PASS: review-card reveal/navigation and glossary search/empty state');
    await page.goto(`${base}/#resources`);
    for(const href of await page.locator('a[download]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))))assert.equal((await page.request.get(base+'/'+href)).status(),200);
    await page.goto(`${base}/#weather`);
    await page.getByRole('button',{name:'投屏模式'}).click();
    assert.equal(await page.locator('.sidebar').isVisible(),false);
    await page.getByRole('button',{name:'退出投屏'}).hover();
    assert.equal(await page.getByRole('button',{name:'退出投屏'}).evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(32, 37, 33)');
    await page.locator('#toast').waitFor({state:'hidden'});
    await page.screenshot({path:path.join(root,'qa','presenter.png'),fullPage:false});
    await page.keyboard.press('Escape');assert.equal(await page.locator('.sidebar').isVisible(),true);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setViewportSize({width:390,height:844});
    for(const id of ['start','weather','runner','control','hooks','labs','resources']){
      await page.goto(`${base}/#${id}`);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`overflow:${id}`);
    }
    await page.goto(`${base}/#weather`);await page.locator('#toast').waitFor({state:'hidden'});await page.screenshot({path:path.join(root,'qa','mobile.png'),fullPage:true});
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.sidebar').isVisible(),false);
    await page.emulateMedia({media:'screen'});
    report.push('PASS: material downloads, presenter/Escape, 390px layout, reduced-motion and print styles');
    await page.goto(`file://${root}/index.html#start`);
    await page.locator('[data-lesson="start"] h1').waitFor();
    assert.ok((await page.locator('h1').textContent()).replace(/\s/g,'').includes('怎样跑完一个Agent？'));
    report.push('PASS: direct file:// entry works without a local server');
    await page.goto(`${base}/#start`);await page.evaluate(()=>localStorage.setItem('agents-runtime-workshop-v1','broken-json'));
    await page.reload();await page.getByRole('heading',{level:1}).waitFor();
    report.push('PASS: invalid saved progress does not prevent reading');
    assert.deepEqual(errors,[]);
    report.push('PASS: no browser console errors or uncaught page exceptions');
    fs.writeFileSync(path.join(root,'qa','browser-results.log'),report.join('\n')+'\n');
    console.log(report.join('\n'));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);fs.writeFileSync(path.join(root,'qa','browser-failure.log'),error.stack);process.exitCode=1;server.close();});
