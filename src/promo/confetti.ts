/**
 * Pure DOM canvas — removed from the DOM when it finishes.
 */
const COLORS = ['#34D399', '#6EE7B7', '#FFC53D', '#38BDF8', '#F472B6', '#F4F7FB'];

export function burstConfetti(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '2147483645';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  const parts = Array.from({ length: 150 }, () => ({
    x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 160,
    y: window.innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 13 - 3,
    size: 4 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.35,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const DURATION = 2200;
  const start = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const t = now - start;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const alpha = Math.max(0, 1 - t / DURATION);
    for (const p of parts) {
      p.vy += 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.992;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
      ctx.restore();
    }
    if (t < DURATION) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };

  raf = requestAnimationFrame(tick);
}
