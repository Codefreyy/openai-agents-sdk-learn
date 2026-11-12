"""同一个工具故障，比较两种错误处理配置。"""

from agents import Agent, RunConfig, Runner, UserError, function_tool
from agents.testing import ScriptedModel, assistant_message, function_call


def unstable_tool(value: str) -> str:
    """模拟一次业务查询。"""
    print(f"进入工具｜ value={value}")
    raise ValueError("模拟数据库故障")


def run_case(label, tool):
    # 每组从第一轮重新开始。两组都使用相同的预设工具请求和预设回答。
    model = ScriptedModel([
        [function_call("unstable_tool", {"value": "test"}, call_id="call_1")],
        [assistant_message("预设的最终回答")],
    ])
    agent = Agent(name="实验 Agent", model=model, tools=[tool])
    print(label)
    try:
        result = Runner.run_sync(
            agent, "调用工具处理 test", run_config=RunConfig(tracing_disabled=True)
        )
    except UserError as error:
        print(f"调用方收到｜ {type(error).__name__}: {error}")
    else:
        for item in model.calls[1].input:
            if item.get("type") == "function_call_output":
                print("次轮回传｜", item["output"])
        print("最终回答｜", result.final_output)
    print(f"模型调用｜ {len(model.calls)} 次")


if __name__ == "__main__":
    run_case("A · 默认错误处理", function_tool(unstable_tool))
    run_case("B · 关闭错误转换", function_tool(unstable_tool, failure_error_function=None))
