# 网站验收记录

日期：2026-11-12。交付为本地网站，没有部署、发布或推送。

## 源码与材料基线

- 学习仓库本机分支 main，基准提交 11e4d04508e1876e5b18310b3129408b6aef0151；notes_optimized.md 和 SDK 子目录已有未提交改动，均予以保留。
- SDK 本机分支 learn-agents-sdk-v0.24.0，HEAD 为 17d994bd3045dae71acda676a4ef4762ed8ecd94。学习注释可能使工作区行号变化。
- 网站 36 个真实源码片段全部用 git show 从上述固定 SDK 提交提取；另附本机 run.py 的 15 个 # * 讲解标记。两种行号明确分开。
- 用户在制作期间补充了第五章，网站与 materials/notes_optimized.md 已采用该补充；未修改用户原笔记。
- 既有 SDK 实验日志日期为 2026-11-06。网站验收没有重新宣称运行真实模型，也没有新增 SDK 实验结果。

## 执行环境与同步

通过 SSH 别名 cloud-ide-codex，在同一台 Cloud IDE 执行。已核对远端 SDK origin 为 https://github.com/openai/openai-agents-python，固定提交与本机一致。使用 zsh -l 加载 PATH，Node 为 v22.23.3。

/root 文件系统 inode 已满（4194304 / 4194304）；在该分区创建网站验收目录首次失败。改用同一 Cloud IDE 的独立目录：

/tmp/agents-runtime-workshop-20261112

网站全部文件及后续变更明确复制到该目录后再验证。浏览器验收依赖安装在 /tmp/agents-runtime-workshop-qa-20261112，不安装到本机，也不打包进网站。截图和日志已取回本地 qa/。临时 HTTP 服务只绑定 127.0.0.1，验收结束自动关闭。

## 实际命令与结果

```sh
# Cloud IDE 安装验收工具，网站本身零依赖
npm_config_cache=/tmp/agents-runtime-workshop-npm-cache \
  npm install --prefix /tmp/agents-runtime-workshop-qa-20261112 \
  --no-audit --no-fund playwright-core@1.58.2

cd /tmp/agents-runtime-workshop-20261112
for file in js/*.js; do node --check "$file" || exit; done

WORKSHOP_SDK=/root/codex-workspaces/openai-agents-sdk-study-17d994bd \
  node qa/verify-source.cjs

WORKSHOP_PLAYWRIGHT=/tmp/agents-runtime-workshop-qa-20261112/node_modules/playwright-core \
WORKSHOP_CHROMIUM=/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome \
  node qa/browser-check.cjs
```

以上最终退出码均为 0。源码比对结果在 qa/source-verification.log；浏览器结果在 qa/browser-results.log 和 qa/run-final.log。

## 已验证范围

1. 九个章节路由正常显示，导航状态与章节内容一致。
2. 天气请求逐步播放、上下步边界与重置。
3. 15 个讲解标记均显示源码片段，36 个片段的文本与行号逐一匹配远端固定 Git 提交。
4. 参数有效、类型错误、缺少参数三个场景区分已验证与待验证。
5. 四种 NextStep 选择、五个生命周期事件源码选择。
6. 五个实验先预测，再显示保存日志与解释；未点击预测时不能展开结果。
7. 每章四选一测验的反馈和解析。
8. 阅读标记保存、刷新恢复及取消；损坏的本机存储数据不阻止阅读。
9. 复习卡揭示与翻页，术语搜索及空结果。
10. 所有材料下载入口返回 200。
11. 投屏模式及 Esc 退出、选中按钮悬停对比度。
12. 390px 视口下主文档无横向溢出；桌面 1440px、投屏及手机截图已人工查看。代码区允许内部横向滚动。
13. 减少动态效果设置下仍可阅读，打印时隐藏导航与交互控件。
14. 直接 file:// 打开 index.html 可显示内容，无需静态服务器。
15. 覆盖路径未出现控制台错误或未捕获异常。

## 首次失败与修正

- qa/run-first.log 和 qa/browser-failure.log 保留首次浏览器检查失败：可访问名称会在跨行标题中补一个空格，导致 file:// 页面的标题文本匹配超时。诊断确认本地文件页内容已正常加载；检查改为验证实际章节容器和标题文本。没有删掉该项验收。
- 截图人工检查发现选中按钮在悬停时变成浅背景与白字，已修正 CSS 并增加投屏按钮悬停背景检查；最终浏览器运行通过。
- Cloud IDE 的专用 Python 读取 GitHub API 时证书链校验失败，记录在 qa/notebook-link-check-remote-ssl.json。没有关闭 TLS 校验；改用本机 curl 进行只读公开文件核对。项目运行与浏览器验证仍在 Cloud IDE。

## Notebook 链接核对

通过 GitHub Contents API 实时读取，文件存在；当时文件 SHA：

3e206f38323055b0c18eb869c4e232d4f6e72ac6

有 7 个代码单元，包含可运行的 %pip install "openai-agents==0.24.0"。文件还保存了 2 条旧错误输出，不能用这些保存输出判断当前 Colab 是否失败。详细机器记录见 qa/notebook-link-check.json。

GitHub 仓库中的文件可获取，不等于已经验证 Colab 运行时。Colab 从全新环境安装到全部运行仍未实测；页面明确注明。在线 main 是可变入口，与随网站打包的下载版可能有差异。

## 内容差异与研究边界

- 主要结构来自笔记，网站重组为九章教学路线；完整笔记作为材料保留。
- 工具参数和实际执行细节补充固定源码依据，标明新增；第四章原笔记未被擅自扩写。
- 采用用户新补充的 Handoff 章节，重点区分 SDK 的 FunctionTool / Handoff 对象与 API 的 FunctionToolParam 协议数据结构。
- 本机旧注释把恢复处理分支中的 handoff 描述成“不消耗轮次”；不能推广为普通模型调用也不计数。网站说明普通新轮次在模型调用前计数，并链接固定代码。
- on_llm_end 在固定非流式版本中有延迟调用、校验和恢复逻辑，网站没有承诺所有路径上都紧挨 HTTP 返回执行。
- 笔记第八章是另一组真实模型实验代码及预期；网站实验台仅展示已有 ScriptedModel 日志。
- 审批恢复、序列化、stop_on_first_tool、并行取消没有本次新增实测，不以动画证明这些能力。
- LangGraph 相关表述为笔记设计分析，没有宣称同版本功能矩阵或性能评测。
- 未验证真实模型行为、线上部署、完整辅助技术可访问性、所有浏览器兼容性或本地 Safari/VS Code Webview。浏览器实测为 Cloud IDE Chromium。
