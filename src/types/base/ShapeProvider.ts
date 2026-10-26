import { BadNumberError, Err, InvalidArgumentsError, Ok, type Result } from '../../errors'
import { parseNumber } from '../num'
import type { Shape } from './Shape'
import type { CoordinateTransform } from './CoordinateTransform'

// 图形类型的注册契约（作业 §4.4 ShapeProvider 插槽的最小形状；本阶段仅内置类型实现，
// 外部加载属插件化阶段目标）
export interface ShapeProvider {
  readonly typeName: string
  // create 路径：id 之后的位置参数；参数个数与数值的知识归各类
  fromArgs(id: string, args: string[]): Result<Shape>
  // read 路径：XML 属性 → 图形；textContent 仅 text 元素使用
  fromAttrs(
    id: string,
    attrs: Record<string, string>,
    textContent?: string,
    transform?: CoordinateTransform,
  ): Shape
}

// 位置参数 → 定长数值元组（调用方保证 args.length >= names.length）
export function numsOr<T extends readonly string[]>(
  args: string[],
  names: T,
): Result<{ [K in keyof T]: number }> {
  const nums: number[] = []
  for (let i = 0; i < names.length; i++) {
    const raw = args[i]
    const n = raw === undefined ? null : parseNumber(raw)
    if (raw === undefined || n === null) {
      return Err(new BadNumberError(names[i]!, raw ?? ''))
    }
    nums.push(n)
  }
  return Ok(nums as { [K in keyof T]: number })
}

// 数值型叶子的 fromArgs 骨架：参数个数检查 → 数值解析 → 构造 → 可选画笔属性（第 names.length 个参数）
export function numericFromArgs<T extends readonly string[]>(
  id: string,
  args: string[],
  expected: string,
  names: T,
  paintKey: 'fill' | 'stroke',
  build: (nums: { [K in keyof T]: number }) => Shape,
): Result<Shape> {
  if (args.length < names.length || args.length > names.length + 1) {
    return Err(new InvalidArgumentsError(expected))
  }
  const nums = numsOr(args, names)
  if (!nums.ok) return nums
  const shape = build(nums.value)
  shape.applyCommonAttrs({ [paintKey]: args[names.length] })
  return Ok(shape)
}
