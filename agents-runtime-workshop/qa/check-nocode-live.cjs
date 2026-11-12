const fs=require('node:fs');
const {chromium}=require('/tmp/agents-runtime-workshop-qa-20261112/node_modules/playwright-core');
(async()=>{
 const b=await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await b.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  await context.grantPermissions(['local-network-access'],{origin:'https://dk0aw1.mynocode.host'});
  const p=await context.newPage();
  await p.goto('https://dk0aw1.mynocode.host',{waitUntil:'domcontentloaded',timeout:45000});
  try{
   const f=p.frameLocator('iframe[title="Agent Runtime 源码研习"]');
   await f.locator('[data-lesson="start"]').waitFor({timeout:20000});
   await f.locator('#chapter-nav a[href="#weather"]').click();
   await f.getByRole('button',{name:'下一步',exact:true}).click();
   await f.getByRole('heading',{name:'模型提出一个操作请求'}).waitFor();
   await f.locator('#chapter-nav a[href="#runner"]').click();
   await f.getByRole('button',{name:'10 交接',exact:true}).click();
   await f.locator('#chapter-nav a[href="#labs"]').click();
   await f.locator('.lab-predictions button').nth(1).click();
   await f.getByRole('button',{name:'查看已有记录'}).click();
   await p.screenshot({path:'/tmp/agents-runtime-workshop-20261112/qa/nocode-live.png'});
   const result={url:'https://dk0aw1.mynocode.host',status:'PASS',scope:'Live iframe, chapter navigation, weather step, source selection and saved experiment reveal'};
   fs.writeFileSync('/tmp/agents-runtime-workshop-20261112/qa/nocode-live.json',JSON.stringify(result,null,2));console.log(result);
  }catch(error){
   const result={url:'https://dk0aw1.mynocode.host',status:'NOT_VERIFIED',title:await p.title(),visibleText:(await p.locator('body').innerText()).slice(0,400),reason:error.message.split('\n')[0]};
   fs.writeFileSync('/tmp/agents-runtime-workshop-20261112/qa/nocode-live.json',JSON.stringify(result,null,2));console.log(result);
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
