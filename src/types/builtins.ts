import { ShapeFactory } from './ShapeFactory'
import { circleProvider } from './Circle'
import { ellipseProvider } from './Ellipse'
import { groupProvider } from './Group'
import { lineProvider } from './Line'
import { rectProvider } from './Rect'
import { textProvider } from './Text'

// 内置六类型注册；Map 覆盖写保证重复调用幂等
export function registerBuiltins(): void {
  ShapeFactory.register(rectProvider)
  ShapeFactory.register(circleProvider)
  ShapeFactory.register(ellipseProvider)
  ShapeFactory.register(lineProvider)
  ShapeFactory.register(textProvider)
  ShapeFactory.register(groupProvider)
}
