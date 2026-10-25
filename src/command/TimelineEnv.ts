import type { Result } from '../errors'
import type { Payload } from './Payload'

// undo/redo 命令专用：判定与报错都在 engine 的时间线实现里；状态转移（游标与画布指针）
// 在实现内部完成，结果只携带回显（ADR-0004 决策四）
export interface TimelineEnv {
  undo(): Result<Payload>
  redo(): Result<Payload>
}
