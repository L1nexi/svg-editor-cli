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

## 第二步：真实文件读取

- FileIoBackend 读 UTF-8 文件，SvgReader 严格解析 XML 后构建画布；SvgIds 保留显式 id 后补号及重名，SvgTransform 解析 translate/scale 序列。支持嵌套、反射、非等比缩放、viewBox 和 SVG 命名空间。
- 未知元素跳过子树并警告，data-kind 未加载时按普通 g 导入；缺失和重复 id 的警告在解析现场产生。读取失败保持当前文档与撤销重做历史。
- 删除 IoNotImplementedError、其测试和规格过渡行，增加 CannotReadFileError 的逐字文案断言。
- 33 项真实文件测试与 typecheck 通过；测试包含作业 other.svg、六类型读写往返、文本及画笔属性、补号重名、变换、XML/文件错误和失败无副作用。

## 双轴审查与纠正

规范轴初审与增量复审均无发现。规格轴初审发现三项，已修复并由同一审查代理独立复验：

1. P2：根 transform 与 viewBox 顺序错误，V×R 会把根平移量再次缩放；改为 R×V。
2. P2：textContent 会带入未知子元素的内容且没有警告；改为仅收直接文本/CDATA，元素子树跳过并警告。
3. P3：合法的 none meet、none slice 被误判为读取失败；统一解析 defer、none 和可选缩放模式。

六条新增回归分别覆盖这些情形。规范轴和规格轴最终均通过，未发现新增问题。
