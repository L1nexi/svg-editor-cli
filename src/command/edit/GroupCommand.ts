import { CannotGroupIntoDescendantError, Err, IdExistsError, Ok, type Result } from '../../errors'
import { Group } from '../../types/shapes/Group'
import type { Shape } from '../../types/base/Shape'
import type { EditEnv } from '../base/EditEnv'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// group <newGid> <id1> <id2>…：新建容器（挂画布根，spec v1.2）并收编，从各自原父容器摘出。
// 收编顺序 = 原树前序遍历遭遇序（参数序 ≠ 树序时按树序）；环 = 目标同时含某容器与其子孙
export class GroupCommand extends UndoableCommand {
  readonly name = 'group'
  protected override readonly minArgs = 3
  protected override readonly usage = '<newGid> <id1> <id2>…'

  protected override execute(args: string[], env: EditEnv): Result<EditPayload> {
    const newGid = args[0]!
    if (env.canvas.findById(newGid) !== null) {
      return Err(new IdExistsError(newGid))
    }
    const targets: Shape[] = []
    for (const t of args.slice(1)) {
      if (targets.some(s => s.id === t)) continue // 重复目标忽略多余出现（P）
      const found = env.canvas.requireShape(t)
      if (!found.ok) return found
      targets.push(found.value)
    }
    for (const a of targets) {
      for (const b of targets) {
        if (a !== b && env.canvas.hasAncestor(b, a)) {
          return Err(new CannotGroupIntoDescendantError(a.id))
        }
      }
    }

    const ordered: Shape[] = []
    const walk = (s: Shape): void => {
      if (targets.includes(s)) ordered.push(s)
      if (s instanceof Group) for (const c of s.childrenList()) walk(c)
    }
    walk(env.canvas.getRoot())

    const g = new Group(newGid)
    for (const s of ordered) {
      s.parent!.removeChild(s)
      g.addChild(s)
    }
    env.canvas.getRoot().addChild(g)

    const n = ordered.length
    return Ok(
      new EditPayload(`${g.ref()} created with ${n} children`, `${g.ref()} dissolved, ${n} children restored`),
    )
  }
}
