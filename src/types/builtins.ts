import { ShapeFactory } from './base/ShapeFactory'
import { circleProvider } from './shapes/Circle'
import { ellipseProvider } from './shapes/Ellipse'
import { groupProvider } from './shapes/Group'
import { lineProvider } from './shapes/Line'
import { rectProvider } from './shapes/Rect'
import { textProvider } from './shapes/Text'

// 内置六类型注册；Map 覆盖写保证重复调用幂等
export function registerBuiltins(): void {
  ShapeFactory.register(rectProvider)
  ShapeFactory.register(circleProvider)
  ShapeFactory.register(ellipseProvider)
  ShapeFactory.register(lineProvider)
  ShapeFactory.register(textProvider)
  ShapeFactory.register(groupProvider)
}
