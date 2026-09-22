import React, { useEffect, useRef } from 'react';

type MosaicSource = typeof import('./mosaicFrames').MOSAIC;

interface Cell {
  x: number;
  y: number;
  ch: string;
  color: string;
}

interface Decoded {
  width: number;
  height: number;
  fps: number;
  fontSize: number;
  frames: Cell[][];
}

// '@' và '#' được thay bằng chữ tiếng Việt; mỗi ô giữ cố định một chữ để không nhấp nháy.
const VN_CHARS = ['Â', 'Ă', 'Ê', 'Ô', 'Ơ', 'Ư', 'Đ', 'Ớ', 'Ừ', 'Ấ', 'Ầ', 'Ẩ', 'Ặ', 'Ế', 'Ề', 'Ệ', 'Ố', 'Ồ', 'Ộ', 'Ờ', 'Ở', 'Ợ', 'Ứ', 'Ử', 'Ữ', 'Ự', 'Ẫ', 'Ỗ', 'Ễ', 'Ỡ'];
const FONT_STACK = "Consolas, 'Cascadia Mono', Menlo, 'SF Mono', 'Courier New', 'Noto Sans Mono', 'DejaVu Sans', monospace";

function decode(m: MosaicSource): Decoded {
  const raw = atob(m.data);
  const cellCount = m.cols * m.rows;

  const seeds = new Uint32Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    let h = Math.imul(i + 1, 2654435761);
    h ^= h >>> 15;
    h = Math.imul(h, 2246822519);
    h ^= h >>> 13;
    seeds[i] = (h ^ Math.floor(Math.random() * 4294967296)) >>> 0;
  }

  const frames: Cell[][] = [];
  for (let f = 0; f < m.frames; f++) {
    const list: Cell[] = [];
    for (let c = 0; c < cellCount; c++) {
      const o = (f * cellCount + c) * 4;
      const code = raw.charCodeAt(o);
      if (!code) continue;
      let ch: string = m.chars[code - 1];
      if (ch === '@' || ch === '#') ch = VN_CHARS[seeds[c] % VN_CHARS.length];
      list.push({
        x: m.xs[c % m.cols],
        y: m.ys[(c / m.cols) | 0],
        ch,
        color: `rgb(${raw.charCodeAt(o + 1)},${raw.charCodeAt(o + 2)},${raw.charCodeAt(o + 3)})`,
      });
    }
    frames.push(list);
  }

  return { width: m.width, height: m.height, fps: m.fps, fontSize: m.fontSize, frames };
}

// Giải mã một lần cho cả phiên; mở popup lần sau dùng lại ngay.
let cache: Promise<Decoded> | null = null;
function loadMosaic(): Promise<Decoded> {
  if (!cache) {
    cache = import('./mosaicFrames').then(({ MOSAIC }) => decode(MOSAIC));
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

interface MosaicCanvasProps {
  className?: string;
}

export const MosaicCanvas: React.FC<MosaicCanvasProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let alive = true;
    let raf = 0;
    let data: Decoded | null = null;
    let cur = 0;
    let last = performance.now();
    let dirty = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      dirty = true;
    };

    const draw = () => {
      if (!data) return;
      const W = canvas.width;
      const H = canvas.height;
      // Phủ kín khung (cover), căn đáy để phần dưới hình luôn hiện đủ.
      const k = Math.max(W / data.width, H / data.height);
      const ox = (W - data.width * k) / 2;
      const oy = H - data.height * k;

      ctx.clearRect(0, 0, W, H);
      ctx.font = `bold ${data.fontSize * k}px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const pad = 8 * k;
      let lastColor = '';
      for (const cell of data.frames[cur]) {
        const x = ox + cell.x * k;
        const y = oy + cell.y * k;
        if (x < -pad || x > W + pad || y < -pad || y > H + pad) continue;
        if (cell.color !== lastColor) {
          ctx.fillStyle = cell.color;
          lastColor = cell.color;
        }
        ctx.fillText(cell.ch, x, y);
      }
      dirty = false;
    };

    const loop = (now: number) => {
      if (!alive) return;
      if (data && !reduceMotion) {
        const interval = 1000 / data.fps;
        const delta = now - last;
        if (delta >= interval) {
          last = now - (delta % interval);
          cur = (cur + 1) % data.frames.length;
          dirty = true;
        }
      }
      if (dirty) draw();
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    loadMosaic()
      .then((d) => {
        if (!alive) return;
        data = d;
        last = performance.now();
        dirty = true;
      })
      .catch((err) => console.error('Không tải được motion mosaic:', err));

    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};
