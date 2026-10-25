import { describe, expect, it } from 'vitest'
import { Ok } from '../../src/errors'
import { Payload } from '../../src/command/base/Payload'
import type { TimelineEnv } from '../../src/command/base/TimelineEnv'
import { RedoCommand } from '../../src/command/timeline/RedoCommand'
import { UndoCommand } from '../../src/command/timeline/UndoCommand'

const undo = new UndoCommand()
const redo = new RedoCommand()

// 假时间线 env：外壳只透传，判定在 Timeline（engine.test 覆盖三行规则）
const env: TimelineEnv = {
  undo: () => Ok(new Payload('circle#c1 moved back to (100,100)')),
  redo: () => Ok(new Payload('circle#c1 moved to (130,100)')),
}

describe('undo / redo 外壳', () => {
  it('透传 TimelineEnv，forward 即时间线给的回显', () => {
    const r1 = undo.run([], env)
    if (!r1.ok) throw new Error(`意外失败: ${r1.error.format()}`)
    expect(r1.value.forward).toBe('circle#c1 moved back to (100,100)')
    const r2 = redo.run([], env)
    if (!r2.ok) throw new Error(`意外失败: ${r2.error.format()}`)
    expect(r2.value.forward).toBe('circle#c1 moved to (130,100)')
  })

  it('零参命令（§4.4）：argCounts [0]', () => {
    for (const cmd of [undo, redo]) {
      const r = cmd.run(['x'], env)
      if (r.ok) throw new Error('意外成功')
      expect(r.error.format()).toBe('error: invalid arguments: expected no parameters')
    }
  })
})
