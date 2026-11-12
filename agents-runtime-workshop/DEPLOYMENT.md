# NoCode 发布与学城同步记录

日期：2026-11-12。

## NoCode

- 访问地址：https://dk0aw1.mynocode.host
- 对应版本：https://nocode.sankuai.com/dk0aw1_675abc7
- 作品 ID：cli-1cjtly7nqrhaasj9
- 发布提交：675abc78bc24d388a266f16839cd5cd3492a556f
- 权限：MEITUAN，已通过 permission get 回读。
- 更新时复用该作品，不重复创建。机器信息见 nocode-deployment.json。

采用 nocode-html-deploy-s3 Skill 的 S3 中转和 Vite ?raw + iframe srcDoc 路径。打包脚本 scripts/package-nocode.py 在 Cloud IDE /tmp/agents-runtime-workshop-20261112 中运行，产物为 dist/agents-runtime-workshop.html（333089 字节）。CSS、7 份脚本和 12 份资料均已内嵌，资料下载和 iframe 内的 hash 导航经过专门检查。

通过 nocode files get 读回 src/assets/tutorialContent.txt，与本地打包产物对照，除 CLI 输出裁掉末尾换行外正文相同。首页相对导入 ../assets/tutorialContent.txt?raw，保留原工程和登录机制；没有用运行时 fetch HTML。

nocode deploy 返回成功。另读取生产入口和对应 JS，确认标题、教程章节、srcDoc 及内嵌 Notebook 已进入生产资源。Cloud IDE Chromium 实际访问生产域名，验证 iframe 渲染、章节导航、天气步骤、源码选择和展开实验记录，结果 PASS。记录与截图：qa/nocode-live.json、qa/nocode-live.png。

首次无登录浏览器的生产访问未显示正文。进一步捕获控制台确认，浏览器拒绝网站请求 local 地址空间的内网 S3 资源。仅在测试浏览器上下文中向该站点授予 local-network-access 权限后，线上验证通过；没有关闭 TLS/CORS 或更改发布内容。首次诊断截图 qa/nocode-live-diagnostic.png 保留。如果听众浏览器询问本地网络/内网资源访问，需允许该站点访问内网资源。

NoCode Agent 未自行构建/提交，最终由 NoCode deploy 执行平台发布，以上版本是实际返回的发布版本。CLI 自动生成的推广描述含无关功能，不作为网站功能证据。

## 学城

- 文档：https://km.sankuai.com/collabpage/2798054960
- 标题：深入 OpenAI Agents SDK：从一次模型调用到 Agent Runtime
- 原文档为空白，版本 0；写入后回读版本 1。

通过 citadel 的 getDocumentCitadelMd → updateDocumentByMd 流程写入最新 notes_optimized.md；保留已有标题和空段落节点 ID。仅整理标题层级、段落/表格样式，并在学城版把行内标识改为加粗。针对转换器会把 __init__ 误识别为下划线的行为，用 CitadelMD 的文字样式宏保留原始字符，未修改转换后的底层 JSON。

写入前、写入后回读均比对可见正文与顺序，165 个代码/图示块内容一致，文档只有一个标题节点。本地 notes_optimized.md 没有因本次同步而修改。Mermaid 内容保留为原始代码块，不宣称已转成学城原生流程图。
