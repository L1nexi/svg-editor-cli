# 2026-10-27 SVG 读取批次

用户审核通过 CLI 批次并要求提交、继续下一项。接手检查时，CLI 与三项修复已提交在 `b35d7e1`，工作区干净；本轮继续交接中的真实 SVG 读取。

## 设计与资料

- 先提交 ADR-0007 和命令规格的读取边界，再实施代码。
- 通过 Context7 核对 `@xmldom/xmldom` 的 DOMParser、`onWarningStopParsing` 与 ParseError；安装版本为 0.9.12。XML 类型和解析器限定在 io 内。
- 变换顺序与 viewBox 计算参考 [SVG 坐标系统规范](https://www.w3.org/TR/SVG11/coords.html)。
- 安装时 npm audit 报告现有 Vitest 开发依赖的 3 项漏洞（含 2 项 critical），未涉及新增 XML 解析库；升级跨主版本，单独作为工程待处理项。

## 第一步：图形读取插槽

- 增加 `CoordinateTransform`，提供轴向坐标、尺寸与父子变换合成；`ShapeProvider.fromAttrs` 增加可选末位变换参数，既有调用继续可用。
- 每个类型在自身提供者中解释几何属性；非等比缩放的圆转为同 id 椭圆，矩形反射后采用正尺寸包围框。没有新增按图形标签分派。
- 发现并修复 text 的 fromAttrs 原先漏恢复画笔属性，补齐 fill、stroke、stroke-width 的读取。
- 图形测试 29 项、typecheck 通过。文件读取与 XML 导入将在下一步接入。
