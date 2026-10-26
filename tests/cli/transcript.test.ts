import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readdirSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const loader = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const main = resolve('src/main.ts')
let directory: string

beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'svg-transcript-test-')) })
afterEach(() => {
  for (const file of readdirSync(directory)) unlinkSync(join(directory, file))
  rmdirSync(directory)
})

function transcript(commands: readonly string[], responses: readonly string[]): void {
  const result = spawnSync(process.execPath, ['--import', loader, main], {
    cwd: directory,
    input: commands.join('\n') + '\n',
    encoding: 'utf8',
    timeout: 15000,
  })
  if (result.error) throw result.error
  expect(result.status).toBe(0)
  expect(result.stderr).toBe('')
  expect(result.stdout).toBe(
    "svg-editor 0.1 — type 'help' for commands\n\nsvg> " + responses.join('\nsvg> ') + '\nsvg> ',
  )
}

describe('作业会话端到端（doc/spec/commands.md）', () => {
  it('完整编辑、撤销重做、失败、保存和外部 SVG 读入', () => {
    copyFileSync(new URL('../io/fixtures/other.svg', import.meta.url), join(directory, 'other.svg'))
    transcript([
      'init 800 600',
      'create rect bg 0 0 800 600 #ffffff',
      'create text title 20 40 "My Diagram"',
      'create circle c1 100 100 20 red',
      'create rect box 200 80 60 60 #3366ff',
      'group markers c1 box',
      'tree',
      'move c1 30 0',
      'undo',
      'redo',
      'set title text "My Diagram v2"',
      'undo',
      'group bad c1 markers',
      'delete box',
      'undo',
      'save demo.svg',
      'undo',
      'read other.svg',
      'tree',
      'undo',
    ], [
      'canvas 800x600 created',
      'rect#bg created',
      'text#title created',
      'circle#c1 created',
      'rect#box created',
      'g#markers created with 2 children',
      'svg (800x600)\n' +
        '├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff\n' +
        '├── text#title     (20,40) "My Diagram"\n' +
        '└── g#markers\n' +
        '    ├── circle#c1  cx=100 cy=100 r=20 fill=red\n' +
        '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
      'circle#c1 moved to (130,100)',
      'circle#c1 moved back to (100,100)',
      'circle#c1 moved to (130,100)',
      'text#title updated: text="My Diagram v2"',
      'text#title updated: text="My Diagram"',
      'error: cannot group a container into its own descendant: markers',
      'rect#box deleted',
      'rect#box restored into g#markers',
      'saved to demo.svg (5 elements)',
      'error: undo not allowed after io command',
      'warning: assigned id rect1 to unnamed <rect>\nread other.svg (7 elements)',
      'svg (400x300)\n' +
        '├── rect#rect1     x=0 y=0 w=400 h=300 fill=#ffffff\n' +
        '├── text#t1        (10,290) "imported"\n' +
        '├── circle#c1      cx=50 cy=50 r=10\n' +
        '├── g#g1\n' +
        '│   ├── rect#r2    x=0 y=0 w=10 h=10\n' +
        '│   └── circle#c2  cx=5 cy=5 r=2\n' +
        '└── ellipse#e1     cx=1 cy=2 rx=3 ry=4',
      'error: undo not allowed after io command',
    ])
    expect(readFileSync(join(directory, 'demo.svg'), 'utf8')).toContain('id="markers"')
  }, 20000)

  it('两节点流程图：逐层创建、容器移动、撤销、内容修改与保存', () => {
    transcript([
      'init 800 600',
      'create g flowchart',
      'create g node1 in flowchart',
      'create rect start 120 100 160 60 #4a90d9 in node1',
      'create text start-label 155 135 "开始" in node1',
      'create g node2 in flowchart',
      'create rect process 520 100 160 60 #f5a623 in node2',
      'create text process-label 545 135 "处理数据" in node2',
      'create line arrow1 280 130 520 130 black in flowchart',
      'tree',
      'move node2 0 100',
      'undo',
      'set process-label text "处理数据 v2"',
      'save flowchart.svg',
    ], [
      'canvas 800x600 created',
      'g#flowchart created',
      'g#node1 created in g#flowchart',
      'rect#start created in g#node1',
      'text#start-label created in g#node1',
      'g#node2 created in g#flowchart',
      'rect#process created in g#node2',
      'text#process-label created in g#node2',
      'line#arrow1 created in g#flowchart',
      // 流程图按规格的列宽公式；样例手排差异已在 doc/README.md 留痕。
      'svg (800x600)\n' +
        '└── g#flowchart\n' +
        '    ├── g#node1\n' +
        '    │   ├── rect#start          x=120 y=100 w=160 h=60 fill=#4a90d9\n' +
        '    │   └── text#start-label    (155,135) "开始"\n' +
        '    ├── g#node2\n' +
        '    │   ├── rect#process        x=520 y=100 w=160 h=60 fill=#f5a623\n' +
        '    │   └── text#process-label  (545,135) "处理数据"\n' +
        '    └── line#arrow1             (280,130) -> (520,130)',
      'g#node2 moved by (0,100)',
      'g#node2 moved back by (0,-100)',
      'text#process-label updated: text="处理数据 v2"',
      'saved to flowchart.svg (8 elements)',
    ])
    expect(readFileSync(join(directory, 'flowchart.svg'), 'utf8')).toContain('处理数据 v2')
  }, 20000)
})
