# agent/ — 与 AI 协作的空间

- **`history/`**：完整历史保存。与 AI 的关键讨论、生成的方案与代码、发现的问题与纠正过程，按 `YYYY-MM-DD-<主题>.md` 命名归档，**只追加不改写**（历史是证据）。这是 `doc/README.md`「过程记录」（作业 L118）的素材来源——先记录事实，README 中再做有代表性的摘录。
- **`workspace/`**：agent 自身的持久性记忆交接。跨会话的工作状态（当前进度、未决问题、下一步）写在 `workspace/handoff.md`——任何 agent 会话开始先读、结束前更新。

约定：`workspace/` 以最新状态为准，旧内容可被覆盖，但重要结论应沉淀进 `doc/`（spec/adr）或 `agent/history/`，避免只存在于易失的会话里。
