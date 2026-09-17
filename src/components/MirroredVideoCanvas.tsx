import React, { useEffect, useRef, useState } from 'react';

interface MirroredVideoCanvasProps {
  src: string;
}

export const MirroredVideoCanvas: React.FC<MirroredVideoCanvasProps> = ({ src }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mirrorState, setMirrorState] = useState<{ hasMirror: boolean; blurWidth: number }>({
    hasMirror: false,
    blurWidth: 0,
  });

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isDestroyed = false;
    let frameCallbackId: number | null = null;
    let animFrameId: number | null = null;

    const updateMirrorStatus = () => {
      if (!container || video.videoHeight === 0) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;
      const videoAspect = video.videoWidth / video.videoHeight;
      const unitWidth = ch * videoAspect;
      const isMirroring = cw > unitWidth + 2;
      const mirrorWidth = isMirroring ? (cw - unitWidth) / 2 : 0;
      // Penetrate deeply into the center video (up to 70% of the center half-width, capped at 45% of viewport width)
      const centerHalfWidth = unitWidth / 2;
      const blurWidth = isMirroring
        ? Math.min(cw * 0.45, mirrorWidth + centerHalfWidth * 0.7)
        : 0;

      setMirrorState((prev) => {
        if (prev.hasMirror === isMirroring && Math.abs(prev.blurWidth - blurWidth) < 2) {
          return prev;
        }
        return { hasMirror: isMirroring, blurWidth };
      });
    };

    const resizeCanvas = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width > 0 && height > 0) {
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      }
      updateMirrorStatus();
    };

    const drawFrame = () => {
      if (!ctx || !video || video.videoWidth === 0 || video.videoHeight === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      if (cw === 0 || ch === 0) return;

      const videoAspect = video.videoWidth / video.videoHeight;
      const unitWidth = ch * videoAspect;
      const centerX = (cw - unitWidth) / 2;

      // 1. Draw center frame (slight 0.5px overlap to eliminate sub-pixel raster gaps)
      ctx.drawImage(video, centerX - 0.5, 0, unitWidth + 1, ch);

      // 2. Draw left mirror tiles if screen is wider than center video
      let curLeft = centerX;
      let mirrorLeft = true;
      while (curLeft > 0) {
        ctx.save();
        if (mirrorLeft) {
          ctx.translate(curLeft, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, -0.5, 0, unitWidth + 1, ch);
        } else {
          ctx.drawImage(video, curLeft - unitWidth - 0.5, 0, unitWidth + 1, ch);
        }
        ctx.restore();
        curLeft -= unitWidth;
        mirrorLeft = !mirrorLeft;
      }

      // 3. Draw right mirror tiles if screen is wider than center video
      let curRight = centerX + unitWidth;
      let mirrorRight = true;
      while (curRight < cw) {
        ctx.save();
        if (mirrorRight) {
          ctx.translate(curRight + unitWidth, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, -0.5, 0, unitWidth + 1, ch);
        } else {
          ctx.drawImage(video, curRight - 0.5, 0, unitWidth + 1, ch);
        }
        ctx.restore();
        curRight += unitWidth;
        mirrorRight = !mirrorRight;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      drawFrame();
    });
    resizeObserver.observe(container);
    resizeCanvas();

    const handleLoadedMetadata = () => {
      resizeCanvas();
      drawFrame();
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Render loop using requestVideoFrameCallback (fallback to requestAnimationFrame)
    const onFrame = () => {
      if (isDestroyed) return;
      drawFrame();
      if ('requestVideoFrameCallback' in video) {
        frameCallbackId = (video as unknown as { requestVideoFrameCallback: (cb: () => void) => number }).requestVideoFrameCallback(onFrame);
      } else {
        animFrameId = requestAnimationFrame(onFrame);
      }
    };

    if ('requestVideoFrameCallback' in video) {
      frameCallbackId = (video as unknown as { requestVideoFrameCallback: (cb: () => void) => number }).requestVideoFrameCallback(onFrame);
    } else {
      animFrameId = requestAnimationFrame(onFrame);
    }

    video.play().catch(() => {});

    return () => {
      isDestroyed = true;
      resizeObserver.disconnect();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (frameCallbackId !== null && 'cancelVideoFrameCallback' in video) {
        (video as unknown as { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(frameCallbackId);
      }
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      video.pause();
    };
  }, [src]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Single video decoder instance - completely invisible */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="sr-only pointer-events-none opacity-0 absolute w-1 h-1"
      />
      {/* 100% frame-locked synchronized single canvas output */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Progressive blur gradients at viewport edges when mirror video is active */}
      {mirrorState.hasMirror && (
        <>
          {/* Left edge: progressive blur gradually fading inward deep into center video */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-1 overflow-hidden transition-all duration-300"
            style={{ width: `${mirrorState.blurWidth}px` }}
          >
            {/* Layer 1: Edge defocus (48px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(35px)',
                WebkitBackdropFilter: 'blur(35px)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 12%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0) 40%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 12%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0) 40%)',
              }}
            />
            {/* Layer 2: Deep defocus (28px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0) 60%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0) 60%)',
              }}
            />
            {/* Layer 3: Medium soft blur (16px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 58%, rgba(0,0,0,0) 78%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 58%, rgba(0,0,0,0) 78%)',
              }}
            />
            {/* Layer 4: Gentle transition blur (8px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.3) 72%, rgba(0,0,0,0) 90%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.3) 72%, rgba(0,0,0,0) 90%)',
              }}
            />
            {/* Layer 5: Ultra-soft feather tail (3px) penetrating deep into the center */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 100%)',
              }}
            />
            {/* Soft, natural ambient vignette (gentle gradient, no hard dark band) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/5 to-transparent" />
          </div>

          {/* Right edge: progressive blur gradually fading inward deep into center video */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-1 overflow-hidden transition-all duration-300"
            style={{ width: `${mirrorState.blurWidth}px` }}
          >
            {/* Layer 1: Edge defocus (48px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(35px)',
                WebkitBackdropFilter: 'blur(35px)',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 12%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0) 40%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 12%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0) 40%)',
              }}
            />
            {/* Layer 2: Deep defocus (28px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0) 60%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0) 60%)',
              }}
            />
            {/* Layer 3: Medium soft blur (16px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 58%, rgba(0,0,0,0) 78%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 58%, rgba(0,0,0,0) 78%)',
              }}
            />
            {/* Layer 4: Gentle transition blur (8px) */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.3) 72%, rgba(0,0,0,0) 90%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.3) 72%, rgba(0,0,0,0) 90%)',
              }}
            />
            {/* Layer 5: Ultra-soft feather tail (3px) penetrating deep into the center */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 100%)',
              }}
            />
            {/* Soft, natural ambient vignette (gentle gradient, no hard dark band) */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-black/5 to-transparent" />
          </div>
        </>
      )}
    </div>
  );
};
