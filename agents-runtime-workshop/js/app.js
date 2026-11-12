(() => {
  const {el}=UI;
  const validIds=new Set(WordRoots.map(item=>item.id));
  const storageKey='agents-runtime-workshop-v1';
  let storageAvailable=true;
  let completed=new Set();
  try {
    const stored=JSON.parse(localStorage.getItem(storageKey)||'[]');
    if(Array.isArray(stored))completed=new Set(stored.filter(id=>validIds.has(id)));
  }catch{storageAvailable=false;}
  const main=document.getElementById('content');
  const nav=document.getElementById('chapter-nav');
  const presenter=document.getElementById('presenter');
  function updateProgress() {
    document.getElementById('progress-text').textContent=`${completed.size} / ${WordRoots.length}`;
    document.getElementById('reading-progress').value=completed.size;
    document.getElementById('storage-note').textContent=storageAvailable?'进度仅保存在当前浏览器':'当前浏览器无法保存进度，本次阅读仍可继续';
  }
  function toggle(id,button) {
    if(completed.has(id))completed.delete(id);else completed.add(id);
    try{localStorage.setItem(storageKey,JSON.stringify([...completed]));}catch{storageAvailable=false;}
    button.textContent=completed.has(id)?'已读 · 再点可取消':'标记本章已读';
    button.setAttribute('aria-pressed',String(completed.has(id)));
    updateProgress();
  }
  function render() {
    const route=location.hash.slice(1)||'start';
    if(route==='content')return;
    const index=WordRoots.findIndex(item=>item.id===route);
    nav.replaceChildren(...WordRoots.map((item,i)=>el('a',{href:`#${item.id}`,'aria-current':i===index?'page':null},el('span',{className:'chapter-num'},String(i+1).padStart(2,'0')),item.root)));
    for(const link of document.querySelectorAll('.side-tools a')){
      if(link.hash===location.hash)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    }
    if(index>=0){
      main.replaceChildren(Views.lesson(WordRoots[index],index,completed,toggle));
      document.getElementById('position').textContent=`章节 ${index+1} / ${WordRoots.length} · ${WordRoots[index].root}`;
      document.title=`${WordRoots[index].root} · ${siteConfig.siteName}`;
    }else if(['glossary','review','resources'].includes(route)){
      main.replaceChildren(Views[route]());
      const label={glossary:'术语索引',review:'复习卡',resources:'材料与证据'}[route];
      document.getElementById('position').textContent=label;document.title=`${label} · ${siteConfig.siteName}`;
    }else{
      main.replaceChildren(el('article',{},el('h1',{},'这个位置没有章节'),el('p',{},'可以从导航回到学习主线。'),el('a',{href:'#start'},'回到开始 →')));
      document.getElementById('position').textContent='未找到章节';
    }
    updateProgress();
    window.scrollTo({top:0,behavior:'instant'});
    main.focus({preventScroll:true});
    const active=nav.querySelector('[aria-current]');
    if(active&&window.innerWidth<761)active.scrollIntoView({block:'nearest',inline:'center'});
  }
  presenter.addEventListener('click',()=>{
    const active=document.body.classList.toggle('presenting');
    presenter.setAttribute('aria-pressed',String(active));
    presenter.textContent=active?'退出投屏':'投屏模式';
    UI.toast(active?'投屏模式已开启；Esc 可退出':'已回到阅读模式');
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&document.body.classList.contains('presenting'))presenter.click();
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.target.closest('input,select,button,a,[contenteditable="true"],pre'))return;
    const index=WordRoots.findIndex(item=>`#${item.id}`===location.hash);
    if(event.key==='ArrowRight'&&index>=0&&index<WordRoots.length-1){event.preventDefault();location.hash=WordRoots[index+1].id;}
    if(event.key==='ArrowLeft'&&index>0){event.preventDefault();location.hash=WordRoots[index-1].id;}
  });
  document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
  window.addEventListener('hashchange',render);
  render();
})();
