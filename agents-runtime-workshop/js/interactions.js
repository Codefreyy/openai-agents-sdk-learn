const Interactions = (() => {
  const {el, code, panel, source, sourceLinks} = UI;
  function journey() {
    const steps = [
      {name:'接收用户输入',title:'先建立这一次 Run',text:'Runner 收到 Agent 配置和用户输入。它为本次运行准备状态；Agent 配置负责声明可用能力。',code:'input = "东京天气怎么样？"\ncurrent_agent = weather\ncurrent_turn = 0',key:'init'},
      {name:'第一次模型调用',title:'模型提出一个操作请求',text:'ScriptedModel 按预设返回 function_call。普通模型场景中，这是模型根据请求与工具声明生成的调用意图。',code:'{\n  "type": "function_call",\n  "name": "get_weather",\n  "arguments": "{\\"city\\":\\"Tokyo\\"}",\n  "call_id": "call_1"\n}',key:'retry'},
      {name:'SDK 执行工具',title:'本地执行器接过请求',text:'SDK 找到工具，处理 JSON 参数并执行函数。固定实验的工具函数返回 sunny, 14-20C；这不是实时天气。',code:'get_weather(city="Tokyo")\n→ "Tokyo: sunny, 14-20C"\n\n本地工具函数执行次数：1',key:'tool-call'},
      {name:'工具结果写回历史',title:'把结果与请求关联起来',text:'call_id 指向刚才的调用。模型没有直接访问函数，它会在后续输入里看到这个结果。',code:'{\n  "type": "function_call_output",\n  "call_id": "call_1",\n  "output": "Tokyo: sunny, 14-20C"\n}',key:'history'},
      {name:'第二次模型调用',title:'带着已有结果，再调用模型',text:'NextStepRunAgain 让 Runner 继续。第二次输入包含用户消息、工具请求和结果，轮次增加到 2。',code:'input = [\n  user_message,\n  function_call,\n  function_call_output\n]\ncurrent_turn = 2',key:'again'},
      {name:'最终输出与收尾',title:'候选输出进入结束分支',text:'模拟模型返回预设最终文字。Runner 根据 NextStepFinalOutput 完成必要输出校验与收尾，返回 RunResult。',code:'final_output: scripted final answer\nmodel_calls: 2\ntool_invocations: ["Tokyo"]',key:'final'},
    ];
    let current = 0;
    const nav = el('div', {className:'journey-steps', 'aria-label':'天气请求步骤'});
    const detail = el('div', {className:'journey-detail', 'aria-live':'polite'});
    const previous = el('button', {type:'button', onclick:() => {current--; render();}}, '上一步');
    const next = el('button', {type:'button', className:'primary', onclick:() => {current++; render();}}, '下一步');
    const counter = el('span', {className:'step-counter'});
    function render() {
      nav.replaceChildren(...steps.map((step,i) => el('button', {type:'button', 'aria-pressed':String(current===i), onclick:() => {current=i; render();}}, el('span', {className:'step-number'}, String(i+1).padStart(2,'0')), step.name)));
      const step = steps[current];
      detail.replaceChildren(el('h3', {}, step.title), el('p', {}, step.text), code(step.code, '固定场景示意'), sourceLinks([step.key]));
      previous.disabled = current===0;
      next.disabled = current===steps.length-1;
      counter.textContent = `${current+1} / ${steps.length}`;
    }
    render();
    return panel('天气请求 · 跟着执行走一遍', el('div', {className:'journey'}, nav, detail),
      el('div', {className:'interactive-controls'}, previous, next, el('button', {type:'button', onclick:() => {current=0; render();}}, '重置'), counter));
  }
  function explorer() {
    const positions = [
      ['00a','runner','公开入口'],['00b','delegate','委托运行器'],['00c','agent-run','内部准备'],['01','configuration','选择配置 Agent'],['02','core-call','核心实现'],['03','init','初始化'],['04','loop','循环'],['05','limit','轮次上限'],['06a','first-turn','首轮'],['06b','later-turn','后续轮次'],['07','history','历史'],['08','final','结束'],['09','interrupt','中断'],['10','handoff-branch','交接'],['11','again','继续'],
    ];
    const selectors=el('div', {className:'source-selector', 'aria-label':'源码讲解位置'});
    const detail=el('div');
    function pick(index) {
      selectors.replaceChildren(...positions.map((item,i) => el('button', {type:'button', 'aria-pressed':String(i===index), onclick:()=>pick(i)}, `${item[0]} ${item[2]}`)));
      const [number,key] = positions[index];
      const marker=sourceData.markers.find(m=>m.text.startsWith(`*${number} `));
      detail.replaceChildren(source(key), el('p', {className:'marker-note'}, marker ? `本地讲解标记：# ${marker.text}（导出时位于 run.py:${marker.line}）` : '这是对应标记的源码上下文。'),
        el('p', {className:'marker-note'}, '上方片段来自固定提交；本地注释行号可能随编辑变化。01 选择的是工具配置准备所用的 configuration_agent，完整运行状态在 _run_impl 中维护。'));
    }
    pick(0);
    return panel('源码导航 · 与 # * 搜索顺序对照', el('div', {className:'interactive-body'}, selectors, detail));
  }
  function tools() {
    const scenarios = {
      valid:{json:'{"city":"Tokyo"}',title:'参数有效，进入函数体',text:'函数执行一次，返回固定天气；结果封装后交给下一次模型调用。',stages:['JSON 解析','参数校验通过','执行函数','工具结果'],output:'tool_invocations: ["Tokyo"]\ntool_output: Tokyo: sunny, 14-20C',verified:true},
      invalid:{json:'{"city":123}',title:'类型校验失败，函数体未执行',text:'现有实验的默认错误配置将失败转换为通用工具结果，之后继续一次模拟模型调用。',stages:['JSON 解析','参数校验失败','函数体未执行','错误结果'],output:'tool_invocations: []\ntool_output: An error occurred while running the tool. Please try again.',verified:true},
      missing:{json:'{}',title:'缺少必填 city：等待你验证',text:'从参数模型可以预测会在参数准备阶段失败。这是课后挑战，现有保存日志未包含本场景的运行记录。',stages:['JSON 解析','预期参数校验失败','待运行验证'],output:'这里不展示编造的运行输出。',verified:false},
    };
    const select=el('select', {id:'argument-case'}, el('option', {value:'valid'}, '字符串 city'), el('option', {value:'invalid'}, '数字 city'), el('option', {value:'missing'}, '缺少 city'));
    const output=el('div', {className:'sim-outcome', 'aria-live':'polite'});
    function render() {
      const s=scenarios[select.value];
      output.replaceChildren(code(s.json,'模型请求中的 arguments'), el('div', {className:'sim-stages'}, s.stages.map(t=>el('span',{},t))), el('h3',{},s.title), el('p',{},s.text), code(s.output,s.verified?'已有日志摘录 · 网页为模拟':'待验证场景'), sourceLinks(['tool-args']));
    }
    select.addEventListener('change',render);
    render();
    return panel('换一种参数，预测执行结果', el('div', {className:'interactive-body'}, el('div', {className:'select-row'},el('label',{for:'argument-case'},'工具声明 city: str；选择一个请求：'),select),output));
  }
  function branches() {
    const cases=[
      ['NextStepRunAgain','current_agent 不变\n    ↓\n带着工具结果，进入下一轮','此场景对应已有正常工具实验。','again'],
      ['NextStepHandoff','current_agent = specialist\n    ↓\n使用目标 Agent 的配置继续','已有日志中的 triage → specialist 路径完成了切换。','handoff-branch'],
      ['NextStepInterruption','返回 interruptions 与运行现场\n    ↓\n调用方审批后再恢复','这里只有源码与笔记分析；审批恢复尚无本次保存实验结果。','interrupt'],
      ['NextStepFinalOutput','输出护栏与其他收尾\n    ↓\n返回 RunResult','FinalOutput 是候选结束结果，还需完成相应校验和收尾。','final'],
    ];
    const options=el('div', {className:'branch-options'}), detail=el('div',{'aria-live':'polite'});
    function pick(i) {
      options.replaceChildren(...cases.map((c,j)=>el('button',{type:'button','aria-pressed':String(i===j),onclick:()=>pick(j)},c[0])));
      const c=cases[i];
      detail.replaceChildren(el('div',{className:'branch-visual'},c[1]),el('p',{className:'lab-explanation'},c[2]),sourceLinks([c[3]]));
    }
    pick(0);
    return panel('选择一个 NextStep，看控制权去哪',el('div',{className:'interactive-body'},options,detail));
  }
  function hooks() {
    const events=[['llm_start','过滤输入后、发起模型调用前','llm-start'],['llm_end','本版本非流式主线中，经延迟调用逻辑触发','llm-end'],['tool_start','本地函数工具执行前','tool-hooks'],['tool body','执行实际 Python 工具函数','tool-call'],['tool_end','本地工具得到结果后','tool-end']];
    const nav=el('div',{className:'event-list'}), detail=el('div',{'aria-live':'polite'});
    function pick(i) {
      nav.replaceChildren(...events.map((e,j)=>el('button',{type:'button','aria-pressed':String(i===j),onclick:()=>pick(j)},e[0])));
      const [name,text,key]=events[i];
      detail.replaceChildren(el('h3',{},name),el('p',{},text),source(key));
    }
    pick(0);
    return panel('一次正常工具路径中的事件顺序',el('div',{className:'interactive-body'},nav,detail,el('p',{className:'provenance'},'顺序取自保存的 TOOL HOOK EVENTS。网页只展示第一轮；日志还包含第二轮 llm_start → llm_end。')));
  }
  function labs() {
    const cases=[
      {name:'正常天气工具',question:'模型调用几次、工具执行几次？',options:['模型 1 次 / 工具 1 次','模型 2 次 / 工具 1 次','模型 2 次 / 工具 2 次'],answer:1,text:'工具结果进入第二次模型输入。最终文字是脚本预设值。',match:'baseline'},
      {name:'错误参数',question:'city 是数字时，函数体会执行吗？',options:['执行后再检查','不会执行，但会产生默认错误结果','不会执行，也不会再调用模型'],answer:1,text:'保存日志的 tool_invocations 为空；默认错误结果交给下一次模拟模型调用。',match:'invalid parameter'},
      {name:'工具异常',question:'默认错误转换开启时，这条实验路径会怎样？',options:['所有异常都立即终止 Run','生成通用工具错误结果，再调用模型','自动修复工具代码'],answer:1,text:'只证明这条默认配置路径；显式处理器、超时和取消不能直接类推。',match:'tool exception'},
      {name:'轮次上限',question:'max_turns=2，预设三次工具请求，工具实际执行几次？',options:['1 次','2 次','3 次'],answer:1,text:'两次工具已经执行。尝试继续时触发 MaxTurnsExceeded，不会撤销已执行的副作用。',match:'repeat until max_turns'},
      {name:'Agent 交接',question:'triage 交接后，RunResult.last_agent 是谁？',options:['triage','specialist','没有最后一个 Agent'],answer:1,text:'日志显示 LAST AGENT: specialist，两个 Agent 各有一次模型调用。',match:'handoff'},
    ];
    const select=el('select',{id:'lab-case'},cases.map((c,i)=>el('option',{value:String(i)},c.name)));
    const body=el('div');
    let selected=null;
    function render() {
      selected=null;
      const c=cases[Number(select.value)];
      const results=el('div',{'aria-live':'polite'});
      const choices=el('div',{className:'lab-predictions'});
      const reveal=el('button',{type:'button',className:'primary',disabled:true},'查看已有记录');
      choices.append(...c.options.map((label,i)=>el('button',{type:'button',onclick:(event)=>{
        selected=i;
        for(const b of choices.children)b.classList.remove('selected');
        event.currentTarget.classList.add('selected');
        reveal.disabled=false;
        results.replaceChildren();
      }},label)));
      reveal.addEventListener('click',()=>{
        const filename=c.match==='handoff'?'agent_handoff_hooks_experiment.log':'weather_loop_experiment.log';
        const log=sourceData.logs[filename];
        const excerpt=c.match==='handoff'?log:log.split(`=== ${c.match} ===`)[1].split('\n=== ')[0].trim();
        results.replaceChildren(el('p',{className:'lab-explanation'},selected===c.answer?'预测与保存日志一致。':'预测与保存日志不同，看看执行记录。'),code(excerpt,'已有实测日志 · 2026-11-06 Cloud IDE'),el('p',{className:'lab-explanation'},c.text),UI.material('下载完整原始日志',filename));
      });
      body.replaceChildren(el('h3',{},c.question),el('p',{className:'lab-hint'},'先选择你的预测，再展开记录。这里只读保存结果，不发起模型或 Python 请求。'),choices,reveal,results);
    }
    select.addEventListener('change',render);
    render();
    const container=panel('实验台 · 预测 → 已有记录 → 解释',el('div',{className:'interactive-body'},el('div',{className:'select-row'},el('label',{for:'lab-case'},'选择实验'),select),body));
    container.querySelector('.mode').textContent='交互阅读 · 保存日志';
    return container;
  }
  return {journey,source:explorer,tools,branches,hooks,labs};
})();
