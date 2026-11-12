const Views = (() => {
  const {el, external, material, code, table} = UI;
  function section(data) {
    const block=el('section',{className:'chapter-section'},el('h2',{},data.title));
    if(data.label)block.append(el('p',{className:'provenance'},data.label));
    for(const text of data.paragraphs||[])block.append(el('p',{},text));
    if(data.bullets)block.append(el('ul',{},data.bullets.map(text=>el('li',{},text))));
    if(data.table)block.append(table(data.table));
    if(data.code)block.append(code(data.code,data.label||`${data.language==='text'?'流程示意':'教学代码'} · 对照正文阅读`));
    if(data.sourceKeys)block.append(UI.sourceLinks(data.sourceKeys));
    if(data.evidence)block.append(el('p',{className:'provenance'},'证据：',material(data.evidence,data.evidence)));
    return block;
  }
  function quiz(data) {
    const feedback=el('p',{className:'quiz-feedback','aria-live':'polite'});
    const options=el('div',{className:'quiz-options'});
    options.append(...data.options.map((label,i)=>el('button',{type:'button',onclick:(event)=>{
      for(const item of options.children){item.classList.remove('selected');item.setAttribute('aria-pressed','false');}
      event.currentTarget.classList.add('selected');event.currentTarget.setAttribute('aria-pressed','true');
      feedback.textContent=(i===data.correctAnswer?'理解正确。':'再对照一下执行主体与范围。')+data.explanation;
    },'aria-pressed':'false'},`${String.fromCharCode(65+i)}. ${label}`)));
    return el('section',{className:'quiz'},el('div',{className:'quiz-label'},'停一下，检查理解'),el('h2',{},data.question),options,feedback);
  }
  function lesson(item,index,completed,onToggle) {
    const content=el('article',{'data-lesson':item.id});
    content.append(el('div',{className:'chapter-meta'},el('span',{className:'index'},String(index+1).padStart(2,'0')),item.origin));
    if(index===0){
      content.append(el('h1',{className:'hero-title'},'一次请求，',el('span',{},'怎样跑完一个 Agent？')));
      content.append(el('p',{className:'chapter-lede'},siteConfig.hero.subtitle));
      content.append(el('div',{className:'hero-line'},el('a',{className:'hero-arrow',href:'#weather','aria-label':'进入天气请求演示'},'→'),el('a',{href:'#weather'},'从天气请求开始'),el('span',{},'或先认识三个角色')));
    }else content.append(el('h1',{},item.root));
    content.append(el('p',{className:'chapter-lede'},item.description));
    if(item.interactive)content.append(Interactions[item.interactive]());
    content.append(...item.sections.map(section));
    content.append(el('aside',{className:'takeaway'},el('small',{},'这一段，带走什么'),el('p',{},item.takeaway)));
    content.append(quiz(item.quiz));
    const mark=el('button',{type:'button','aria-pressed':String(completed.has(item.id)),onclick:()=>onToggle(item.id,mark)},completed.has(item.id)?'已读 · 再点可取消':'标记本章已读');
    const nav=el('div',{className:'navigation-actions'});
    if(index>0)nav.append(el('a',{href:`#${WordRoots[index-1].id}`,className:'button-link'},'← 上一章'));
    nav.append(el('a',{href:index<WordRoots.length-1?`#${WordRoots[index+1].id}`:'#resources',className:'button-link primary'},index<WordRoots.length-1?'下一章 →':'查看材料与证据 →'));
    content.append(el('div',{className:'chapter-bottom'},el('p',{className:'chapter-next'},item.next),el('div',{className:'chapter-actions'},mark,nav)));
    return content;
  }
  function glossaryView() {
    const query=el('input',{type:'search',id:'term-search',className:'glossary-search',placeholder:'搜索术语或解释，例如“轮次”“模型”','aria-label':'搜索术语'});
    const results=el('div',{'aria-live':'polite'});
    function render() {
      const items=glossary.filter(row=>row.join(' ').toLowerCase().includes(query.value.toLowerCase().trim()));
      results.replaceChildren(...items.map(([name,meaning,id])=>el('div',{className:'term-row'},el('h3',{},name),el('div',{},el('p',{},meaning),el('a',{href:`#${id}`},'回到对应章节 →')))));
      if(!items.length)results.append(el('p',{className:'empty'},'没有匹配的术语，试试中文解释或英文名称。'));
    }
    query.addEventListener('input',render);render();
    return el('article',{},el('div',{className:'chapter-meta'},'阅读辅助 / 术语索引'),el('h1',{},'把名字放回流程里'),el('p',{className:'chapter-lede'},'先理解它负责哪一段，再记住它叫什么。解释来自本教程的限定场景。'),query,results);
  }
  function review() {
    let current=0,flipped=false;
    const card=el('div',{className:'review-card','aria-live':'polite'}),position=el('p',{className:'review-position'});
    const flip=el('button',{type:'button',className:'primary',onclick:()=>{flipped=!flipped;render();}},'查看解释');
    function render() {
      const item=WordRoots[current];
      position.textContent=`${current+1} / ${WordRoots.length} · ${item.origin}`;
      card.replaceChildren(el('small',{},flipped?'解释':'先用自己的话回答'),el('h2',{},item.quiz.question));
      if(flipped)card.append(el('p',{},item.quiz.explanation),el('a',{href:`#${item.id}`},'回到章节与源码 →'));
      flip.textContent=flipped?'回到问题':'查看解释';
    }
    function move(delta){current=(current+delta+WordRoots.length)%WordRoots.length;flipped=false;render();}
    render();
    return el('article',{},el('div',{className:'chapter-meta'},'阅读辅助 / 复习卡'),el('h1',{},'离开图，自己讲一遍'),el('p',{className:'chapter-lede'},'不用背函数名。试着说明执行主体、数据怎样流动，以及结论的边界。'),position,card,el('div',{className:'review-controls'},el('button',{type:'button',onclick:()=>move(-1)},'上一张'),flip,el('button',{type:'button',onclick:()=>move(1)},'下一张')));
  }
  function resources() {
    const root=el('article',{},el('div',{className:'chapter-meta'},'材料与证据 / 研究边界'),el('h1',{},'每个结论，都有来处'),el('p',{className:'chapter-lede'},'原始笔记、固定源码和保存的实验记录可以互相对照。教学模拟帮助理解，实际行为仍要看对应版本与运行证据。'));
    function row(title,text,...links){return el('section',{className:'resource-row'},el('h3',{},title),el('p',{},text),el('div',{className:'resource-links'},links));}
    root.append(row('原始学习笔记','保留制作期间第五章的新补充；此文件是最新材料快照，网站未改写原笔记。',material('下载完整 Markdown','notes_optimized.md')));
    root.append(row('固定源码 · v0.24.0','所有“真实源码摘录”由 git show 从固定提交导出。网站按行链接到对应版本；本地 # * 注释采用单独行号。',external('打开固定提交 ↗',`https://github.com/openai/openai-agents-python/tree/${siteConfig.commit}`),el('a',{href:'#runner'},'沿 # * 标记阅读')));
    root.append(row('互动 Notebook','随站版和本次核对的 GitHub 版均有可运行的安装单元格。在线文件 SHA 为 3e206f38…，具体核对记录见 QA.md；Colab 全新环境从安装到执行仍待实测。',material('下载本次随站练习本','Agent运行循环-互动练习.ipynb'),external('在 Colab 打开 GitHub 版 ↗',siteConfig.notebook)));
    root.append(el('p',{className:'notice'},'GitHub main 是可变版本。本次核对的文件仍保存两条旧报错；它们不代表你当前的 Colab 运行失败。请从安装单元格按序执行，再看本次产生的输出。'));
    root.append(row('工具与轮次实验','固定天气、参数错误、工具异常和轮次上限。模型响应由 ScriptedModel 编排，未调用真实模型。',material('Python 脚本','weather_loop_experiment.py'),material('完整运行日志','weather_loop_experiment.log')));
    root.append(row('Hooks 与交接实验','保存正常工具调用与 triage → specialist 路径的断言结果；不覆盖所有重试、并发和恢复路径。',material('Python 脚本','agent_handoff_hooks_experiment.py'),material('完整运行日志','agent_handoff_hooks_experiment.log')));
    root.append(row('亲手修改 SDK 的观察点','独立学习 worktree 中增加 next_step 类型打印。该日志不是未修改 SDK 的输出，也不代表用户已亲自完成实验。',material('教学修改补丁','源码观察-next-step.patch'),material('修改后运行日志','源码观察-next-step-CloudIDE运行记录.log')));
    root.append(section({title:'笔记、源码与证据的差异',table:{head:['位置','网站如何处理'],rows:[['第五章','采用用户新补充的 Handoff 章节；源码行号重新从固定提交提取'],['第四章','笔记只写到装饰器入口，参数和执行路径标为新增源码核对'],['第八章','笔记为真实模型实验设计；网站实验台用已有 ScriptedModel 日志'],['旧 handoff 注释','恢复分支的“不消耗轮次”不概括所有调用；普通新轮次仍受上限约束'],['llm_end','注明非流式路径的延迟调用与恢复边界'],['动态 main 链接 / 行号','原笔记保留；网站实际源码入口统一链接固定提交'],['LangGraph 对比','保留设计分析，不宣称完成同版本功能对照']]}}));
    root.append(section({title:'进一步阅读',paragraphs:['以下官方资料可能随时间更新，用于补充阅读，不覆盖本教程的固定版本源码结论。']}));
    root.append(el('div',{className:'source-links'},external('Handoffs ↗','https://openai.github.io/openai-agents-python/handoffs/'),external('Lifecycle hooks ↗',`https://github.com/openai/openai-agents-python/blob/${siteConfig.commit}/src/agents/lifecycle.py`),external('Tracing ↗','https://openai.github.io/openai-agents-python/tracing/')));
    root.append(row('制作与验收记录','包括本次覆盖范围、实际命令、交互与布局验证、尚未验证事项。',el('a',{href:'DESIGN.md'},'阅读网站设计'),el('a',{href:'QA.md'},'阅读验收记录')));
    return root;
  }
  return {lesson,glossary:glossaryView,review,resources};
})();
