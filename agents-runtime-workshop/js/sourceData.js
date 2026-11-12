const sourceData = {
  "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94",
  "snippets": {
    "runner": {
      "title": "Runner.run · 公开入口",
      "file": "src/agents/run.py",
      "line": 281,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L281",
      "code": "    async def run(\n        cls,\n        starting_agent: Agent[TContext],\n        input: str | list[TResponseInputItem] | RunState[TContext],\n        *,\n        context: TContext | None = None,\n        max_turns: int | None = DEFAULT_MAX_TURNS,\n        hooks: RunHooks[TContext] | None = None,\n        run_config: RunConfig | dict[str, Any] | None = None,\n        error_handlers: RunErrorHandlers[TContext] | None = None,\n        previous_response_id: str | None = None,\n        auto_previous_response_id: bool = False,\n        conversation_id: str | None = None,\n        session: Session | None = None,\n    ) -> RunResult:\n        \"\"\"",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "delegate": {
      "title": "委托默认 AgentRunner",
      "file": "src/agents/run.py",
      "line": 349,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L349",
      "code": "        runner = DEFAULT_AGENT_RUNNER\n        redacted_error: BaseException | None = None\n        try:\n            return await runner.run(\n                starting_agent,\n                input,\n                context=context,\n                max_turns=max_turns,\n                hooks=hooks,\n                run_config=run_config,\n                error_handlers=error_handlers,\n                previous_response_id=previous_response_id,\n                auto_previous_response_id=auto_previous_response_id,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "agent-run": {
      "title": "AgentRunner.run · 内部准备",
      "file": "src/agents/run.py",
      "line": 574,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L574",
      "code": "    async def run(\n        self,\n        starting_agent: Agent[TContext],\n        input: str | list[TResponseInputItem] | RunState[TContext],\n        **kwargs: Unpack[RunOptions[TContext]],\n    ) -> RunResult:\n        run_config, owns_model_provider = _normalize_run_config_for_runner(kwargs.get(\"run_config\"))\n        cast(dict[str, Any], kwargs)[\"run_config\"] = run_config\n        redacted_error: BaseException | None = None\n        # Mask caller tracing before any run-owned preparation or cleanup can execute.\n        with contextlib.ExitStack() as trace_stack:\n            try:",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "configuration": {
      "title": "选择配置准备所用 Agent",
      "file": "src/agents/run.py",
      "line": 604,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L604",
      "code": "                    configuration_agent = (\n                        input._current_agent\n                        if isinstance(input, RunState) and input._current_agent is not None\n                        else starting_agent\n                    )\n                    with agent_tool_configuration_run(configuration_agent):\n                        return await self._run_impl(starting_agent, input, **kwargs)\n                except BaseException as error:",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "core-call": {
      "title": "委托 _run_impl",
      "file": "src/agents/run.py",
      "line": 610,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L610",
      "code": "                        return await self._run_impl(starting_agent, input, **kwargs)\n                except BaseException as error:\n                    if not _is_error_data_redacted(error):\n                        raise\n                    _detach_data_redacted_error_traceback(error)\n                    redacted_error = error\n            finally:\n                if owns_model_provider:",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "impl": {
      "title": "AgentRunner._run_impl",
      "file": "src/agents/run.py",
      "line": 629,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L629",
      "code": "    async def _run_impl(\n        self,\n        starting_agent: Agent[TContext],\n        input: str | list[TResponseInputItem] | RunState[TContext],\n        **kwargs: Unpack[RunOptions[TContext]],\n    ) -> RunResult:\n        context = kwargs.get(\"context\")\n        max_turns = kwargs.get(\"max_turns\", DEFAULT_MAX_TURNS)\n        hooks = cast(RunHooks[TContext], validate_run_hooks(kwargs.get(\"hooks\")))\n        run_config = kwargs.get(\"run_config\")\n        error_handlers = kwargs.get(\"error_handlers\")\n        previous_response_id = kwargs.get(\"previous_response_id\")\n        auto_previous_response_id = kwargs.get(\"auto_previous_response_id\", False)\n        conversation_id = kwargs.get(\"conversation_id\")\n        session = kwargs.get(\"session\")",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "init": {
      "title": "初始化新任务",
      "file": "src/agents/run.py",
      "line": 835,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L835",
      "code": "                current_turn = 0\n                original_input = copy_input_items(original_input_for_state)\n                generated_items = []\n                session_items = []\n                model_responses = []\n                run_state = RunState(\n                    context=context_wrapper,\n                    original_input=original_input,\n                    starting_agent=starting_agent,\n                    max_turns=max_turns,\n                    conversation_id=conversation_id,\n                    previous_response_id=previous_response_id,\n                    auto_previous_response_id=auto_previous_response_id,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "loop": {
      "title": "Agent Loop",
      "file": "src/agents/run.py",
      "line": 1032,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L1032",
      "code": "                while True:\n                    validate_output_guardrails_with_server_managed_conversation(\n                        current_agent,\n                        run_config,\n                        conversation_id=conversation_id,\n                        previous_response_id=previous_response_id,\n                        auto_previous_response_id=auto_previous_response_id,\n                    )\n                    if TYPE_CHECKING:\n                        # Keep loop-carried types explicit to bound Pyright's flow analysis.",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "limit": {
      "title": "新模型轮次计数",
      "file": "src/agents/run.py",
      "line": 1597,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L1597",
      "code": "                    current_turn += 1\n                    if max_turns is not None and current_turn > max_turns:\n                        _error_tracing.attach_error_to_span(\n                            current_span,\n                            SpanError(\n                                message=\"Max turns exceeded\",\n                                data={\"max_turns\": max_turns},\n                            ),\n                        )\n                        max_turns_error = MaxTurnsExceeded(f\"Max turns ({max_turns}) exceeded\")\n                        run_error_data = build_run_error_data(\n                            input=original_input,\n                            new_items=session_items,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "first-turn": {
      "title": "首轮：异步任务与护栏",
      "file": "src/agents/run.py",
      "line": 1800,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L1800",
      "code": "                            model_task = asyncio.create_task(\n                                preserve_tool_task_cancellation(\n                                    run_single_turn(\n                                        bindings=current_bindings,\n                                        original_input=original_input,\n                                        generated_items=items_for_model,\n                                        hooks=hooks,\n                                        context_wrapper=context_wrapper,\n                                        run_config=run_config,\n                                        should_run_agent_start_hooks=should_run_agent_start_hooks,\n                                        tool_use_tracker=tool_use_tracker,\n                                        server_conversation_tracker=server_conversation_tracker,\n                                        session=session,\n                                        session_items_to_rewind=(\n                                            last_saved_input_snapshot_for_rewind",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "later-turn": {
      "title": "后续轮次：执行单轮",
      "file": "src/agents/run.py",
      "line": 1909,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L1909",
      "code": "                            turn_result = await run_single_turn(\n                                bindings=current_bindings,\n                                original_input=original_input,\n                                generated_items=items_for_model,\n                                hooks=hooks,\n                                context_wrapper=context_wrapper,\n                                run_config=run_config,\n                                should_run_agent_start_hooks=should_run_agent_start_hooks,\n                                tool_use_tracker=tool_use_tracker,\n                                server_conversation_tracker=server_conversation_tracker,\n                                session=session,\n                                session_items_to_rewind=(\n                                    last_saved_input_snapshot_for_rewind\n                                    if not is_resumed_state and session_persistence_enabled",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "history": {
      "title": "更新运行历史",
      "file": "src/agents/run.py",
      "line": 2000,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L2000",
      "code": "                    model_responses.append(turn_result.model_response)\n                    input_before_turn_rewrite = original_input\n                    original_input = turn_result.original_input\n                    # For model input, use new_step_items (filtered on handoffs).\n                    generated_items = turn_result.pre_step_items + turn_result.new_step_items\n                    # Accumulate unfiltered items for observability.\n                    turn_session_items = session_items_for_turn(turn_result)\n                    session_items.extend(turn_session_items)\n                    if pending_input_admission_items and run_state is not None:",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "final": {
      "title": "最终输出与输出护栏",
      "file": "src/agents/run.py",
      "line": 2103,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L2103",
      "code": "                        if isinstance(turn_result.next_step, NextStepFinalOutput):\n                            if run_state is not None and _has_output_guardrails(\n                                current_agent, run_config\n                            ):\n                                run_state._tool_output_guardrail_results = list(\n                                    tool_output_guardrail_results\n                                )\n                            output_guardrail_result_start = len(output_guardrail_results)\n                            try:\n                                await run_output_guardrails(\n                                    current_agent.output_guardrails\n                                    + (run_config.output_guardrails or []),",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "interrupt": {
      "title": "中断分支",
      "file": "src/agents/run.py",
      "line": 2273,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L2273",
      "code": "                        elif isinstance(turn_result.next_step, NextStepInterruption):\n                            if run_state is not None:\n                                # Held registration must see the fresh response's turn,\n                                # including detached resumes without output guardrails.\n                                run_state._current_turn = current_turn\n                            if session_persistence_enabled and not input_guardrails_triggered(\n                                _attempt_input_guardrail_results()\n                            ):\n                                # Persist session items but skip approval placeholders.\n                                input_items_for_save_interruption: list[TResponseInputItem] = (\n                                    session_input_items_for_persistence\n                                    if session_input_items_for_persistence is not None",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "handoff-branch": {
      "title": "切换当前 Agent",
      "file": "src/agents/run.py",
      "line": 2386,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L2386",
      "code": "                        elif isinstance(turn_result.next_step, NextStepHandoff):\n                            current_agent = cast(Agent[TContext], turn_result.next_step.new_agent)\n                            if run_state is not None:\n                                run_state._current_agent = current_agent\n                            # Next agent starts with the nested/filtered input.\n                            # Assign without type annotation to avoid redefinition error\n                            starting_input = turn_result.original_input\n                            original_input = turn_result.original_input\n                            current_span.finish(reset_current=True)\n                            current_span = None\n                            should_run_agent_start_hooks = True\n                        elif isinstance(turn_result.next_step, NextStepRunAgain):",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "again": {
      "title": "继续下一轮",
      "file": "src/agents/run.py",
      "line": 2397,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run.py#L2397",
      "code": "                        elif isinstance(turn_result.next_step, NextStepRunAgain):\n                            await save_turn_items_if_needed(\n                                session=session,\n                                run_state=run_state,\n                                session_persistence_enabled=session_persistence_enabled,\n                                input_guardrail_results=input_guardrail_results,\n                                items=session_items_for_turn(turn_result),\n                                response_id=turn_result.model_response.response_id,\n                                store=store_setting,\n                                wrapper=context_wrapper,\n                            )\n                            continue",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "single": {
      "title": "run_single_turn · 非流式单轮",
      "file": "src/agents/run_internal/run_loop.py",
      "line": 2787,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/run_loop.py#L2787",
      "code": "async def run_single_turn(\n    *,\n    bindings: AgentBindings[TContext],\n    original_input: str | list[TResponseInputItem],\n    generated_items: list[RunItem],\n    hooks: RunHooks[TContext],\n    context_wrapper: RunContextWrapper[TContext],\n    run_config: RunConfig,\n    should_run_agent_start_hooks: bool,\n    tool_use_tracker: AgentToolUseTracker,\n    server_conversation_tracker: OpenAIServerConversationTracker | None = None,\n    session: Session | None = None,\n    session_items_to_rewind: list[TResponseInputItem] | None = None,\n    reasoning_item_id_policy: ReasoningItemIdPolicy | None = None,\n    prompt_cache_key_resolver: PromptCacheKeyResolver | None = None,\n    error_handlers: RunErrorHandlers[TContext] | None = None,\n    agent_span: Span[AgentSpanData] | None = None,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "model": {
      "title": "get_model · 配置优先级",
      "file": "src/agents/run_internal/turn_preparation.py",
      "line": 134,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/turn_preparation.py#L134",
      "code": "def get_model(agent: Agent[Any], run_config: RunConfig) -> Model:\n    \"\"\"Resolve the model instance for this run.\"\"\"\n    if isinstance(run_config.model, Model):\n        return run_config.model\n    elif isinstance(run_config.model, str):\n        return run_config.model_provider.get_model(run_config.model)\n    elif isinstance(agent.model, Model):\n        return agent.model\n\n    return run_config.model_provider.get_model(agent.model)\n\n\ndef _implicit_model_settings_for_agent(agent: Agent[Any]) -> ModelSettings:\n    if agent.model is None:\n        return get_default_model_settings()\n    if isinstance(agent.model, str):\n        return get_default_model_settings(agent.model)\n    return ModelSettings()\n\n",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "request": {
      "title": "模型输入过滤和模型选择",
      "file": "src/agents/run_internal/run_loop.py",
      "line": 2948,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/run_loop.py#L2948",
      "code": "    filtered = await maybe_filter_model_input(\n        agent=public_agent,\n        run_config=run_config,\n        context_wrapper=context_wrapper,\n        input_items=input,\n        system_instructions=system_prompt,\n    )\n    if isinstance(filtered.input, list):\n        filtered.input = deduplicate_input_items_preferring_latest(filtered.input)\n\n    model = get_model(execution_agent, run_config)\n    tool_use_tracker.record_model(model)\n    model_settings = get_model_settings(execution_agent, run_config)\n    model_settings = maybe_reset_tool_choice(public_agent, tool_use_tracker, model_settings)\n\n    if server_conversation_tracker is not None:\n        server_conversation_tracker.validate_pending_input_filter(filtered.input)\n        server_conversation_tracker.mark_input_as_sent(filtered.input)\n\n    await gather_with_cancel(",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "llm-start": {
      "title": "模型调用前的生命周期回调",
      "file": "src/agents/run_internal/run_loop.py",
      "line": 2968,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/run_loop.py#L2968",
      "code": "        hooks.on_llm_start(context_wrapper, public_agent, filtered.instructions, filtered.input),\n        (\n            public_agent.hooks.on_llm_start(\n                context_wrapper,\n                public_agent,\n                filtered.instructions,\n                filtered.input,\n            )\n            if public_agent.hooks is not None\n            else _coro.noop_coroutine()\n        ),\n    )\n\n    previous_response_id = (",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "retry": {
      "title": "统一模型调用与重试入口",
      "file": "src/agents/run_internal/run_loop.py",
      "line": 3025,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/run_loop.py#L3025",
      "code": "        new_response = await get_response_with_retry(\n            get_response=lambda: model.get_response(\n                system_instructions=filtered.instructions,\n                input=filtered.input,\n                model_settings=model_settings,\n                tools=all_tools,\n                output_schema=output_schema,\n                handoffs=handoffs,\n                tracing=get_model_tracing_impl(\n                    run_config.tracing_disabled, run_config.trace_include_sensitive_data\n                ),\n                previous_response_id=previous_response_id,\n                conversation_id=conversation_id,\n                prompt=prompt_config,\n            ),\n            rewind=rewind_model_request,\n            retry_settings=model_settings.retry,\n            get_retry_advice=model.get_retry_advice,\n            previous_response_id=previous_response_id,\n            conversation_id=conversation_id,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "llm-end": {
      "title": "非流式响应后的 llm_end 调用",
      "file": "src/agents/run_internal/run_loop.py",
      "line": 2888,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/run_loop.py#L2888",
      "code": "    async def after_invocation_validation(\n        _processed_response: ProcessedResponse | None,\n    ) -> bool:\n        if response_accepted and on_response_accepted is not None:\n            on_response_accepted(new_response, _processed_response)\n        if response_accepted and on_response_hooks_started is not None:\n            on_response_hooks_started()\n        await gather_with_cancel(\n            (\n                public_agent.hooks.on_llm_end(context_wrapper, public_agent, new_response)\n                if public_agent.hooks is not None\n                else _coro.noop_coroutine()\n            ),\n            hooks.on_llm_end(context_wrapper, public_agent, new_response),\n        )\n        return response_accepted\n\n    return await get_single_step_result_from_response(\n        bindings=bindings,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "api": {
      "title": "Responses API HTTP 请求",
      "file": "src/agents/models/openai_responses.py",
      "line": 888,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/models/openai_responses.py#L888",
      "code": "            response = await client.responses.create(**create_kwargs)\n            if getattr(response, \"status\", None) in {\"failed\", \"incomplete\"}:\n                raise response_terminal_failure_error(f\"response.{response.status}\", response)\n            _mark_transport_request_without_usage(response)\n            return cast(Response, response)",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "parse": {
      "title": "模型响应分类",
      "file": "src/agents/run_internal/turn_resolution.py",
      "line": 3133,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/turn_resolution.py#L3133",
      "code": "def process_model_response(\n    *,\n    agent: Agent[Any],\n    all_tools: list[Tool],\n    response: ModelResponse,\n    output_schema: AgentOutputSchemaBase | None,\n    handoffs: list[Handoff],\n    existing_items: Sequence[RunItem] | None = None,\n    run_config: RunConfig | None = None,\n    server_manages_conversation: bool = False,\n    server_managed_input_items: Sequence[Any] | None = None,\n    allow_apply_patch_function_fallback: bool = True,\n) -> ProcessedResponse:\n    items: list[RunItem] = []\n\n    run_handoffs = []\n    functions = []\n    computer_actions = []",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "actions": {
      "title": "执行工具及其他本地动作",
      "file": "src/agents/run_internal/turn_resolution.py",
      "line": 941,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/turn_resolution.py#L941",
      "code": "async def execute_tools_and_side_effects(\n    *,\n    bindings: AgentBindings[TContext],\n    original_input: str | list[TResponseInputItem],\n    pre_step_items: list[RunItem],\n    new_response: ModelResponse,\n    processed_response: ProcessedResponse,\n    output_schema: AgentOutputSchemaBase | None,\n    hooks: RunHooks[TContext],\n    context_wrapper: RunContextWrapper[TContext],\n    run_config: RunConfig,\n    error_handlers: RunErrorHandlers[TContext] | None = None,\n    server_manages_conversation: bool = False,\n    precomputed_skipped_raw_item_ids: set[int] | None = None,\n    run_state: RunState[Any] | None = None,\n    on_tool_execution_error: Callable[[SingleStepResult], None] | None = None,\n    on_tool_error_selected: Callable[[], None] | None = None,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "tool-schema": {
      "title": "从 Python 函数生成 Schema",
      "file": "src/agents/tool.py",
      "line": 2762,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/tool.py#L2762",
      "code": "        schema = function_schema(\n            func=the_func,\n            name_override=name_override,\n            description_override=description_override\n            or (callable_description if use_docstring_info else None),\n            docstring_style=docstring_style,\n            use_docstring_info=use_docstring_info,\n            strict_json_schema=strict_mode,\n        )\n        resolved_output_json_schema, output_type_adapter = _resolve_function_tool_output(\n            return_annotation=schema.return_annotation,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "tool-args": {
      "title": "JSON 解析和参数校验",
      "file": "src/agents/tool.py",
      "line": 2778,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/tool.py#L2778",
      "code": "        def _prepare_arguments(\n            input: str, tool_name: str, *, inspect_approval: bool = False\n        ) -> PreparedFunctionArguments:\n            json_data = _parse_function_tool_json_input(tool_name=tool_name, input_json=input)\n            # Keep mutable policy input separate from prepared execution values.\n            validation_input = copy.deepcopy(json_data) if inspect_approval else json_data\n            base_message = f\"Invalid JSON input for tool {tool_name}\"\n            validation_failed = False\n            try:\n                parsed = (\n                    schema.params_pydantic_model(**validation_input)\n                    if validation_input\n                    else schema.params_pydantic_model()\n                )\n            except ValidationError as e:\n                if not _debug.DONT_LOG_TOOL_DATA:\n                    raise ModelBehaviorError(f\"{base_message}: {e}\") from e\n                validation_failed = True\n\n            if validation_failed:\n                raise ModelBehaviorError(base_message)\n\n            args, kwargs_dict = schema.to_call_args(parsed)\n            return PreparedFunctionArguments(\n                owner=_prepare_arguments,\n                arguments=input,\n                args=args,\n                kwargs=kwargs_dict,",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "tool-call": {
      "title": "调用实际 Python 函数",
      "file": "src/agents/tool.py",
      "line": 2823,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/tool.py#L2823",
      "code": "            if not is_sync_function_tool:\n                if schema.takes_context:\n                    result = await the_func(ctx, *args, **kwargs_dict)\n                else:\n                    result = await the_func(*args, **kwargs_dict)\n            else:\n                if schema.takes_context:\n                    result = await asyncio.to_thread(the_func, ctx, *args, **kwargs_dict)\n                else:\n                    result = await asyncio.to_thread(the_func, *args, **kwargs_dict)\n\n            try:",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "tool-hooks": {
      "title": "本地函数工具开始回调",
      "file": "src/agents/run_internal/tool_execution.py",
      "line": 2052,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/tool_execution.py#L2052",
      "code": "                self.hooks.on_tool_start(tool_context, self.public_agent, func_tool),\n                (\n                    agent_hooks.on_tool_start(tool_context, self.public_agent, func_tool)\n                    if agent_hooks is not None\n                    else _coro.noop_coroutine()\n                ),\n            )\n\n        invoke_task = asyncio.create_task(\n            self._invoke_tool_and_run_post_invoke(",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "tool-end": {
      "title": "本地工具结束回调",
      "file": "src/agents/run_internal/tool_execution.py",
      "line": 2192,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/tool_execution.py#L2192",
      "code": "            self.hooks.on_tool_end(tool_context, self.public_agent, func_tool, final_result),\n            (\n                agent_hooks.on_tool_end(tool_context, self.public_agent, func_tool, final_result)\n                if agent_hooks is not None\n                else _coro.noop_coroutine()\n            ),\n        )\n        return final_result\n",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "nextstep": {
      "title": "四种 NextStep",
      "file": "src/agents/run_internal/run_steps.py",
      "line": 164,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/run_steps.py#L164",
      "code": "class NextStepHandoff:\n    new_agent: Agent[Any]\n\n\n@dataclass\nclass NextStepFinalOutput:\n    output: Any\n\n\n@dataclass\nclass NextStepRunAgain:\n    pass\n\n\n@dataclass\nclass NextStepInterruption:\n    \"\"\"Represents an interruption in the agent run due to tool approval requests.\"\"\"\n\n    interruptions: list[ToolApprovalItem]\n    \"\"\"The list of tool calls awaiting approval.\"\"\"\n\n    response_accepted: bool = False\n    \"\"\"Whether the server accepted a response whose local processing is still incomplete.\"\"\"\n\n    llm_end_hooks_started: bool = True\n    \"\"\"Whether response-end hooks started before the interruption was persisted.\"\"\"\n\n\n@dataclass\nclass SingleStepResult:\n    original_input: str | list[TResponseInputItem]\n    \"\"\"The input items i.e. the items before run() was called. May be mutated by handoff input\n    filters.\"\"\"\n\n    model_response: ModelResponse\n    \"\"\"The model response for the current step.\"\"\"\n\n    pre_step_items: list[RunItem]\n    \"\"\"Items generated before the current step.\"\"\"",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "lifecycle": {
      "title": "RunHooks 模型生命周期接口",
      "file": "src/agents/lifecycle.py",
      "line": 18,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/lifecycle.py#L18",
      "code": "    async def on_llm_start(\n        self,\n        context: RunContextWrapper[TContext],\n        agent: Agent[TContext],\n        system_prompt: str | None,\n        input_items: list[TResponseInputItem],\n    ) -> None:\n        \"\"\"Called just before invoking the LLM for this agent.\"\"\"\n        pass\n\n    async def on_llm_end(\n        self,\n        context: RunContextWrapper[TContext],\n        agent: Agent[TContext],\n        response: ModelResponse,\n    ) -> None:\n        \"\"\"Called immediately after the LLM call returns for this agent.\"\"\"\n        pass\n",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "input-filter": {
      "title": "明确的模型输入过滤扩展点",
      "file": "src/agents/run_config.py",
      "line": 455,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_config.py#L455",
      "code": "    call_model_input_filter: CallModelInputFilter | None = None\n    \"\"\"\n    Optional callback that is invoked immediately before calling the model. It receives the current\n    agent, context and the model input (instructions and input items), and must return a possibly\n    modified `ModelInputData` to use for the model call.\n\n    This allows you to edit the input sent to the model e.g. to stay within a token limit.\n    For example, you can use this to add a system prompt to the input.\n    \"\"\"\n\n    tool_error_formatter: ToolErrorFormatter | None = None\n    \"\"\"Optional callback that formats tool error messages returned to the model.\n\n    Returning ``None`` falls back to the SDK default message.",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "handoff-config": {
      "title": "解析可用 Handoffs",
      "file": "src/agents/run_internal/turn_preparation.py",
      "line": 96,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/turn_preparation.py#L96",
      "code": "async def get_handoffs(agent: Agent[Any], context_wrapper: RunContextWrapper[Any]) -> list[Handoff]:\n    \"\"\"Return enabled handoffs for the agent.\"\"\"\n    handoffs = []\n    for handoff_item in agent.handoffs:\n        if isinstance(handoff_item, Handoff):\n            handoffs.append(handoff_item)\n        elif isinstance(handoff_item, Agent):\n            handoffs.append(handoff(handoff_item))\n\n    async def check_handoff_enabled(handoff_obj: Handoff) -> bool:\n        attr = handoff_obj.is_enabled\n        if isinstance(attr, bool):\n            return attr\n        res = attr(context_wrapper, agent)\n        if inspect.isawaitable(res):\n            return bool(await res)\n        return bool(res)\n\n    results = await gather_with_cancel(*(check_handoff_enabled(h) for h in handoffs))\n    enabled: list[Handoff] = [h for h, ok in zip(handoffs, results, strict=False) if ok]\n    return enabled\n",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "handoff-convert": {
      "title": "将 Handoff 转为 API 工具声明",
      "file": "src/agents/models/openai_responses.py",
      "line": 2364,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/models/openai_responses.py#L2364",
      "code": "    def _convert_handoff_tool(cls, handoff: Handoff) -> ResponsesToolParam:\n        return FunctionToolParam(\n            name=handoff.tool_name,\n            parameters=handoff.input_json_schema,\n            strict=handoff.strict_json_schema,\n            type=\"function\",\n            description=handoff.tool_description,\n        )",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    },
    "handoff": {
      "title": "Handoff 独立执行路径",
      "file": "src/agents/run_internal/turn_resolution.py",
      "line": 544,
      "url": "https://github.com/openai/openai-agents-python/blob/17d994bd3045dae71acda676a4ef4762ed8ecd94/src/agents/run_internal/turn_resolution.py#L544",
      "code": "async def execute_handoffs(\n    *,\n    public_agent: Agent[TContext],\n    original_input: str | list[TResponseInputItem],\n    pre_step_items: list[RunItem],\n    new_step_items: list[RunItem],\n    new_response: ModelResponse,\n    run_handoffs: list[ToolRunHandoff],\n    hooks: RunHooks[TContext],\n    context_wrapper: RunContextWrapper[TContext],\n    run_config: RunConfig,\n    server_manages_conversation: bool = False,\n    nest_handoff_history_fn: Callable[..., HandoffInputData] | None = None,\n    tool_input_guardrail_results: list[ToolInputGuardrailResult] | None = None,\n    tool_output_guardrail_results: list[ToolOutputGuardrailResult] | None = None,\n    handoff_output_committer: Callable[[HandoffOutputItem, Agent[Any]], None] | None = None,\n) -> SingleStepResult:",
      "commit": "17d994bd3045dae71acda676a4ef4762ed8ecd94"
    }
  },
  "markers": [
    {
      "line": 281,
      "text": "*00a 公开入口：业务代码调用 Runner.run，传入起始 Agent 和输入。"
    },
    {
      "line": 353,
      "text": "*00b 委托默认 AgentRunner：把 Agent、输入和运行选项交给内部运行器。"
    },
    {
      "line": 579,
      "text": "*00c AgentRunner.run：内部入口，整理配置并管理运行前后的资源。"
    },
    {
      "line": 616,
      "text": "*01 选择当前 Agent：恢复时使用状态中的 Agent，否则使用起始 Agent。"
    },
    {
      "line": 625,
      "text": "*02 进入 _run_impl：执行核心流程；返回前仍会执行 finally 和上下文清理。"
    },
    {
      "line": 857,
      "text": "*03 初始化新任务：从第 0 轮开始，保存输入，生成项先为空；恢复任务走上方分支。"
    },
    {
      "line": 1055,
      "text": "*04 进入循环：每轮推进任务；最终返回、中断或异常会离开循环。"
    },
    {
      "line": 1628,
      "text": "*05 新的一轮先计数：超过 max_turns 时走错误处理，默认抛出异常。"
    },
    {
      "line": 1833,
      "text": "*06a 首轮执行：将单轮任务交给 asyncio，以配合输入护栏等处理。"
    },
    {
      "line": 1943,
      "text": "*06b 后续轮次直接执行：单轮处理模型交互、响应与本地动作。"
    },
    {
      "line": 2035,
      "text": "*07 更新本轮历史：保存模型响应、可能改写的输入以及生成项。"
    },
    {
      "line": 2139,
      "text": "*08 判断 next_step：最终输出还要经过输出护栏、收尾等处理。"
    },
    {
      "line": 2310,
      "text": "*09 中断：返回包含待处理事项和状态的结果，供调用方后续恢复。"
    },
    {
      "line": 2424,
      "text": "*10 Handoff：切换当前 Agent，后续循环由新 Agent 继续。"
    },
    {
      "line": 2436,
      "text": "*11 继续：保存需要保留的本轮信息，然后进入下一轮。"
    }
  ],
  "logs": {
    "weather_loop_experiment.log": "\n=== baseline ===\nfinal_output: scripted final answer\ntool_output: Tokyo: sunny, 14-20C\nmodel_calls: 2 tool_invocations: [\"Tokyo\"]\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":\"Tokyo\"}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'Tokyo: sunny, 14-20C', 'type': 'function_call_output'}]\n\n=== tool exception ===\nfinal_output: scripted final answer\ntool_output: An error occurred while running the tool. Please try again.\nmodel_calls: 2 tool_invocations: [\"Tokyo\"]\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":\"Tokyo\"}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'An error occurred while running the tool. Please try again.', 'type': 'function_call_output'}]\n\n=== invalid parameter ===\nfinal_output: scripted final answer\ntool_output: An error occurred while running the tool. Please try again.\nmodel_calls: 2 tool_invocations: []\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":123}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'An error occurred while running the tool. Please try again.', 'type': 'function_call_output'}]\n\n=== repeat until max_turns ===\nexception: MaxTurnsExceeded Max turns (2) exceeded\nmodel_calls: 2 tool_invocations: [\"Tokyo\", \"Tokyo\"]\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":\"Tokyo\"}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'Tokyo: sunny, 14-20C', 'type': 'function_call_output'}]\n",
    "agent_handoff_hooks_experiment.log": "TOOL HOOK EVENTS: llm_start:weather -> llm_end:weather -> tool_start:get_weather -> tool_body:Tokyo -> tool_end:get_weather -> llm_start:weather -> llm_end:weather\nTOOL HOOK ASSERTIONS: PASS\nHANDOFF TOOL: transfer_to_specialist\nHANDOFF EVENTS: llm_start:triage -> llm_end:triage -> handoff:triage->specialist -> llm_start:specialist -> llm_end:specialist\nLAST AGENT: specialist\nMODEL CALLS: 1 1\nHANDOFF ASSERTIONS: PASS\n",
    "源码观察-next-step-CloudIDE运行记录.log": "SOURCE_PATH /root/codex-workspaces/openai-agents-sdk-instrumentation-17d994bd/src/agents/__init__.py\n\n=== baseline ===\n[study] next_step= NextStepRunAgain\n[study] next_step= NextStepFinalOutput\nfinal_output: scripted final answer\ntool_output: Tokyo: sunny, 14-20C\nmodel_calls: 2 tool_invocations: [\"Tokyo\"]\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":\"Tokyo\"}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'Tokyo: sunny, 14-20C', 'type': 'function_call_output'}]\n\n=== tool exception ===\n[study] next_step= NextStepRunAgain\n[study] next_step= NextStepFinalOutput\nfinal_output: scripted final answer\ntool_output: An error occurred while running the tool. Please try again.\nmodel_calls: 2 tool_invocations: [\"Tokyo\"]\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":\"Tokyo\"}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'An error occurred while running the tool. Please try again.', 'type': 'function_call_output'}]\n\n=== invalid parameter ===\n[study] next_step= NextStepRunAgain\n[study] next_step= NextStepFinalOutput\nfinal_output: scripted final answer\ntool_output: An error occurred while running the tool. Please try again.\nmodel_calls: 2 tool_invocations: []\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":123}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'An error occurred while running the tool. Please try again.', 'type': 'function_call_output'}]\n\n=== repeat until max_turns ===\n[study] next_step= NextStepRunAgain\n[study] next_step= NextStepRunAgain\nexception: MaxTurnsExceeded Max turns (2) exceeded\nmodel_calls: 2 tool_invocations: [\"Tokyo\", \"Tokyo\"]\nsecond_input: [{'content': 'Tokyo weather?', 'role': 'user'}, {'arguments': '{\"city\":\"Tokyo\"}', 'call_id': 'call_1', 'name': 'get_weather', 'type': 'function_call', 'id': 'call_1'}, {'call_id': 'call_1', 'output': 'Tokyo: sunny, 14-20C', 'type': 'function_call_output'}]\n[study] next_step= NextStepRunAgain\n[study] next_step= NextStepFinalOutput\nTOOL HOOK EVENTS: llm_start:weather -> llm_end:weather -> tool_start:get_weather -> tool_body:Tokyo -> tool_end:get_weather -> llm_start:weather -> llm_end:weather\nTOOL HOOK ASSERTIONS: PASS\n[study] next_step= NextStepHandoff\n[study] next_step= NextStepFinalOutput\nHANDOFF TOOL: transfer_to_specialist\nHANDOFF EVENTS: llm_start:triage -> llm_end:triage -> handoff:triage->specialist -> llm_start:specialist -> llm_end:specialist\nLAST AGENT: specialist\nMODEL CALLS: 1 1\nHANDOFF ASSERTIONS: PASS\n"
  }
};
