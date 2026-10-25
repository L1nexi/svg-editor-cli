import type { Canvas } from '../../types/Canvas'

// 画布访问：编辑类拿到草稿克隆，显示类拿到当前画布只读（ADR-0004 决策一路由）
export interface EditEnv {
  readonly canvas: Canvas
}
