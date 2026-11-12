const UI = (() => {
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (key === 'className') node.className = value;
      else if (value !== null && value !== false) node.setAttribute(key, value === true && !key.startsWith('aria-') ? '' : String(value));
    }
    node.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
    return node;
  }
  const external = (label, href) => el('a', {href, target: '_blank', rel: 'noopener noreferrer'}, label);
  const material = (label, name) => el('a', {href: `materials/${encodeURIComponent(name)}`, download: name}, label);
  function code(text, label = '教学伪代码', numberedAt = null) {
    const body = el('code');
    if (numberedAt === null) body.textContent = text;
    else text.split('\n').forEach((line, i) => body.append(el('span', {className:'source-line'}, el('span', {className:'line-no', 'aria-hidden':true}, String(numberedAt + i)), line)));
    return el('div', {className:'code-box'}, el('div', {className:'code-label'}, label), el('div', {className:'code-scroll', tabindex:'0', 'aria-label':label}, el('pre', {}, body)));
  }
  function sourceLinks(keys) {
    return el('div', {className:'source-links'}, keys.map(key => {
      const s = sourceData.snippets[key];
      return external(`${s.title} ↗`, s.url);
    }));
  }
  function source(key) {
    const s = sourceData.snippets[key];
    return el('div', {className:'source-detail'},
      el('div', {className:'source-caption'}, el('strong', {}, s.title), `${s.file}:${s.line} · 固定提交 ${s.commit.slice(0,8)}`),
      code(s.code, '真实源码摘录 · 仅显示相邻片段', s.line),
      external('在 GitHub 查看完整上下文 ↗', s.url));
  }
  function table(data) {
    return el('div', {className:'table-scroll', tabindex:'0', 'aria-label':'对照表'}, el('table', {},
      el('thead', {}, el('tr', {}, data.head.map(label => el('th', {scope:'col'}, label)))),
      el('tbody', {}, data.rows.map(row => el('tr', {}, row.map(text => el('td', {}, text)))))));
  }
  function panel(title, ...children) {
    return el('section', {className:'interactive'},
      el('div', {className:'interactive-head'}, el('strong', {}, title), el('span', {className:'mode'}, '可交互 · 教学模拟')), ...children);
  }
  let timer;
  function toast(text) {
    const node = document.getElementById('toast');
    node.textContent = text;
    node.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { node.hidden = true; }, 3200);
  }
  return {el, external, material, code, sourceLinks, source, table, panel, toast};
})();
