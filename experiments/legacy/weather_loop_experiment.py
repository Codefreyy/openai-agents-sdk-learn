"""Controlled SDK study: scripted model outputs, no network model calls."""
import asyncio
import json
from agents import Agent, Runner, RunConfig, function_tool
from agents.testing import ModelStep, ScriptedModel
from openai.types.responses import ResponseFunctionToolCall, ResponseOutputMessage
from openai.types.responses.response_output_text import ResponseOutputText


def call(arguments, call_id="call_1"):
    return ResponseFunctionToolCall(id=call_id, call_id=call_id, type="function_call", name="get_weather", arguments=arguments)


def answer(text):
    return ResponseOutputMessage(id="msg_1", type="message", role="assistant", content=[ResponseOutputText(text=text, type="output_text", annotations=[], logprobs=[])], status="completed")


async def experiment(label, arguments, failure=False, repeated=False):
    invocations = []

    @function_tool
    def get_weather(city: str) -> str:
        """Return illustrative weather for a city."""
        invocations.append(city)
        if failure:
            raise RuntimeError("weather service unavailable")
        return f"{city}: sunny, 14-20C"

    steps = [ModelStep(output=[call(arguments, "call_1")])]
    if repeated:
        steps.append(ModelStep(output=[call(arguments, "call_2")]))
        steps.append(ModelStep(output=[call(arguments, "call_3")]))
    else:
        steps.append(ModelStep(output=[answer("scripted final answer")]))
    model = ScriptedModel(steps)
    agent = Agent(name="weather", instructions="Use the weather tool.", tools=[get_weather], model=model)
    print(f"\n=== {label} ===")
    try:
        result = await Runner.run(agent, "Tokyo weather?", max_turns=2 if repeated else 5, run_config=RunConfig(tracing_disabled=True))
        print("final_output:", result.final_output)
        for item in result.new_items:
            if item.type == "tool_call_output_item":
                print("tool_output:", item.output)
    except Exception as exc:
        print("exception:", type(exc).__name__, str(exc))
    print("model_calls:", len(model.calls), "tool_invocations:", json.dumps(invocations))
    if len(model.calls) > 1:
        print("second_input:", str(model.calls[1].input)[:900])


async def main():
    await experiment("baseline", '{"city":"Tokyo"}')
    await experiment("tool exception", '{"city":"Tokyo"}', failure=True)
    await experiment("invalid parameter", '{"city":123}')
    await experiment("repeat until max_turns", '{"city":"Tokyo"}', repeated=True)


if __name__ == "__main__":
    asyncio.run(main())
