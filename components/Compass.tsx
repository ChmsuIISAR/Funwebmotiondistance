import React, { useRef, useEffect } from 'react';

interface CompassProps {
  directionAngle: number; // in radians, 0 is East (standard unit circle), but we might map it differently
  active: boolean;
}

const Compass: React.FC<CompassProps> = ({ directionAngle, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Draw Background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Directions
    const directions = [
      { label: 'N', angle: -Math.PI / 2 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: Math.PI / 2 },
      { label: 'W', angle: Math.PI },
    ];

    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    directions.forEach(dir => {
      // Check if this direction is "active" based on input angle
      // Allow some tolerance
      let isActive = false;
      if (active) {
        // Normalize angles to 0-2PI for comparison if needed, but simple diff works
        const diff = Math.abs(dir.angle - directionAngle);
        if (diff < 0.1) isActive = true;
      }

      ctx.fillStyle = isActive ? '#ef4444' : '#94a3b8'; // Red glow if active, else slate
      
      // Position text
      const textX = centerX + (radius - 15) * Math.cos(dir.angle);
      const textY = centerY + (radius - 15) * Math.sin(dir.angle);
      
      ctx.shadowBlur = isActive ? 10 : 0;
      ctx.shadowColor = '#ef4444';
      ctx.fillText(dir.label, textX, textY);
      ctx.shadowBlur = 0;
    });

    // Draw Needle
    if (active) {
      const needleLen = radius - 30;
      const tipX = centerX + needleLen * Math.cos(directionAngle);
      const tipY = centerY + needleLen * Math.sin(directionAngle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Arrowhead
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    } else {
        // Static neutral needle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#64748b';
        ctx.fill();
    }

  }, [directionAngle, active]);

  return (
    <div className="flex flex-col items-center bg-slate-800 p-2 rounded-lg shadow-lg border border-slate-700">
      <canvas ref={canvasRef} width={150} height={150} className="w-[150px] h-[150px]" />
      <span className="text-xs text-slate-400 mt-2 font-mono">DIGITAL COMPASS</span>
    </div>
  );
};

export default Compass;
