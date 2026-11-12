# 全文双路线验收记录

日期：2026-11-12。当前主入口为 Agent运行循环-互动练习.ipynb，使用步骤见 Agent运行循环-互动练习-使用说明.md。此前“全文版”“末尾真实模型选项”和“问题输入框”的记录为历史版本证据。

## 本次改动

- 将模型选择移到环境检查后。MODEL_MODE 默认 scripted，无需 Key；选择 openai 后，隐藏输入一次 Key，整本常规实验复用一个当前运行时客户端。
- 删除末尾独立的真实模型路线，保持十章同一条讲解主线。
- 常规实验统一通过 make_model / make_weather_agent 创建所选模型，真实模式由 ObservedModel 记录 Model 边界的输入与指令，再转发给 SDK 官方适配器。
- 固定模拟仅有四格：ch04-invalid、ch04-tool-error、ch08-max-turns、ch08-multiple-tools。每格在正文和输出中明确说明，不改变 MODEL_MODE。
- 每个章节代码单元标明“跟随选择”“固定模拟”或“不调用模型”。只配置 Agent、展示 Schema、读源码和讨论等不发送模型请求。
- 保留 SDK 应保证的行为检查；固定轮次和指定答案仅在模拟模式断言。真实模式按事件、输入、工具执行记录与最终 Agent 解释结果。
- 对没有工具调用、没有交接、没有审批的真实响应给出对应观察，不能把未发生的路径当成已经验证。
- 审批只批准首次暂停；再次产生审批时显示 interruptions，不自动再次批准。
- 第十章最小执行器也沿用所选模型，并实际传入工具 Schema，不再以 tools=[] 让真实模型猜测函数。
- API 错误直接抛出，不自动回退；客户端和 SDK 自动重试均关闭。普通 Runner 示例轮次上限为 5，最小执行器为 3；单次模型输出上限为 400 tokens，这些不是总费用上限。
- 保留 SDK v0.24.0、固定提交源码链接和笔记十章顺序，没有修改 notes_optimized.md 或 SDK 源码。

当前 Notebook 共 88 个单元，其中 28 个代码单元；分享文件 outputs 为空、execution_count 为 null。

## 执行环境与同步

- SSH：cloud-ide-codex，使用 zsh -l。
- 本次目录：/tmp/agents-sdk-dual-route-20261112。
- 复用独立环境：/tmp/agents-sdk-full-workshop-20261112/env，Python 3.11.11、openai-agents 0.24.0。
- 固定 SDK 仓库：/root/codex-workspaces/openai-agents-sdk-study-17d994bd，origin=https://github.com/openai/openai-agents-python，HEAD=17d994bd3045dae71acda676a4ef4762ed8ecd94。保留其已有 .study-runtime 未跟踪目录。
- 本机更新的 Notebook 和测试夹具均先复制到远端，再验证；最终日志和结果已取回。没有在本机安装项目依赖或运行实验。
- 最终代码验证后仅校准一处辅助说明用语“记录输入与指令”，没有改变已验证的可执行代码。

## 验证结果

| 路线 / 场景 | 实际结果 | 证据范围 |
|---|---|---|
| 默认 scripted 全篇 | 28 / 28 代码单元完成，退出码 0 | 真实 SDK + 预设模型响应，无模型 API 请求 |
| openai 接入 / Responses | 28 个讲义代码单元及 1 个测试夹具单元完成，退出码 0 | 22 个模拟 HTTP 请求，真实客户端、适配器及 Runner；不是实际 OpenAI 服务 |
| openai 接入 / Chat Completions | 28 + 1 单元完成，退出码 0 | 22 个模拟 HTTP 请求，包含流式事件及最后的最小执行器 |
| 真实模式直接回答、无工具 | 28 + 1 单元完成，退出码 0 | Responses 模拟接口共 14 次请求；验证未交接、未审批时不误报成功或触发剧本断言 |
| 默认模式 | 通过 | 不读取 Key，不创建真实 API 客户端 |
| Key 复用 | 通过 | 每条全篇模拟 HTTP 路线 getpass_calls=1、client_constructions=1 |
| 429 错误，两种协议 | 通过 | 各一次模拟请求，抛出 RateLimitError，不重试、不切回 ScriptedModel |
| 空 Key | 通过 | 明确报错，不创建客户端、不发起请求 |

固定模拟格执行后 MODEL_MODE 仍为 openai，由后续正常格继续产生模拟 HTTP 请求。护栏阻断格的模型调用次数为 0。以上全部模拟 HTTP 验证使用假 Key，不使用用户凭据。

初次 Responses 全篇测试发现流式调用以位置参数传入 Model.stream_response，教学观察器仅接收关键字参数，导致 TypeError。已按固定版本 Model 接口补齐参数签名，并重新通过上述全篇验证；首次失败日志和执行后 Notebook 已保留。

远端主要命令（均在本次目录运行，IPYTHONDIR 与 JUPYTER_PATH 指向既有独立测试内核）：

```sh
/tmp/agents-sdk-full-workshop-20261112/env/bin/python execute_notebook.py
/tmp/agents-sdk-full-workshop-20261112/env/bin/python execute_dual_mock.py responses
/tmp/agents-sdk-full-workshop-20261112/env/bin/python execute_dual_mock.py chat_completions
/tmp/agents-sdk-full-workshop-20261112/env/bin/python execute_dual_mock.py responses direct
/tmp/agents-sdk-full-workshop-20261112/env/bin/python validate_route_safety.py
```

## 使用用户 Key 的真实试调用：未通过，网络阻塞

已按用户授权尝试真实调用，模型为 gpt-4.1。Key 经关闭终端回显的 SSH 标准输入传递，仅保存在本次进程内存，不写入命令参数、环境文件、Notebook、仓库或日志。

版本检查、模式配置、辅助代码和 Agent 配置通过。首个天气请求在模型边界尝试一次后报 APIConnectionError；天气工具没有执行，后续 Handoff、审批和流式真实请求未运行。脚本未自动重试，也未用模拟结果替代真实成功。

独立的无凭据连通性检查得到：

- Python httpx2 请求 https://api.openai.com/v1/models：ConnectError，底层为 Errno 101 / Network is unreachable。
- curl -4 请求同一地址：HTTP 000，连接超时。

没有获得服务端认证或模型响应，不能判断 Key 的有效性、账号额度或模型权限。本次没有完成真实模型路径端到端验收。真实尝试发生在双路线初版，随后修正了流式观察器签名和普通调用轮次参数；因网络阻塞未重复发送用户 Key。

没有回退到本机运行，也没有换服务器或使用第三方代理。网络恢复后仍需在最终 Notebook 上重新验证真实请求。

## 证据与未验证范围

本次原始结果、夹具、执行器、首次失败和真实试调用摘要均保存在 notebook-validation/2026-11-12-dual-route/。带输出 Notebook 是明确标注的测试证据；听众应使用根目录的空输出版本。

- 未在 Colab 页面实际点击运行、输入 Key，或测试任何真实网关。
- 未验证真实模型决策质量、实际天气/退款、审批拒绝与重复批准、跨进程恢复、取消、Retry、所有工具类型或平台 Trace 导出。
- GitHub 和 Colab 版本以 main 分支实际内容为准；NoCode 下载资源未重新发布。
