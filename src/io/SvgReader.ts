import { DOMParser, onWarningStopParsing, ParseError, type Element } from '@xmldom/xmldom'
import { CannotReadFileError, Err, Ok, type Result } from '../errors'
import { Canvas } from '../types/Canvas'
import { CoordinateTransform } from '../types/base/CoordinateTransform'
import { ShapeFactory } from '../types/base/ShapeFactory'
import { parseNumber } from '../types/num'
import { Group } from '../types/shapes/Group'
import { SvgIds } from './SvgIds'
import { svgNumbers, SvgTransform } from './SvgTransform'

// 每次读取独立的文档构建器；只有完整成功才向 engine 交付画布（ADR-0007）。
export class SvgReader {
  private readonly warnings: string[] = []
  private readonly ids: SvgIds

  private constructor(private readonly root: Element) {
    this.ids = new SvgIds(this.explicitIds(root))
  }

  static read(source: string, path: string): Result<{ canvas: Canvas; warnings: string[] }> {
    let root: Element | null
    try {
      root = new DOMParser({ onError: onWarningStopParsing })
        .parseFromString(source, 'application/xml').documentElement
    } catch (error) {
      if (!(error instanceof ParseError)) throw error
      return Err(new CannotReadFileError(path))
    }
    if (root === null || SvgReader.tag(root) !== 'svg' || !SvgReader.svgNamespace(root)) {
      return Err(new CannotReadFileError(path))
    }
    const reader = new SvgReader(root)
    const viewport = reader.viewport()
    if (viewport === null) return Err(new CannotReadFileError(path))
    const transform = reader.transform(root, new CoordinateTransform(), 'svg').append(viewport.transform)
    const rootPaint: Record<string, string> = {}
    for (const name of ['fill', 'stroke', 'stroke-width']) {
      if (root.hasAttribute(name)) rootPaint[name] = root.getAttribute(name)!
    }
    for (const child of reader.children(root)) {
      reader.readElement(child, viewport.canvas.getRoot(), transform, rootPaint)
    }
    return Ok({ canvas: viewport.canvas, warnings: reader.warnings })
  }

  private static svgNamespace(element: Element): boolean {
    return !element.namespaceURI || element.namespaceURI === 'http://www.w3.org/2000/svg'
  }

  private static tag(element: Element): string {
    return element.localName ?? element.tagName
  }

  private children(element: Element): Element[] {
    return Array.from(element.childNodes).filter((child): child is Element => child.nodeType === 1)
  }

  private explicitIds(parent: Element): string[] {
    const ids: string[] = []
    for (const child of this.children(parent)) {
      if (!SvgReader.svgNamespace(child) || ShapeFactory.provider(SvgReader.tag(child)) === null) continue
      const id = child.getAttribute('id') ?? ''
      if (id !== '') ids.push(id)
      ids.push(...this.explicitIds(child))
    }
    return ids
  }

  private readElement(
    element: Element,
    parent: Group,
    inherited: CoordinateTransform,
    inheritedPaint: Record<string, string> = {},
  ): void {
    const tag = SvgReader.tag(element)
    const provider = SvgReader.svgNamespace(element) ? ShapeFactory.provider(tag) : null
    if (provider === null) {
      this.warnings.push(`warning: skipped unsupported element <${element.tagName}>`)
      return
    }
    const requested = element.getAttribute('id') ?? ''
    const id = this.ids.allocate(tag, requested)
    if (requested === '') {
      this.warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`)
    } else if (id !== requested) {
      this.warnings.push(`warning: renamed duplicate id ${requested} to ${id}`)
    }
    const transform = this.transform(element, inherited, id)
    const attrs = {
      ...inheritedPaint,
      ...Object.fromEntries(Array.from(element.attributes).map(attr => [attr.name, attr.value])),
    }
    const text = Array.from(element.childNodes)
      .filter(node => node.nodeType === 3 || node.nodeType === 4)
      .map(node => node.nodeValue ?? '').join('')
    const shape = provider.fromAttrs(id, attrs, text, transform)
    parent.addChild(shape)
    if (shape instanceof Group) {
      for (const child of this.children(element)) this.readElement(child, shape, transform)
    } else {
      for (const child of this.children(element)) {
        this.warnings.push(`warning: skipped unsupported element <${child.tagName}>`)
      }
    }
  }

  private transform(element: Element, inherited: CoordinateTransform, id: string): CoordinateTransform {
    const transform = new SvgTransform(element.getAttribute('transform') ?? '').appendTo(inherited)
    if (transform !== null) return transform
    this.warnings.push(`warning: ignored unsupported transform on ${id}`)
    return inherited
  }

  private dimension(name: string, fallback: number): number | null {
    const raw = this.root.getAttribute(name)
    if (raw === null) return fallback
    const value = parseNumber(raw.trim().replace(/px$/, ''))
    return value !== null && value > 0 ? value : null
  }

  private viewport(): { canvas: Canvas; transform: CoordinateTransform } | null {
    const raw = this.root.getAttribute('viewBox')
    const box = raw === null ? null : svgNumbers(raw)
    if (raw !== null && (box === null || box.length !== 4 || box[2]! <= 0 || box[3]! <= 0)) return null
    const width = this.dimension('width', box?.[2] ?? 800)
    const height = this.dimension('height', box?.[3] ?? 600)
    if (width === null || height === null) return null
    const canvas = new Canvas(width, height)
    if (box === null) return { canvas, transform: new CoordinateTransform() }
    const [x, y, boxWidth, boxHeight] = box as [number, number, number, number]
    const sx = width / boxWidth
    const sy = height / boxHeight
    const aspect = (this.root.getAttribute('preserveAspectRatio') ?? 'xMidYMid meet')
      .trim().replace(/^defer\s+/, '')
    if (/^none(?:\s+(?:meet|slice))?$/.test(aspect)) {
      return { canvas, transform: new CoordinateTransform(sx, sy, -x * sx, -y * sy) }
    }
    const alignment = /^x(Min|Mid|Max)Y(Min|Mid|Max)(?:\s+(meet|slice))?$/.exec(aspect)
    if (alignment === null) return null
    const scale = alignment[3] === 'slice' ? Math.max(sx, sy) : Math.min(sx, sy)
    const positions: Record<string, number> = { Min: 0, Mid: 0.5, Max: 1 }
    return {
      canvas,
      transform: new CoordinateTransform(
        scale, scale,
        (width - boxWidth * scale) * positions[alignment[1]!]! - x * scale,
        (height - boxHeight * scale) * positions[alignment[2]!]! - y * scale,
      ),
    }
  }
}
