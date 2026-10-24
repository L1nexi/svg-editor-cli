# ADR-0001：仓库结构与协作规范

- **状态**：已接受（Accepted）
- **日期**：2026-10-25
- **关联**：`assignment/phase_cli_1.md` L100（tag `final`）、L104（`doc/README.md`）、L118（过程记录）、L157（AI 协作）；`doc/spec/assignment-analysis.md` Q11

## 背景

作业以 git tag `final` 在**最终提交处**标记收尾，仓库根即工程根——交付文档必须位于工程的 `doc/README.md`（L104）。最初的草稿按 `lab1/` 层级组织（`lab1/assignment/`、`lab1/docs/`），与交付路径不一致；同时「与 AI 协作的过程记录」（L118）需要固定归宿，隐式要求（如禁止 one-shot 提交，L100）需要成文才可检查。

## 决策

1. **仓库根 = 工程根**，废弃 `lab1/` 层级；
2. `assignment/` 存放作业原文（只读参照，不改写）；
3. `doc/` 组织正式文档：`README.md`（交付入口）+ `spec/`（需求分析、命令-行为-文案规范表）+ `adr/`（决策记录）；
4. `agent/` 组织 AI 协作：`history/`（完整过程记录，只追加）+ `workspace/`（agent 持久记忆交接，以最新状态为准）；
5. 根目录提供 `AGENTS.md`（agent 上下文与硬性规则）与 `CODE_OF_CONDUCT.md`（开发行为规范：反 one-shot、文档同步、如实记录、AI 产出必须审查、文案保真等隐式要求成文）。

## 后果

- 交付文档路径与作业要求一致，`final` tag 打在仓库根即可覆盖全部内容；
- 「过程记录」有了素材来源（`agent/history/`）与成文出口（`doc/README.md`）；
- 工作文档与交付文档同在 `doc/`，以「README 为入口、spec/adr 为支撑」分层；
- 需求分析中的 open question Q11（工程根目录位置）就此裁决。
