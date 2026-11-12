# Agent Runtime 源码研习网站

用于现场技术分享与课后阅读。基于 notes_optimized.md、OpenAI Agents SDK Python v0.24.0 的固定提交及已有 ScriptedModel 实验记录。

## 打开网站

直接用浏览器打开本目录的 **index.html**，无需安装依赖、配置 API Key 或启动服务。JavaScript、样式和内容均在本地，源码及 Colab 外链需要网络。

也可以使用静态 HTTP 服务打开。站点本身无构建步骤；按当前约定，依赖安装、项目运行与验收在 Cloud IDE 进行。已发布到 NoCode：https://dk0aw1.mynocode.host 。发布版本与验收细节见 DEPLOYMENT.md。

## 推荐现场顺序

1. 第一章用上海户外运动问题介绍模型、Agent 和 Runtime。
2. 第二章按“下一步”逐步展示 Tokyo 固定天气实验；请听众辨认执行主体。
3. 第三章沿本地 # * 标记与固定源码片段讲 Runner 入口和循环。
4. 第四、五章分别展开模型调用与 FunctionTool 参数、执行路径。
5. 第六章讲 NextStep、Handoff 与状态对象；对应新补充的第五章笔记。
6. 第七章沿时间线看公开 hooks、模型输入过滤与其他扩展位置。
7. 第八章先预测，再看保存日志；可打开资料页下载 Notebook 跟练。
8. 第九章总结设计取舍，列出进一步阅读与实验任务。

右上角“投屏模式”会扩大正文并收起侧栏；按 Esc 退出。章节正文获得焦点时，可用左右方向键切换章节。交互控件聚焦时不接管方向键。术语索引、复习卡、带解析测验与阅读进度用于课后自学；阅读进度只保存于当前浏览器。

## 文件组织

- index.html：入口与页面框架。
- css/minimal.css：黄色、纸色与深色代码区的响应式样式。
- js/wordData.js：九章内容、测验和术语。
- js/siteConfig.js：主题、版本和 Notebook 入口。
- js/sourceData.js：由脚本生成的固定提交源码、讲解标记和原始日志数据。
- js/ui.js、interactions.js、views.js、app.js：安全 DOM 组件、交互、页面、路由及进度。
- materials/：原笔记和已有练习/实验的快照，未修改原文件。
- scripts/sync-evidence.py：从 git show 导出固定源码和最新材料，不执行 SDK。
- DESIGN.md：结构、证据边界和设计决定。
- QA.md、qa/：实际检查命令、结果、首次失败与修正、截图。

网站正文是从笔记重组的讲义，不是原文全文替代品。第四章未展开的部分和 hooks 接口补充均注明新增源码依据；第五章采用制作期间的最新补充。附带完整 Markdown 可供逐节查阅。

## 更新材料

编辑内容主要修改 js/wordData.js；更新源码/日志快照时运行 scripts/sync-evidence.py。脚本默认读取网站父目录的 openai-agents-python，也支持 --source 参数，固定提交不会自动跟随 main。

网页内的演示只模拟流程，实验台只展示保存日志。新实验必须真实执行并记录结果后再加入“已验证”范围。Notebook 的在线 main 会变化，分享前应再次核对；全新 Colab 安装与运行尚未实测。

源码摘录保留 OpenAI Agents SDK 的 MIT 许可证，见 materials/openai-agents-python-LICENSE.txt。
