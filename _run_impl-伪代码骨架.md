# `_run_impl` 伪代码骨架（v0.24.0 / 提交 17d994bd）

行号为 `src/agents/run.py` 当前本地版本（含中文学习注释，注释会使行号小幅偏移）。

```python
async def _run_impl(...):
    准备：展开参数、包 context、连 session、开 trace
    try:
        while True:                                    # ← L1053
            # ── ① 轮前准备（鳞片重灾区）─────────────────
            if 第一轮: 配好 input guardrails（只有第一轮跑，L1070）
            sandbox 准备 / 开 trace span

            # ── ② 恢复现场专用道（鳞片，可跳过）─────────
            if run_state 里存着没走完的步骤:               # ← L1167
                重建上一轮的 turn_result（不重新调模型）
                按 next_step 分派（跟 ⑤ 一模一样）         # ← L1305-1585
                # 源码里分派写两遍，就是因为恢复时也要走一遍同样的岔路

            # ── ③ 计数闸门 ─────────────────────────────
            current_turn += 1                            # ← L1626
            if current_turn > max_turns:                 # ← L1627
                if 没配 error_handlers: raise MaxTurnsExceeded   # 默认撞墙
                else: 调你的处理器，用它给的 output 体面 return  # 装门

            # ── ④ 干这一轮的活 ─────────────────────────
            try:
                turn_result = await run_single_turn(...)  # ← L1940（第 4 层）
                #  跑起点钩子 → 收工具+收handoff(并查重名) → 组装输入
                #  (拼上轮工具结果) → 调模型 → 解析+执行工具 → 打包结果
            except 各种异常: 脱敏/持久化/取消处理（鳞片）
            把本轮新 items 存进 session（鳞片）

            # ── ⑤ 方向盘：这轮的结论，四选一 ─────────────
            if   next_step is FinalOutput:               # ← L2135
                跑 output guardrails → 构造 RunResult → return   # 收工
            elif next_step is Interruption:              # ← L2306
                保存现场 → return 中断结果（等工具审批）    # 鳞片
            elif next_step is Handoff:                   # ← L2420
                current_agent = 新Agent; 标记跑新钩子     # 换人，自然落入下一圈
            elif next_step is RunAgain:                  # ← L2432
                continue                                 # 带着工具结果再问
            else:
                raise AgentsException(未知的下一步)       # ← L2445
    except BaseException: 脱敏/trace 收尾
    finally: 模型清理
```

## 结构要点（读真源码前先记住这四条）

1. **骨架 vs 鳞片**：①②③④⑤ 里只有 ③计数、④跑一轮、⑤分派 是骨架；删掉任何一个循环都转不动。①② 以及各处的 guardrails 细节、session 持久化、trace、脱敏都是鳞片——判断方法：删掉它循环还能不能转。
2. **分派写了两遍**：恢复现场路径（L1305-1585）和正常路径（L2135-2444）各有一套 next_step 分派，选项完全相同。这是因为恢复时不需要重新调模型，直接对保存的 next_step 走岔路。
3. **计数在调用模型之前**（L1626 在 run_single_turn 之前）：每次发起一次模型调用就消耗一轮，包括“带工具结果再问一次”。max_turns=2 时，第 3 次想调模型会被闸门拦下。
4. **四个方向盘**：FinalOutput（收工 return）、RunAgain（continue 再跑）、Handoff（换 current_agent，自然落回循环）、Interruption（保存现场等审批，初学可忽略）。

## 与四层结构的对应

- 第 1 层 `Runner.run`（前台转发）→ 第 2 层 `AgentRunner.run`（装配+挑 Agent）→ 第 3 层 `_run_impl`（本骨架）→ 第 4 层 `run_single_turn`（run_loop.py:2787，④中的单轮流水线）。
