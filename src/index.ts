import { IO } from 'fp-ts/lib/IO'
import * as c from 'graphics-ts/lib/canvas'

type Tree<A> =
  | {
      type: 'Leaf'
      value: A
    }
  | {
      type: 'Node'
      value: A
      left: Tree<A>
      right: Tree<A>
    }

type Point = {
  x: number
  y: number
}

type Line = {
  start: Point
  angle: number
  length: number
  width: number
}

function endpoint(line: Line): Point {
  return {
    x: line.start.x + line.length * Math.cos(line.angle),
    y: -(-line.start.y + line.length * Math.sin(line.angle))
  }
}

type FractalParameters = {
  leftAngle: number
  rightAngle: number
  shrinkFactor: number
}

function createBranches(p: FractalParameters, line: Line): [Line, Line] {
  const { x, y } = endpoint(line)
  const left = {
    start: {
      x,
      y
    },
    angle: Math.PI * (line.angle / Math.PI + p.leftAngle),
    length: line.length * p.shrinkFactor,
    width: line.width * p.shrinkFactor
  }
  const right = {
    start: {
      x,
      y
    },
    angle: Math.PI * (line.angle / Math.PI - p.rightAngle),
    length: line.length * p.shrinkFactor,
    width: line.width * p.shrinkFactor
  }
  return [left, right]
}

function createTree(depth: number, p: FractalParameters, line: Line): Tree<Line> {
  if (depth <= 0) {
    return { type: 'Leaf', value: line }
  }
  const [leftLine, rightLine] = createBranches(p, line)
  const left = createTree(depth - 1, p, leftLine)
  const right = createTree(depth - 1, p, rightLine)
  return {
    type: 'Node',
    value: line,
    left,
    right
  }
}

function drawLine(ctx: CanvasRenderingContext2D, line: Line): IO<CanvasRenderingContext2D> {
  const { x, y } = endpoint(line)
  const path = c
    .moveTo(ctx, line.start.x, line.start.y)
    .chain(() => c.setLineWidth(ctx, line.width))
    .chain(() => c.lineTo(ctx, x, y))
    .chain(() => c.closePath(ctx))
  return c.strokePath(ctx, path)
}

function drawTree(ctx: CanvasRenderingContext2D, tree: Tree<Line>): IO<CanvasRenderingContext2D> {
  switch (tree.type) {
    case 'Leaf':
      return drawLine(ctx, tree.value)
    case 'Node':
      return drawLine(ctx, tree.value)
        .chain(() => drawTree(ctx, tree.left))
        .chain(() => drawTree(ctx, tree.right))
  }
}

function main(): IO<CanvasRenderingContext2D> {
  const canvas = c.unsafeGetCanvasElementById('canvas')
  const ctx = c.unsafeGetContext2D(canvas)
  const line = { start: { x: 300.0, y: 600.0 }, angle: Math.PI / 2.0, length: 100.0, width: 4.0 }
  const p = { leftAngle: 0.1, rightAngle: 0.1, shrinkFactor: 0.8 }
  const tree = createTree(10, p, line)
  return drawTree(ctx, tree)
}

main().run()
