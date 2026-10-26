# ADR-0003：测试工具链（Vitest）

- **状态**：已接受（Accepted）
- **日期**：2026-10-25
- **关联**：ADR-0002 遗留项；`assignment/phase_cli_1.md` L129–L130（质量保证手段）、§6（transcript 验收）

## 决策

- 测试框架 **Vitest**：`npm test` 单次运行，`npm run test:watch` 常驻。
- 测试文件与被测文件同目录（`*.test.ts` colocated），测在已商定的接口缝上（factory.fromArgs / Canvas 查询与克隆 / Shape.set）。
- 类型检查独立于测试：`npm run typecheck`（`tsc --noEmit`，strict 全开，含 `noUncheckedIndexedAccess`、`noImplicitOverride`）。

## 理由

- TypeScript 原生、零配置承载 ESM，与 tsx 运行时同构；
- §6 transcript 是逐字验收断言，Vitest 的 expect 可直接承载端到端测试（cli 落地后接入）；
- 不重复造轮子的既定立场（ADR-0002 决策四）在测试侧同样成立。

## 运行形态

- 已落地：图形与画布、命令与错误文案、Engine、真实文件读写，以及作业 §6/§6.1 的真实进程会话验收。
- 环境版本、按锁文件安装及依赖更新策略见 [开发与验证](../development.md)。

## 修订

- 2026-10-27：Vitest 从 3.2.7 升至 4.1.12，处理 mocker 与 tinypool 开发依赖告警。沿用默认配置和公开测试接口，迁移后验证全部测试、类型检查及依赖审计；测试目录以 ADR-0005 的 `tests/` 约定为准。
- 2026-10-27：采用 Node 24 LTS 作为开发与验收基线，具体版本记录在 `.node-version`，npm 版本记录在 packageManager，兼容范围记录在 engines。锁文件纳入版本控制，复现安装使用 npm ci，依赖变更时同步清单与锁文件；更新环境后重新验证测试与类型检查。
