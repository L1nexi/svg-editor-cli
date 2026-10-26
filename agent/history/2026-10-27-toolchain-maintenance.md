# 2026-10-27 工具链维护

用户要求先用一个 commit 升级 Vitest，再补 Node/包管理器基线并同步运行说明；交付文档主体留待后续处理。

## Vitest 升级

- 依据 Vitest 4 迁移文档与 ADR-0003 的修订，将开发依赖从 3.2.7 升至 4.1.12；同步 package.json 与 package-lock.json。
- 保持默认测试配置，测试源码和断言不变。Vitest 4 已移除 tinypool，本地依赖树确认不再包含该包。
- 现有 Node 25.9.0 / npm 11.12.1 环境下，167 项测试、typecheck 与 npm audit 全部通过，审计为 0 告警。
- 本提交只包含 Vitest 升级及其决策、验证记录；环境基线和安装约定在下一步处理。
