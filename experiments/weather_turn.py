import argparse
import os
from pathlib import Path

from agents import Agent, RunConfig, RunHooks, Runner, function_tool


@function_tool
def get_weather(city: str) -> str:
    return f"{city}：阴天"


class ObserveCalls(RunHooks):

    async def on_llm_start(self, context, agent, system_prompt, input_items):
        print("\n模型调用前｜指令", system_prompt)
        for item in input_items:
            if item.get("role") == "user":
                print("用户输入｜", item.get("content"))
            if item.get("type") == "function_call_output":
                print("工具结果交回模型｜", item.get("output"))

    async def on_llm_end(self, context, agent, response):
        for item in response.output:
            if item.type == "function_call":
                print("模型请求工具｜", item.name, item.arguments)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stop", action="store_true", help="直接用工具结果结束")
    args = parser.parse_args()

    key_file = Path(__file__).resolve().parent.parent / ".openai-api-key"
    os.environ["OPENAI_API_KEY"] = key_file.read_text().strip()

    agent = Agent(
        name="天气助手",
        instructions="先用工具查询天气，再用简短中文给出户外运动建议。",
        model="gpt-4.1",
        tools=[get_weather],
        tool_use_behavior="stop_on_first_tool" if args.stop else "run_llm_again",
    )
    result = Runner.run_sync(
        agent,
        "明天上海适合户外运动吗？",
        hooks=ObserveCalls(),
        run_config=RunConfig(tracing_disabled=True),
    )

    for item in result.new_items:
        if item.type == "tool_call_output_item":
            print("本地工具返回｜", item.output)
    print("模型调用次数｜", len(result.raw_responses))
    print("最终回答｜", result.final_output)
