# 全文互动练习使用说明

入口为同目录 Agent运行循环-互动练习.ipynb。本文按 notes_optimized.md 的十章思路重做了原来的四个运行循环练习；旧内容中的正常工具、错误参数、轮次上限和 Handoff 均已保留并融入对应章节。

## 听众如何打开

在 Colab 上传 ipynb，或在此文件推送到 GitHub 后，使用已有 Colab/GitHub 链接。先保存自己的副本，然后从安装单元格顺序运行。网站已发布的下载资源是此前的快照，不会因为本地文件修改自动更新；GitHub 和 NoCode 的共享版本需在确认新版后同步。

主线不需要 API Key。ScriptedModel 返回预设响应，但 Runner、FunctionTool、Handoff、Session、RunState、Hooks、护栏和事件处理由真实 SDK 执行。模拟天气、用户和退款全部是教学数据。最后的真实 API 尝试默认关闭；Trace 示例只写入内存处理器。

## 对应关系和现场安排

| 笔记章节 | 跟练内容 | 建议 |
|---|---|---|
| 1 为什么需要 SDK | Agent 配置、工具对象，观察创建后调用数为 0 | 主线 |
| 2 Agent Loop | 天气工具两轮执行、历史与 call_id、打印实际源码位置 | 主线 |
| 3 模型调用 | 自定义 Provider 记录模型名，验证 RunConfig 优先级 | 主线 |
| 4 Tool Execution | 包装与 Schema、参数错误、工具异常、stop_on_first_tool | 前两项主线，后两项可课后 |
| 5 Handoff | triage → specialist，与 Agent.as_tool 对照 | 主线 |
| 6 状态 | 模拟审批暂停并恢复；Context 和 SQLiteSession 对照 | 审批主线，Context/Session 可课后 |
| 7 生命周期 | hooks 顺序、模型输入过滤、顺序护栏、Streaming、内存 Trace | hooks 主线，其余扩展 |
| 8 边界实验 | max_turns、多工具与轮次计数 | 主线 |
| 9 设计取舍 | 职责判断和 API / SDK / 显式工作流讨论 | 收束讨论 |
| 10 总结应用 | 整体链路复述，自己运行一个最小执行循环 | 课后可继续修改循环 |

## 讲解节奏

每节先让听众预测，再一起运行，看输出后只改一个参数重跑。`assert` 用来表达原始预期；故意修改行为时需要同步调整预期。每个实验单元重新创建模拟模型和 Agent，避免模型脚本被消费后再次运行最后一行导致混淆。

文章源码链接固定在研究提交 17d994bd3045dae71acda676a4ef4762ed8ecd94。Notebook 使用发行包 0.24.0；显示加载路径和版本，并用 inspect 读取实际安装代码，不把包版本号当成提交完全相同的证明。

## 验证与边界

实际结果记录在同目录 Agent运行循环-互动练习-全文版-CloudIDE运行记录.log 和 Agent运行循环-互动练习-全文版-验收.md。

本次不验证真实模型决策质量、真实天气/退款、恢复拒绝与再次审批、跨进程恢复、故障取消、网络 Retry、全部工具类型、OpenAI 平台 Trace 导出或 LangGraph。第十章最小执行器只用于展示控制流，省略生产执行器需要的 Schema、校验、审批和异常边界。
