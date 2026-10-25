import { Payload } from './Payload'

// read 载荷：多一个警告行数组——警告文案的产地是 io（解析现场独有「标签名+序号」取材），经 loadDocument 透传
export class ReadPayload extends Payload {
  constructor(forward: string, readonly warnings: readonly string[]) {
    super(forward)
  }
}
