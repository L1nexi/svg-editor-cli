import { CoordinateTransform } from '../types/base/CoordinateTransform'
import { parseNumber } from '../types/num'

// SVG 数字列表的词法；逗号或空白分隔，不接受空项、Infinity 或非数值尾缀。
export function svgNumbers(source: string): number[] | null {
  if (source.trim() === '') return []
  const numbers: number[] = []
  for (const token of source.trim().split(/\s*,\s*|\s+/)) {
    const value = parseNumber(token)
    if (value === null) return null
    numbers.push(value)
  }
  return numbers
}

// 仅识别变换语法，不按图形类型分派（ADR-0007）。
export class SvgTransform {
  constructor(private readonly source: string) {}

  appendTo(parent: CoordinateTransform): CoordinateTransform | null {
    const source = this.source.trim()
    const operation = /\s*(translate|scale)\s*\(([^()]*)\)\s*(?:,\s*(?=\S))?/y
    let transform = parent
    let position = 0
    while (position < source.length) {
      operation.lastIndex = position
      const match = operation.exec(source)
      if (match === null) return null
      const args = svgNumbers(match[2]!)
      if (args === null || args.length < 1 || args.length > 2) return null
      const first = args[0]!
      const next = match[1] === 'translate'
        ? new CoordinateTransform(1, 1, first, args[1] ?? 0)
        : new CoordinateTransform(first, args[1] ?? first)
      transform = transform.append(next)
      position = operation.lastIndex
    }
    return transform
  }
}
