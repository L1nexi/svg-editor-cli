// 严格十进制数解析：坐标系为 px 浮点；不接受十六进制、Infinity 等宽松形式
const NUM_RE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

export function parseNumber(s: string): number | null {
  if (!NUM_RE.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// read 路径的宽容取数：属性缺失或非法一律落 0（§6 读回样例没有缺属性错误场景）
export function attrNumber(v: string | undefined): number {
  if (v === undefined) return 0
  return parseNumber(v) ?? 0
}

// 输出格式：整数不带小数点，6 位小数内清尾零（Q6 的默认裁决）
export function formatNumber(n: number): string {
  const cleaned = Number(n.toFixed(6))
  return String(Object.is(cleaned, -0) ? 0 : cleaned)
}
