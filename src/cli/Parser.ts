// 词法（doc/spec/commands.md §1 分词/注释行）：空格切分；双引号包裹，引号内空格不切分，
// 引号可在参数任意位置开合；`\"` 为字面双引号；未闭合引号按行尾闭合（宽容，细则 P）。
// 行首（含前导空白）`#` 整行忽略、空行与纯空白行 → 空 token 数组，Repl 统一静默重提示。
// 退化 corner 见 spec §4.2 create：引号痕迹不保留，末位裸 token `in` 按容器标记处理。
export class Parser {
  parse(line: string): string[] {
    if (line.trim() === '' || line.trimStart().startsWith('#')) return []
    const tokens: string[] = []
    let current = ''
    let inQuote = false
    let started = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '\\' && line[i + 1] === '"') {
        current += '"'
        i++
        started = true
      } else if (ch === '"') {
        inQuote = !inQuote
        started = true
      } else if (ch === ' ' && !inQuote) {
        if (started) {
          tokens.push(current)
          current = ''
          started = false
        }
      } else {
        current += ch
        started = true
      }
    }
    if (started) tokens.push(current)
    return tokens
  }
}
