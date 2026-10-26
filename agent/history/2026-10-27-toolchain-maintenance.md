# 2026-10-27 工具链维护

用户要求先用一个 commit 升级 Vitest，再补 Node/包管理器基线并同步运行说明；交付文档主体留待后续处理。

## Vitest 升级

- 依据 Vitest 4 迁移文档与 ADR-0003 的修订，将开发依赖从 3.2.7 升至 4.1.12；同步 package.json 与 package-lock.json。
- 保持默认测试配置，测试源码和断言不变。Vitest 4 已移除 tinypool，本地依赖树确认不再包含该包。
- 现有 Node 25.9.0 / npm 11.12.1 环境下，167 项测试、typecheck 与 npm audit 全部通过，审计为 0 告警。
- 本提交只包含 Vitest 升级及其决策、验证记录；环境基线和安装约定在下一步处理。

## 环境与安装约定

- Vitest 升级独立提交为 `53fed49` 后，补齐环境元数据：`.node-version` 指定 Node 24.22.1，packageManager 指定 npm 11.19.1，engines 声明 Node 24.22.1 起的 24.x 与 npm 11.x。
- 采用 Node 24 LTS，与现有 Node 24 类型定义一致。版本来自 [Node 官方发布列表](https://nodejs.org/en/about/previous-releases)及官方发行索引；验证使用官方 Windows 压缩包，SHA-256 与官方校验文件一致。
- 新增 `doc/development.md` 作为版本来源、锁定安装、依赖升级和运行验证的说明；AGENTS.md 改为引用该文档，并移除 CLI 尚未实现的旧说明。ADR-0003 同步当前测试覆盖与环境约定。
- 在独立 Node 24.22.1 / npm 11.19.1 环境中同步锁文件根元数据，执行 npm ci；安装前后 package.json 与 package-lock.json 的 SHA-256 均保持一致。
- 同一环境下 167 项测试、typecheck、完整依赖审计通过，审计为 0 告警。测试源码与产品源码保持不变。
- 上一轮对 create 提示与现有锁文件的复核记录随本次文档同步入库；交付文档主体及其 TODO 留待后续。
- Vitest 升级与环境/文档同步分别通过规范轴和规格轴复审。
