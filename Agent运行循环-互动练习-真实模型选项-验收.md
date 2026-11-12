# 可选真实模型路线验收

日期：2026-11-12。本文记录在全文跟练版之后追加的选项，不覆盖此前的实验与失败记录。

## 改动

Notebook 从 63 个单元、28 个代码单元扩展为 68 个单元、30 个代码单元。保留十章 ScriptedModel 主线，在末尾添加真实模型配置、天气工具实验、Handoff 实验及对比说明。

- 默认 RUN_REAL_MODEL = False；全文运行不会读取密钥或调用真实模型。
- 天气与 Handoff 使用相同的可配置模型接入；支持 Responses 与 Chat Completions 两种适配器，SDK 仍固定在 0.24.0。
- 密钥支持 Colab Secrets、已有环境变量和运行时隐藏输入；示例没有保存密钥。
- 两种实验记录实际 Hooks 事件、模型轮次和最终输出；Handoff 还显示 last_agent。不假定真实模型必然调用工具或交接。
- 天气函数始终返回固定教学数据；退款只说明流程。
- SDK 与客户端自动重试均为 0，Trace 导出关闭，max_turns=5。没有将轮次限制宣称为费用上限。

## 执行位置与源码同步

- SSH：cloud-ide-codex，远端 zsh -l。
- 本次独立目录：/tmp/agents-sdk-live-option-20261112。
- 使用既有独立环境：/tmp/agents-sdk-full-workshop-20261112/env。
- 核对 SDK 仓库 origin 为 https://github.com/openai/openai-agents-python，提交为 17d994bd3045dae71acda676a4ef4762ed8ecd94。
- 本机更新后的 ipynb 与验证脚本先复制到本次远端目录，验证后取回日志、结果和带输出 Notebook；分享版 ipynb 保持 outputs 为空、execution_count 为 null。
- Python 3.11.11，openai-agents 0.24.0。具体依赖沿用全文跟练版的独立环境，没有修改其他项目环境。

## 验证结果

Cloud IDE 执行命令：

```sh
cd /tmp/agents-sdk-live-option-20261112
IPYTHONDIR=/tmp/agents-sdk-full-workshop-20261112/ipython \
JUPYTER_PATH=/tmp/agents-sdk-full-workshop-20261112/kernel/share/jupyter \
  /tmp/agents-sdk-full-workshop-20261112/env/bin/python execute_notebook.py
/tmp/agents-sdk-full-workshop-20261112/env/bin/python validate_live_option.py
```

两个命令退出码均为 0。

1. 新内核顺序运行：30 / 30 代码单元完成。真实调用关闭分支正确跳过。
2. 使用 httpx2.MockTransport 和假 Key，在真实 OpenAI 客户端、SDK 模型适配器及 Runner 之间验证 14 个场景，全部通过。
3. Responses、Chat Completions 各验证天气工具与 Handoff，共 4 条成功路径：工具或交接执行后，结果进入第二次模型请求，得到最终输出；事件与最终 Agent 符合模拟接口响应。
4. 两种协议各验证 401、429、400、连接失败，共 8 条失败路径；显示对应提示，每个场景仅一次模拟 HTTP 请求，没有自动重试。
5. 验证默认关闭时不读取密钥，以及缺少环境变量时给出提示。

模拟接口决定返回内容，只证明接入代码与控制流符合这些接口样例，不证明真实模型会做相同决策。验证过程真实模型请求数为 0，没有使用用户凭据或产生模型调用费用。

证据位于 notebook-validation/2026-11-12-real-model-option/，包括执行器、模拟接口验证脚本、原始日志、结果 JSON 和执行后 Notebook。

## 未验证和发布状态

- 未使用真实 API Key，未验证任何账号的模型权限、配额、模型质量或具体网关兼容性。
- 未在 Colab 页面操作 Secrets、隐藏输入或实际运行；Cloud IDE 的通过不等于 Colab 页面实测。
- 官方 Key 使用参考：https://developers.openai.com/api/docs/quickstart 。模型示例沿用原笔记 gpt-4.1，是否可用以听众账号为准。
- 本次为本地 Notebook 更新，没有推送 GitHub，也没有重新发布 NoCode 网站的下载快照。

## 后续补充：运行时隐藏输入 API Key

KEY_SOURCE 默认改为 masked_input，沿用 getpass 读取并移除首尾空白。开启真实模型后运行天气或 Handoff 实验，提示输入 OpenAI API Key；无需将 Key 填入代码或预先配置 Colab Secrets。每次运行真实实验重新输入。Secrets 和环境变量仍为可选方式。此前误加的问题输入框已撤回，实验问题恢复为原示例字符串。

验证目录为 /tmp/agents-sdk-key-input-20261112，更新后的 Notebook 已同步到该目录，环境与 SDK 基线沿用上文。执行 execute_notebook.py 与 validate_agents_key_input.py，退出码均为 0：全文 30 / 30 代码单元通过，14 个接口模拟场景通过。两种协议的天气、Handoff 和错误处理使用模拟 getpass 输入的假 Key 接入，确认客户端收到对应 Key；默认关闭分支不读取密钥。未使用真实凭据、未发起真实模型请求，未实测 Colab 隐藏输入框界面。

本次证据见 notebook-validation/2026-11-12-key-input/。此节为当时的验证记录；GitHub 当前版本以 main 分支实际内容为准。
