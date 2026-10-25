// 普通载荷：成功回显单块（可含 \n 多行）。载荷是纯数据 DTO、无行为；展示顺序归 cli（ADR-0004 决策三）
export class Payload {
  constructor(readonly forward: string) {}
}
