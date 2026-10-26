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

## 第三步：会话验收与收尾

- 新增两个真实进程会话测试，逐字核验作业完整编辑会话与两节点流程图，含警告顺序、错误、undo/redo、保存及外部文件读取。流程图 tree 采用已裁决的列宽公式，原文手排差异保留在规格和 README 中。
- 初次全量复验有一次子进程启动超时，其余 166 项通过；未稳定复现同一超时。三轮对照中，tsx CLI 包装耗时 502～752 ms，直接 Node 加载耗时 356～434 ms，输出相同且正常退出。按官方文档改为 `node --import tsx`，保留原进程超时阈值，减少额外启动进程。
- 最终 `npm test`：12 个文件、167 项通过，两份会话分别耗时约 540、614 ms；`npm run typecheck` 与暂存差异检查通过。
- ADR、类型读取插槽、真实文件读取、会话验收分步提交。交接改为 io 批次完成，下一步为作业交付文档和工程待处理项。

## 待处理项状态复核（2026-10-27）

用户要求展开现存问题，复核发现此前交接中的 create 文案冲突已经过时。实际运行 rect、circle、g 的缺参/多参命令，提示分别为类型参数串或 no parameters，与规格 §5 一致；缺 type/id 和不完整 in 子句使用总语法。此项无需改代码，交接中关闭旧记录。

package-lock.json 已由 Git 跟踪，待补的是 Node/包管理器基线及锁定安装、升级策略。当前环境为 Node 25.9.0、npm 11.12.1。

重新执行 npm audit：开发依赖有 3 个受影响包，修复建议指向 Vitest 4.1.12；生产依赖审计为 0 告警。已核对对应安全公告，开发服务 mock 插件的暴露条件、tinypool 的原型污染前提应与依赖包告警数量分开解释。
