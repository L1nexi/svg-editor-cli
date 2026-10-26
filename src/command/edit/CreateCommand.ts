import { Err, IdExistsError, InvalidArgumentsError, Ok, type Result, UnknownShapeTypeError } from '../../errors'
import { Group } from '../../types/shapes/Group'
import { ShapeFactory } from '../../types/base/ShapeFactory'
import type { EditHandler } from '../base/EditHandler'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'
import { MANY } from '../base/Command'

// create <type> <id> [params…] [in <containerId>]
// 校验序（Q4）：provider 参数 → 新 id 冲突 → 容器存在 → 容器是 g；
// 工厂按名分派 = 白名单第二处（ADR-0002 决策三），未注册类型即 unknown shape type（box 为作业 §4.4 插件插槽）
export class CreateCommand extends UndoableCommand {
  readonly name = 'create'
  protected override readonly argCounts = [2, MANY]
  protected override readonly usage = '<type> <id> [params…] [in <containerId>]'

  protected override execute(args: string[], env: EditHandler): Result<EditPayload> {
    const type = args[0]!
    const id = args[1]!
    const provider = ShapeFactory.provider(type)
    if (provider === null) {
      return Err(new UnknownShapeTypeError(type))
    }

    // in 尾缀：rest 中最后一个 in 为界，其后有且仅有一个容器 id（语法结构检查，留在命令内）
    const rest = args.slice(2)
    const marker = rest.lastIndexOf('in')
    let containerId: string | null = null
    let paramArgs = rest
    if (marker >= 0) {
      const suffix = rest.slice(marker + 1)
      if (suffix.length !== 1) {
        return Err(new InvalidArgumentsError(this.usage))
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
      const found = env.canvas.requireContainer(containerId)
      if (!found.ok) return found
      target = found.value
    }
    target.addChild(shape)

    const at = containerId === null ? '' : ` in ${target.ref()}`
    return Ok(new EditPayload(`${shape.ref()} created${at}`, `${shape.ref()} deleted`))
  }
}
