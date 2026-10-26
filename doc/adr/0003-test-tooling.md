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

- 已落地：types 单测（clone 往返等价、scale 语义、set 白名单、工厂注册、序列化转义）。
- 后续：§4.2 错误文案逐条单测 + §6/6.1 transcript 端到端（engine/cli 落地后）。

## 修订

- 2026-10-27：Vitest 从 3.2.7 升至 4.1.12，处理 mocker 与 tinypool 开发依赖告警。沿用默认配置和公开测试接口，迁移后验证全部测试、类型检查及依赖审计；测试目录以 ADR-0005 的 `tests/` 约定为准。
