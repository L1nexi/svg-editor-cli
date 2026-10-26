# ADR-0007：SVG 读取与坐标展开

- **状态**：已接受
- **日期**：2026-10-27
- **关联**：ADR-0002 的 XML 库、扁平坐标与类型工厂；ADR-0006 的 io 装配；命令规格 §4.1。

## 职责与接口

- `FileIoBackend.loadDocument(path)` 保持现有 `Result<{ canvas, warnings }>` 接口，负责读文件；文件读取失败转为 `CannotReadFileError(path)`。
- `io/SvgReader` 负责 XML 校验、按文档顺序建立树、读取画布尺寸及生成警告。XML 库仅在 io 内使用；语法损坏或根元素不是 SVG 时返回同一读取错误。只有完整成功才把新画布交给引擎采纳，失败不改变现有文档。
- `io/SvgIds` 管理单次读取的 id 分配。先保留受支持子树的全部显式 id，再分配缺失或重复 id，防止补号抢占后面的显式名字。缺失序号按标签独立从 1 递增；重复名字保留第一次出现，后续取首个空闲 `_2`、`_3` 后缀。
- 图形创建继续使用现有 `ShapeFactory.provider(tag).fromAttrs(...)`，保持唯一的图形类型分派位置。未知元素整棵子树跳过并警告；带 `data-kind` 的 g 在插件未接入时按普通 g 导入。

## 坐标展开

- 新增 `types/base/CoordinateTransform` 值对象，表达 `x' = sx*x + tx`、`y' = sy*y + ty`，提供点、尺寸和变换合成运算；不依赖 XML。
- `ShapeProvider.fromAttrs` 增加可选的末位 `CoordinateTransform`，默认恒等变换。各类型负责自己的几何属性；矩形反射后取包围框，圆经非等比缩放读为同 id 椭圆。text 仅变换位置，画笔属性原样恢复，与当前位置/尺寸模型一致。
- 新增 `io/SvgTransform`，解析 `translate(dx[,dy])`、`scale(sx[,sy])` 及其序列，按 SVG 的矩阵顺序与父变换合成。该处识别变换语法，不按图形标签分派。
- 嵌套容器的变换传给子孙，保存时仍无 transform。包含不支持或不合法操作的整条 transform 忽略并按既有文案警告，父变换继续生效。
- 根 transform 作用在 viewBox 映射外层，即 R×V；preserveAspectRatio 的 none 忽略可选 meet/slice，接受 defer 前缀。依据 [SVG 2 坐标规范](https://www.w3.org/TR/SVG2/coords.html#ViewBoxAttribute)。

## 输入范围与错误

- 支持六种内置图形、SVG 命名空间及无命名空间的 SVG；注释和 XML 声明不生成图形。
- 根尺寸支持正数和 px 后缀；缺失时取 viewBox 的尺寸，再缺失用 800×600。viewBox 的坐标映射作为根变换处理，默认居中等比适配，也支持 `preserveAspectRatio="none"`。
- 未支持的元素按 `warning: skipped unsupported element <tag>` 提示并跳过子树。此为规格新增 P 文案，写入规格后实施。
- 叶子只读取直接文本与 CDATA；内部的元素子树跳过并警告，防止 textContent 把未支持的 tspan 等内容一并导入。
- XML 解析使用 `@xmldom/xmldom` 的 `onWarningStopParsing`，拒绝解析器自动修复的输入。只捕获文件异常与解析异常，内部类型提供者的编程错误继续抛出。
- 当前 `IoNotImplementedError`、其错误测试与规格过渡行在真实读取接入时一同移除，新增 `CannotReadFileError` 及逐字文案断言。

## 验证与提交

按接口测试真实临时文件：作业 other.svg、六类型保存读回、补号与重名、嵌套变换、降级警告、文件/XML 错误及读取失败后的编辑历史。完成后运行全量测试、类型检查与双轴代码审查，再按逻辑步骤提交。
