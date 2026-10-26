# 开发与验证

## 环境版本

使用 [`.node-version`](../.node-version) 指定的 Node 版本，以及 [`package.json`](../package.json) 的 `packageManager` 指定的 npm 版本。`engines` 声明支持范围；当前基线采用 Node 24 LTS，与项目的 Node 类型定义保持同一主版本。

切换环境后先核对实际版本：

```powershell
node --version
npm --version
```

## 安装与依赖更新

`package-lock.json` 随代码提交。首次检出、重新安装和验收时，在仓库根执行：

```powershell
npm ci
```

该命令按锁文件安装，清理现有 node_modules；清单与锁文件不一致时直接失败，保持两个文件原样。

增加或升级依赖时，用 `npm install` 指定包与版本；同时提交 package.json 和 package-lock.json，并运行下面的验证命令。升级 Node 或 npm 基线时，同步版本声明和本文件中的约定。

## 运行与验证

```powershell
npm run cli
```

CLI 启动完整 REPL，提示符为 `svg>`；输入 `help` 查看命令，输入结束时退出。SVG 文件路径相对于启动目录解析。

提交前执行：

```powershell
npm test
npm run typecheck
npm audit
git diff --check
```

测试包括单元测试、真实文件读写以及两份真实进程会话验收；测试发现和运行参数沿用 Vitest 默认配置。依赖或工具链更新后，记录实际版本、验证结果及审计情况。
