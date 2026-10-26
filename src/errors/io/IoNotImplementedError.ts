import { DomainError } from '../DomainError'

// 过渡桩文案（spec §6 P 行，io 批次移除）：load 的 @xmldom 解析随 io 批次接入，
// 此前 read 必失败。本类与其 P 行同生同灭。
export class IoNotImplementedError extends DomainError {
  format(): string {
    return 'error: io not implemented: read'
  }
}
