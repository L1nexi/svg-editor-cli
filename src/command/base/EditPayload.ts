import { Payload } from './Payload'

// 编辑类载荷：多一个反向边文案——只被 engine 的时间线读取（Result<EditPayload> 静态收窄），cli 不打印它
export class EditPayload extends Payload {
  constructor(forward: string, readonly backward: string) {
    super(forward)
  }
}
