import os
from pathlib import Path

from agents import Agent, Runner, set_tracing_disabled


key_file = Path(__file__).with_name(".openai-api-key")
os.environ["OPENAI_API_KEY"] = key_file.read_text().strip()

set_tracing_disabled(True)  # 暂时关闭 Trace，先关注最基本的运行流程

agent = Agent(name="助手", instructions="请用简洁的中文回答。", model="gpt-4.1")
result = Runner.run_sync(agent, "你好，请用一句话介绍你自己。")

print(result.final_output)
