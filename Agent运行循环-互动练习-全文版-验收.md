# 全文跟练版验收记录

日期：2026-11-12。

## 结果

同名练习本已从原来的 17 个单元、7 个代码单元，扩展为 63 个单元、28 个代码单元，覆盖笔记十章。

Cloud IDE 最终从新启动的内核顺序执行，28 / 28 个代码单元完成，退出码 0，没有错误输出或未执行的代码单元。最后一个可选单元执行了“跳过真实 API”分支；真实模型调用没有验证。

分享用 ipynb 的 outputs 均为空、execution_count 均为 null。带执行输出的版本和失败记录单独保存在 notebook-validation/2026-11-12-full-article/，不应当作听众的运行结果。

## 环境与源码

- SSH：cloud-ide-codex；远端使用 zsh -l 加载 PATH。
- 目录：/tmp/agents-sdk-full-workshop-20261112。
- Python 3.11.11，独立 venv，最初确认 importlib.util.find_spec('agents') 为 None。
- 预先仅为执行器安装 ipykernel、nbclient、nbformat；SDK 由 Notebook 的第一个安装单元安装。
- SDK 为发行包 openai-agents==0.24.0，实际加载位置为独立环境 site-packages/agents，未使用旧工作区的 editable 安装或 PYTHONPATH 覆盖。
- pip 使用 Cloud IDE 默认包镜像。已确认公开 PyPI 存在 0.24.0，但没有声称完成公共 PyPI 网络到 Colab 的运行实测。
- 远端固定 SDK 仓库 origin 为 https://github.com/openai/openai-agents-python，提交 17d994bd3045dae71acda676a4ef4762ed8ecd94。
- 将安装包的 run.py、agent.py、tool.py、run_config.py、lifecycle.py、run_loop.py、turn_resolution.py、tool_execution.py、run_state.py、testing/model.py 与固定提交逐文件比较，10 / 10 一致；范围不等于整个 wheel 的全部内容。
- 具体安装版本与模块范围见 notebook-validation/2026-11-12-full-article/installed-runtime.json。

## 实际执行

核心命令在 Cloud IDE 执行：

```sh
cd /tmp/agents-sdk-full-workshop-20261112
IPYTHONDIR=/tmp/agents-sdk-full-workshop-20261112/ipython \
JUPYTER_PATH=/tmp/agents-sdk-full-workshop-20261112/kernel/share/jupyter \
  ./env/bin/python execute_notebook.py
```

执行器先检查代码语法，再通过 nbclient 使用 agents-full-study 内核从头执行。每次运行都是新内核，不保留前次 Notebook 变量。源文件先从本机复制到远端，最终日志、执行结果和执行后 Notebook 已取回。

最终结果：success=true，cells=63，code_cells=28，executed_code_cells=28，real_api_call_enabled=false。

## 本次有实测结果的场景

- 创建 Agent 后模型和工具均未执行。
- 天气函数执行一次，模型两轮，第二次输入包含 function_call_output。
- RunConfig.model 覆盖 Agent.model，Provider 收到覆盖后的名称。
- 装饰器返回 FunctionTool，保存 Schema 与执行回调而未调用函数。
- 数字 city 被拒绝，函数体未执行；默认错误结果进入下一次模型调用。
- 默认工具异常转换、stop_on_first_tool 直接输出。
- Handoff 改变 last_agent，as_tool 后主 Agent 继续。
- 一次内存审批：暂停前工具未执行，批准恢复后执行一次，模型合计两次调用。
- Context 不自动进入第一次模型输入；通过工具结果进入后续输入。
- SQLiteSession 在两次 Run 之间提供历史。
- 正常工具路径的 hooks 顺序、模型输入过滤。
- 顺序输入护栏阻断时模型调用数为 0。
- ScriptedModel 流式输出的 raw / run-item / agent-updated 事件及最终完成状态。
- 只写内存的 Trace/Span processor，不上传外部 Trace。
- max_turns=2 的上限，两工具请求仍只占一个模型轮次。
- 自写最小执行器通过 Model 边界两轮完成函数调用与结果回传。

第九章职责判断与第十章复述是理解练习，不属于额外的 SDK 功能证明。

## 失败与修复记录

没有删去失败单元或重试到绿来掩盖问题。保留每次有效失败，并按原因修复：

1. execution-first.log：Session 示例发现专用 Python 缺少 _sqlite3。此前安装单元和前半段实验已成功。问题属于 Cloud IDE 的 Python 构建，不属于 SDK/Notebook 的 Session API。
2. 从 SQLite 官方 amalgamation 3.45.3 与同一 CPython 3.11.11 源码构建标准 _sqlite3 扩展，仅安装到本次独立 venv。首次编译因系统 GCC 默认 C90 报错，补充 -std=gnu11 后成功。没有修改系统 Python、旧 SDK 目录或其他任务。
3. execution-second.log：发现生成 Notebook 时两个字符串的换行转义失误。修正输入过滤和复述单元的字符串，并加入运行前语法检查。
4. 专用 Python 恢复 SQLite 后，IPython 历史默认写入 inode 耗尽的 /root 出现警告；将本次内核的 IPYTHONDIR 指向独立 /tmp 目录，未清理其他目录。
5. execution-third.log：自写最小执行器直接调用 ScriptedModel.get_response 时缺少 previous_response_id、conversation_id、prompt；补齐显式 None 后，最终全篇运行通过。

最终记录见同目录 Agent运行循环-互动练习-全文版-CloudIDE运行记录.log。

## 未验证与同步状态

- 没有在 Google Colab 页面实际点击运行，因此不能把 Cloud IDE 的通过等同于 Colab 运行时验证。
- 没有运行真实模型、平台 Trace 导出、审批拒绝/重复审批、跨进程恢复、取消/Retry 或 LangGraph。
- Notebook、使用说明和验证记录目前为本地改动；未推送 GitHub。
- NoCode 网站中的 Notebook 下载是发布时的快照，本次未重打包发布；不会自动跟随本地文件更新。
- 使用说明给出了推送后使用原 Colab 链接，或直接上传该 ipynb 的方式。

## 学城第四章

在制作练习本期间，已将用户新补充的第四章单独同步到学城 2798054960；其他章节在原 CitadelMD 上保留。新版第四章 65 个代码/图示块与正文经导入前检查，并在写入后回读核对一致。只合并了重复的章节标题、整理层级及学城版行内样式，本地原笔记未改写。
