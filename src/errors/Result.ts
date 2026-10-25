import { DomainError } from "./DomainError";

// 统一执行结果：错误是值不是异常（ADR-0002 决策一），Rust Result 直译。
// E 收窄到 DomainError——非 DomainError 的失败在 Err(...) 构造处即编译错
export type Result<T, E extends DomainError = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E extends DomainError>(error: E): Result<never, E> {
  return { ok: false, error };
}
