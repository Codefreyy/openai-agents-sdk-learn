# OpenAI Agents SDK 源码学习

研究基线：OpenAI Agents SDK Python v0.24.0，commit **17d994bd3045dae71acda676a4ef4762ed8ecd94**。

## 当前入口

- [主笔记](notes_optimized.md)：分享主线及逐步补充的源码实验。
- [最小 Agent 示例](hello_agent.py)：从本机忽略文件 `.openai-api-key` 读取 API Key，运行一次 Agent 并输出回答。
- [天气请求与停止策略](experiments/weather_turn.py)：先观察两轮模型交互，再加 `--stop` 比较最终输出。运行步骤见主笔记开头的「自学路线」。
- [工具异常对照实验](experiments/tool_error_experiment.py)：已记录默认错误处理和异常传播的实际结果，供后续学习。
- [听众练习本](Agent运行循环-互动练习.ipynb)及[使用说明](Agent运行循环-互动练习-使用说明.md)。
- [SDK 源码](openai-agents-python/)：包含本地阅读注释。
- [教程网站](agents-runtime-workshop/README.md)：网站源码及发布信息。

## 保留的材料

- notes.md：原始学习笔记。
- experiments/legacy/：早期实验脚本、运行日志与源码观察补丁，供网站导出材料使用。
- notebook-validation/2026-11-12-dual-route/ 与[双路线验收记录](Agent运行循环-互动练习-双路线-验收.md)：当前 Notebook 的验证依据。
- agents-sdk-course-notebooks：课程目录链接。

已替代的旧草稿、旧验收与旧版验证输出已从工作区移除，历史内容仍可从 Git 提交 **c9a46f6** 查阅。网站 materials/ 保留发布时快照，独立于当前主笔记与 Notebook。
