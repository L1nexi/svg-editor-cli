// 轴向缩放与平移；坐标展开供读取使用，SVG 语法留在 io（ADR-0007）。
export class CoordinateTransform {
  constructor(
    private readonly sx = 1,
    private readonly sy = 1,
    private readonly tx = 0,
    private readonly ty = 0,
  ) {}

  x(value: number): number {
    return this.sx * value + this.tx
  }

  y(value: number): number {
    return this.sy * value + this.ty
  }

  width(value: number): number {
    return Math.abs(this.sx * value)
  }

  height(value: number): number {
    return Math.abs(this.sy * value)
  }

  // 父 * 子：先作用子变换，再作用当前变换。
  append(child: CoordinateTransform): CoordinateTransform {
    return new CoordinateTransform(
      this.sx * child.sx,
      this.sy * child.sy,
      this.x(child.tx),
      this.y(child.ty),
    )
  }
}
