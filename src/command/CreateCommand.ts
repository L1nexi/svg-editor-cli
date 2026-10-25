import {
  Err,
  IdExistsError,
  InvalidArgumentsError,
  NoSuchContainerError,
  NotAContainerError,
  Ok,
  type Result,
  UnknownShapeTypeError,
} from '../errors'
import { Group } from '../types/Group'
import { ShapeFactory } from '../types/ShapeFactory'
import type { EditEnv } from './EditEnv'
import { EditPayload } from './EditPayload'
import { UndoableCommand } from './UndoableCommand'

// create <type> <id> [params…] [in <containerId>]
// 校验序（Q4）：provider 参数 → 新 id 冲突 → 容器存在 → 容器是 g；
// 工厂按名分派 = 白名单第二处（ADR-0002 决策三），未注册类型即 unknown shape type（box 为作业 §4.4 插件插槽）
export class CreateCommand extends UndoableCommand {
  readonly name = 'create'

  override execute(args: string[], env: EditEnv): Result<EditPayload> {
    if (args.length < 2) {
      return Err(new InvalidArgumentsError('<type> <id> [params…] [in <containerId>]'))
    }
    const type = args[0]!
    const id = args[1]!
    const provider = ShapeFactory.provider(type)
    if (provider === null) {
      return Err(new UnknownShapeTypeError(type))
    }

    // in 尾缀：rest 中最后一个 in 为界，其后有且仅有一个容器 id
    const rest = args.slice(2)
    const marker = rest.lastIndexOf('in')
    let containerId: string | null = null
    let paramArgs = rest
    if (marker >= 0) {
      const suffix = rest.slice(marker + 1)
      if (suffix.length !== 1) {
        return Err(new InvalidArgumentsError('<type> <id> [params…] [in <containerId>]'))
      }
      containerId = suffix[0]!
      paramArgs = rest.slice(0, marker)
    }

    const created = provider.fromArgs(id, paramArgs)
    if (!created.ok) return created
    const shape = created.value

    if (env.canvas.findById(id) !== null) {
      return Err(new IdExistsError(id))
    }
    let target: Group
    if (containerId === null) {
      target = env.canvas.getRoot()
    } else {
      const found = env.canvas.findById(containerId)
      if (found === null) return Err(new NoSuchContainerError(containerId))
      if (!(found instanceof Group)) return Err(new NotAContainerError(containerId))
      target = found
    }
    target.addChild(shape)

    const at = containerId === null ? '' : ` in ${target.ref()}`
    return Ok(new EditPayload(`${shape.ref()} created${at}`, `${shape.ref()} deleted`))
  }
}
