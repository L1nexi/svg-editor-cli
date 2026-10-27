# svg-editor

复旦大学计智学院 2026 年秋季《高级软件开发技术》课程项目：REPL 交互式 SVG 编辑器的命令行实现（TypeScript，面向对象）。

支持图形创建与编辑、分组与层级调整、结构查看，以状态时间线实现 undo/redo，并支持 SVG 文件的保存与读回。

## 快速开始

环境要求与安装策略见 [doc/development.md](doc/development.md)（Node.js 24 / npm 11）。

```bash
npm ci             # 按锁文件安装依赖
npm run cli        # 启动 REPL，输入 help 查看命令，Ctrl+D 退出
npm test           # 运行单元测试（Vitest）
npm run typecheck  # TypeScript 严格类型检查
```

## 仓库结构

| 路径 | 内容 |
| --- | --- |
| `src/` | 源码：main.ts 组合根与 cli、engine、command、types、io、errors 六个模块 |
| `tests/` | 与 src 结构镜像的单元测试，含以真实进程重放作业会话的验收测试 |
| `doc/` | 作业交付文档（[README.md](doc/README.md)）、命令行为规格（spec/）、架构决策记录（adr/）、作业原文（assignment/） |
| `agent/` | 与 AI 协作的开发过程记录（history/）与跨会话交接（workspace/） |

## 文档导航

- **交付文档**（架构方案、过程记录、一致性自查、质量保证）：[doc/README.md](doc/README.md)
- 命令行为与文案规格：[doc/spec/commands.md](doc/spec/commands.md)
- 架构决策记录（ADR-0001 至 ADR-0007）：[doc/adr/](doc/adr/)
- AI 协作过程记录：[agent/history/](agent/history/)

本项目按课程要求与 AI 协作完成，协作中的关键讨论、AI 产出问题及其纠正均有留痕。
