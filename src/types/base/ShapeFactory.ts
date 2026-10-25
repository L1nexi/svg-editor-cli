import type { ShapeProvider } from './ShapeProvider'

// 图形工厂：按名分派白名单允许的第二处（类型名 → 实现），架构方案中标注待重构
export class ShapeFactory {
  private static readonly providers = new Map<string, ShapeProvider>()

  static register(p: ShapeProvider): void {
    ShapeFactory.providers.set(p.typeName, p)
  }

  static provider(typeName: string): ShapeProvider | null {
    return ShapeFactory.providers.get(typeName) ?? null
  }

  static registeredTypes(): readonly string[] {
    return [...ShapeFactory.providers.keys()]
  }
}
