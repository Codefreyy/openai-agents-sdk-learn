"""Deterministic handoff and lifecycle demonstrations; no real model calls."""
import asyncio
from agents import Agent, Handoff, RunConfig, RunHooks, Runner, function_tool
from agents.testing import ModelStep, ScriptedModel
from openai.types.responses import ResponseFunctionToolCall
from weather_loop_experiment import answer, call


class EventRecorder(RunHooks):
    def __init__(self):
        self.events = []

    async def on_llm_start(self, context, agent, system_prompt, input_items):
        self.events.append(f"llm_start:{agent.name}")

    async def on_llm_end(self, context, agent, response):
        self.events.append(f"llm_end:{agent.name}")

    async def on_tool_start(self, context, agent, tool):
        self.events.append(f"tool_start:{tool.name}")

    async def on_tool_end(self, context, agent, tool, result):
        self.events.append(f"tool_end:{tool.name}")

    async def on_handoff(self, context, from_agent, to_agent):
        self.events.append(f"handoff:{from_agent.name}->{to_agent.name}")


async def tools_and_hooks():
    events = EventRecorder()
    @function_tool
    def get_weather(city: str) -> str:
        """Return illustrative weather."""
        events.events.append(f"tool_body:{city}")
        return f"{city}: sunny"
    model = ScriptedModel([ModelStep(output=[call('{"city":"Tokyo"}')]), ModelStep(output=[answer("scripted final")])])
    agent = Agent(name="weather", tools=[get_weather], model=model)
    result = await Runner.run(agent, "Tokyo weather?", hooks=events, run_config=RunConfig(tracing_disabled=True))
    expected = ["llm_start:weather", "llm_end:weather", "tool_start:get_weather", "tool_body:Tokyo", "tool_end:get_weather", "llm_start:weather", "llm_end:weather"]
    print("TOOL HOOK EVENTS:", " -> ".join(events.events))
    assert events.events == expected, events.events
    assert result.final_output == "scripted final"
    print("TOOL HOOK ASSERTIONS: PASS")


async def handoff():
    events = EventRecorder()
    target_model = ScriptedModel([ModelStep(output=[answer("scripted specialist answer")])])
    target = Agent(name="specialist", model=target_model)
    handoff_name = Handoff.default_tool_name(target)
    request = ResponseFunctionToolCall(id="h1", call_id="h1", type="function_call", name=handoff_name, arguments="{}")
    source_model = ScriptedModel([ModelStep(output=[request])])
    source = Agent(name="triage", model=source_model, handoffs=[target])
    result = await Runner.run(source, "route the request", hooks=events, run_config=RunConfig(tracing_disabled=True))
    print("HANDOFF TOOL:", handoff_name)
    print("HANDOFF EVENTS:", " -> ".join(events.events))
    print("LAST AGENT:", result.last_agent.name)
    print("MODEL CALLS:", len(source_model.calls), len(target_model.calls))
    assert result.last_agent.name == "specialist"
    assert events.events == ["llm_start:triage", "llm_end:triage", "handoff:triage->specialist", "llm_start:specialist", "llm_end:specialist"]
    assert len(source_model.calls) == len(target_model.calls) == 1
    print("HANDOFF ASSERTIONS: PASS")


async def main():
    await tools_and_hooks()
    await handoff()


if __name__ == "__main__":
    asyncio.run(main())
