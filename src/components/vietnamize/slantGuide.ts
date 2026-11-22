// Vertical guides follow the font's slant: on an italic the axis marks are centred on leans.

/** Line through canvas point (x, y), tilted by the slant (degrees, + = leans right), from yTop to yBottom. */
export function strokeSlantAxis(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  slantAngle: number | undefined,
  yTop: number,
  yBottom: number
) {
  const tn = Math.tan(((slantAngle || 0) * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(x + tn * (y - yTop), yTop);
  ctx.lineTo(x - tn * (yBottom - y), yBottom);
  ctx.stroke();
}
