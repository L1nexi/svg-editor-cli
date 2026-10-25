// 错误基类：错误是值不是异常——随 { ok: false } 结果返回（ADR-0002 决策一）
// 本模块是全部 error: 文案的目录：一条文案 ↔ 一个错误类 ↔ 一个测试断言（C5 审计点）
export abstract class DomainError {
  // 返回含 error: 前缀的完整一行
  abstract format(): string
}
