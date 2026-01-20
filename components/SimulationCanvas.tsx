import React, { useRef, useEffect, useCallback } from 'react';
import { GRID_COLS, GRID_ROWS, NODES, VEHICLES, BUILDING_IMAGES } from '../constants';
import { VehicleType, SimulationResult, BuildingType, SegmentData } from '../types';

interface SimulationCanvasProps {
  vehicleType: VehicleType;
  gridScale: number; // Meters per square
  finishNodeId: string;
  showBuildings: boolean;
  isRunning: boolean;
  isFinished: boolean;
  onFinish: (result: SimulationResult) => void;
  // Physics Props
  targetSpeed: number; // Speed control
  friction: number;
  airResistance: number;
  mass: number;
  frictionStartNode: string;
  frictionEndNode: string;
  isDarkMode: boolean;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  vehicleType,
  gridScale,
  finishNodeId,
  showBuildings,
  isRunning,
  isFinished,
  onFinish,
  targetSpeed,
  friction,
  airResistance,
  mass,
  frictionStartNode,
  frictionEndNode,
  isDarkMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Timing Refs
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const segmentStartTimeRef = useRef<number>(0);
  
  // Physics State
  const currentSpeedRef = useRef<number>(0); // m/s
  const distanceTraveledRef = useRef<number>(0); // meters
  const collectedSegmentsRef = useRef<SegmentData[]>([]);
  
  // Images Ref
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const imagesLoadedRef = useRef<boolean>(false);
  
  // Position State
  const vehiclePosRef = useRef({ x: 0, y: 0 });
  const vehicleAngleRef = useRef(0);
  const currentPathIndexRef = useRef(0);
  const isFinishedRef = useRef(false);

  // Load Images
  useEffect(() => {
    const loadImages = async () => {
        const promises = Object.entries(BUILDING_IMAGES).map(([key, src]) => {
            return new Promise<void>((resolve) => {
                if (!src) { resolve(); return; }
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    imagesRef.current[key] = img;
                    resolve();
                };
                img.onerror = () => resolve(); 
            });
        });
        await Promise.all(promises);
        imagesLoadedRef.current = true;
    };
    loadImages();
  }, []);

  // Active Path
  const getPath = useCallback(() => {
    const finishIndex = NODES.findIndex(n => n.id === finishNodeId);
    if (finishIndex === -1) return NODES;
    return NODES.slice(0, finishIndex + 1);
  }, [finishNodeId]);

  const activePath = getPath();

  // Reset Logic
  useEffect(() => {
    if (!isRunning && !isFinished) {
        const startNode = NODES[0];
        vehiclePosRef.current = { x: startNode.x, y: startNode.y };
        currentPathIndexRef.current = 0;
        isFinishedRef.current = false;
        vehicleAngleRef.current = 0;
        currentSpeedRef.current = 0;
        distanceTraveledRef.current = 0;
        startTimeRef.current = 0;
        segmentStartTimeRef.current = 0;
        collectedSegmentsRef.current = [];
    }
  }, [isRunning, isFinished, finishNodeId]);

  // Helper: Draw Compass
  const drawCompass = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, carAngle: number) => {
    const radius = size / 2 - 10;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const bgColor = isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const borderColor = isDarkMode ? '#334155' : '#cbd5e1';
    const circleColor = isDarkMode ? '#1e293b' : '#f1f5f9';
    const textColor = isDarkMode ? '#64748b' : '#94a3b8';

    ctx.save();
    ctx.translate(cx, cy);

    // Box Background (Container)
    ctx.save();
    ctx.translate(-cx, -cy);
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, size, size, 12);
    else ctx.rect(x, y, size, size);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Compass Circle
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = circleColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cardinal Points
    const points = [
        { label: 'E', angle: 0 },
        { label: 'S', angle: Math.PI / 2 },
        { label: 'W', angle: Math.PI },
        { label: 'N', angle: -Math.PI / 2 },
    ];

    points.forEach(p => {
        let diff = Math.abs(p.angle - carAngle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        const isActive = diff < 0.2; 

        ctx.save();
        ctx.rotate(p.angle); 
        const tipX = radius - 5; 
        const innerX = radius * 0.25; 
        const widthY = radius * 0.15; 
        ctx.beginPath();
        ctx.moveTo(0, 0); 
        ctx.lineTo(innerX, -widthY);
        ctx.lineTo(tipX, 0);
        ctx.lineTo(innerX, widthY);
        ctx.closePath();
        ctx.fillStyle = isActive ? '#f59e0b' : textColor;
        ctx.fill();
        ctx.restore();

        // Label
        ctx.save();
        const lx = Math.cos(p.angle) * (radius - 12);
        const ly = Math.sin(p.angle) * (radius - 12);
        ctx.font = isActive ? 'bold 12px Inter' : 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isActive ? '#fbbf24' : textColor; 
        ctx.fillText(p.label, lx, ly);
        ctx.restore();
    });

    ctx.restore();
  };

  // --- DRAWING ---
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Grid Metrics
    const effectiveCols = GRID_COLS + 2;
    const effectiveRows = GRID_ROWS + 2;
    const scaleX = width / effectiveCols;
    const scaleY = height / effectiveRows;
    const cellSize = Math.min(scaleX, scaleY); 
    const startX = (width - effectiveCols * cellSize) / 2;
    const startY = (height - effectiveRows * cellSize) / 2;

    const mapX = (gx: number) => startX + cellSize + (gx * cellSize);
    const mapY = (gy: number) => startY + cellSize + (gy * cellSize);

    // Prepare positions
    const vx = mapX(vehiclePosRef.current.x);
    const vy = mapY(vehiclePosRef.current.y);

    // 2. Background & Theme Colors
    const bgFill = isDarkMode ? '#0f172a' : '#ffffff';
    const gridStroke = isDarkMode ? '#334155' : '#e2e8f0';
    const roadStroke = isDarkMode ? '#334155' : '#cbd5e1';
    const roadCenterStroke = isDarkMode ? '#475569' : '#94a3b8';
    const hudBg = isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const hudBorder = isDarkMode ? '#334155' : '#cbd5e1';
    const hudTextLabel = isDarkMode ? '#94a3b8' : '#64748b';
    const hudTextVal = isDarkMode ? '#fff' : '#1e293b';

    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, width, height);

    // Grid Lines
    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= GRID_COLS; i++) {
        const x = mapX(i);
        ctx.moveTo(x, mapY(0));
        ctx.lineTo(x, mapY(GRID_ROWS));
    }
    for (let j = 0; j <= GRID_ROWS; j++) {
        const y = mapY(j);
        ctx.moveTo(mapX(0), y);
        ctx.lineTo(mapX(GRID_COLS), y);
    }
    ctx.stroke();

    // 3. UI Layout Calculation
    const topMargin = 20;
    const sideMargin = 20;
    const componentSize = 125;
    
    // HUD PILL CONFIG
    const distPillWidth = 130; 
    const distPillHeight = 24; 
    const distPillX = sideMargin;
    const distPillY = topMargin;

    // Left Column: Legend (Shifted down below the HUD Pill)
    const legendX = sideMargin;
    const legendY = topMargin + distPillHeight + 12; // 12px gap
    
    // Calculate Legend Height
    let legendHeight = 0;
    if (showBuildings) {
        const padding = 12;
        const rowHeight = 26; 
        const legendBuildings = NODES.filter(n => n.type !== BuildingType.CORNER);
        legendHeight = legendBuildings.length * rowHeight + padding * 2 + 24; 
    }

    // Right Column: Compass
    const compassX = width - sideMargin - componentSize;
    const compassY = topMargin;

    // Right Column: Scale Indicator (Small box below compass)
    const scaleIndicatorY = compassY + componentSize + 10;
    const scaleHeight = 30;

    // Calculate common Y for bottom elements (Displacement & Monitor)
    const leftBottomClearance = legendY + legendHeight + 20;
    const rightBottomClearance = scaleIndicatorY + scaleHeight + 20;
    const commonY = Math.max(leftBottomClearance, rightBottomClearance);

    // --- DRAW TARGET DISTANCE HUD ---
    // Calculate path length
    let totalTargetDistance = 0;
    for (let i = 0; i < activePath.length - 1; i++) {
        const n1 = activePath[i];
        const n2 = activePath[i+1];
        const segDist = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
        totalTargetDistance += segDist;
    }
    const displayTargetDistance = Math.round(totalTargetDistance * gridScale);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = hudBg;
    ctx.strokeStyle = '#3b82f6'; // Blue accent
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(distPillX, distPillY, distPillWidth, distPillHeight, 12);
    else ctx.rect(distPillX, distPillY, distPillWidth, distPillHeight);
    ctx.fill();
    ctx.stroke();
    
    // Label
    ctx.fillStyle = hudTextLabel;
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText("TARGET", distPillX + 15, distPillY + distPillHeight/2);
    
    // Value
    ctx.fillStyle = hudTextVal;
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`${displayTargetDistance}m`, distPillX + distPillWidth - 15, distPillY + distPillHeight/2);
    ctx.restore();

    // Draw Legend (Location Guide)
    if (showBuildings) {
        const legendWidth = componentSize;
        const padding = 12;
        const rowHeight = 26; 
        const legendBuildings = NODES.filter(n => n.type !== BuildingType.CORNER);

        ctx.save();
        ctx.fillStyle = isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'; 
        ctx.strokeStyle = hudBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(legendX, legendY, legendWidth, legendHeight, 8);
        } else {
            ctx.rect(legendX, legendY, legendWidth, legendHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = hudTextLabel;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText("LOCATION GUIDE", legendX + padding, legendY + padding);
        ctx.textBaseline = 'middle';
        
        legendBuildings.forEach((node, i) => {
            const y = legendY + padding + 26 + (i * rowHeight);
            
            // Dot
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(legendX + padding + 6, y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Letter inside dot
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.font = 'bold 9px Inter';
            ctx.fillText(node.label, legendX + padding + 6, y + 1);

            // Icon
            const img = imagesRef.current[node.type];
            if (img) ctx.drawImage(img, legendX + padding + 18, y - 8, 16, 16);
            
            // Name
            ctx.fillStyle = hudTextVal;
            ctx.textAlign = 'left';
            ctx.font = '11px Inter';
            ctx.fillText(node.name, legendX + padding + 40, y + 1);
        });
        ctx.restore();
    }

    // Draw Compass (Top Right)
    drawCompass(ctx, compassX, compassY, componentSize, vehicleAngleRef.current);

    // Draw Scale Indicator (Right, below Compass)
    ctx.save();
    ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'; 
    ctx.strokeStyle = hudBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(compassX, scaleIndicatorY, componentSize, scaleHeight, 8);
    else ctx.rect(compassX, scaleIndicatorY, componentSize, scaleHeight);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 11px Inter';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`1 Sq = ${gridScale} meters`, compassX + componentSize/2, scaleIndicatorY + scaleHeight/2);
    ctx.restore();

    // Draw Live Displacement Indicator (Left, at commonY)
    const indX = legendX;
    const indY = commonY;
    
    // Calculate Displacement
    const startNode = NODES[0];
    const dxReal = (vehiclePosRef.current.x - startNode.x) * gridScale;
    const dyReal = (vehiclePosRef.current.y - startNode.y) * gridScale;
    const liveDisp = Math.sqrt(dxReal*dxReal + dyReal*dyReal);
    const dispAngle = Math.atan2(dyReal, dxReal);

    ctx.save();
    // Background
    ctx.fillStyle = hudBg;
    ctx.strokeStyle = '#ef4444'; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(indX, indY, componentSize, componentSize, 12);
    else ctx.rect(indX, indY, componentSize, componentSize);
    ctx.fill();
    ctx.stroke();

    // Labels
    ctx.fillStyle = hudTextLabel;
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("DISPLACEMENT", indX + componentSize/2, indY + 12);

    // Value
    ctx.fillStyle = hudTextVal;
    ctx.font = 'bold 26px Inter';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${liveDisp.toFixed(0)}m`, indX + componentSize/2, indY + 50);

    // Vector Visual
    const vecCx = indX + componentSize/2;
    const vecCy = indY + 90;
    const vecR = 20;

    // Crosshair
    ctx.strokeStyle = isDarkMode ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vecCx - vecR, vecCy);
    ctx.lineTo(vecCx + vecR, vecCy);
    ctx.moveTo(vecCx, vecCy - vecR);
    ctx.lineTo(vecCx, vecCy + vecR);
    ctx.stroke();

    // Vector Arrow
    if (liveDisp > 1) {
        ctx.save();
        ctx.translate(vecCx, vecCy);
        ctx.rotate(dispAngle);
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(vecR - 2, 0);
        ctx.stroke();
        
        // Arrowhead
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(vecR - 6, -4);
        ctx.lineTo(vecR, 0);
        ctx.lineTo(vecR - 6, 4);
        ctx.fill();
        ctx.restore();
    } else {
        // Dot if at start
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(vecCx, vecCy, 3, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();


    // Draw Live Monitor (Right, at commonY)
    if (isRunning) {
        const monitorX = compassX;
        const monitorY = commonY;
        const fStartIdx = NODES.findIndex(n => n.id === frictionStartNode);
        const fEndIdx = NODES.findIndex(n => n.id === frictionEndNode);
        
        ctx.save();
        ctx.fillStyle = hudBg;
        ctx.strokeStyle = '#3b82f6'; // Blue border for Monitor
        ctx.lineWidth = 2; // Match displacement thickness
        
        // Background
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(monitorX, monitorY, componentSize, componentSize, 12);
        else ctx.rect(monitorX, monitorY, componentSize, componentSize);
        ctx.fill();
        ctx.stroke();
        
        // Header
        ctx.fillStyle = hudTextLabel;
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText("LIVE MONITOR", monitorX + componentSize/2, monitorY + 12);
        
        // Content
        const contentStartY = monitorY + 40;
        const lineHeight = 20;

        ctx.textAlign = 'left';
        ctx.font = 'bold 11px Inter';
        const leftPad = monitorX + 15;

        // Speed
        ctx.fillStyle = hudTextVal;
        ctx.fillText(`Speed:`, leftPad, contentStartY);
        ctx.fillStyle = '#38bdf8'; // Sky blue value
        ctx.textAlign = 'right';
        ctx.fillText(`${currentSpeedRef.current.toFixed(1)} m/s`, monitorX + componentSize - 15, contentStartY);

        // Friction
        const isFriction = currentPathIndexRef.current >= fStartIdx && currentPathIndexRef.current < fEndIdx && friction > 0;
        ctx.textAlign = 'left';
        ctx.fillStyle = hudTextVal;
        ctx.fillText(`Friction:`, leftPad, contentStartY + lineHeight);
        ctx.textAlign = 'right';
        ctx.fillStyle = isFriction ? '#f97316' : (isDarkMode ? '#64748b' : '#94a3b8');
        ctx.fillText(isFriction ? `${(friction * 100).toFixed(0)}%` : 'Off', monitorX + componentSize - 15, contentStartY + lineHeight);

        // Air Resist
        ctx.textAlign = 'left';
        ctx.fillStyle = hudTextVal;
        ctx.fillText(`Air Res:`, leftPad, contentStartY + lineHeight * 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = airResistance > 0 ? '#22d3ee' : (isDarkMode ? '#64748b' : '#94a3b8');
        ctx.fillText(`${airResistance} N`, monitorX + componentSize - 15, contentStartY + lineHeight * 2);

        ctx.restore();
    }

    // 4. Friction Zones
    const roadWidth = cellSize * 0.5;
    const fStartIdx = NODES.findIndex(n => n.id === frictionStartNode);
    const fEndIdx = NODES.findIndex(n => n.id === frictionEndNode);
    
    if (fStartIdx !== -1 && fEndIdx !== -1 && fEndIdx > fStartIdx && friction > 0) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const opacity = 0.3 + (friction * 0.1); // Reduced visual opacity for high friction to stay readable
        ctx.strokeStyle = `rgba(249, 115, 22, ${opacity})`; 
        ctx.lineWidth = roadWidth * 1.2; 
        
        ctx.beginPath();
        for (let i = fStartIdx; i <= fEndIdx; i++) {
            const node = NODES[i];
            const px = mapX(node.x);
            const py = mapY(node.y);
            if (i === fStartIdx) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        const midIdx = Math.floor((fStartIdx + fEndIdx) / 2);
        const midNode = NODES[midIdx];
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        // Draw text later to ensure visibility? Or now.
        ctx.fillText(`FRICTION ZONE (µ=${friction})`, mapX(midNode.x), mapY(midNode.y) - roadWidth);
    }

    // 5. Roads
    ctx.strokeStyle = roadStroke; 
    ctx.lineWidth = roadWidth;
    ctx.beginPath();
    NODES.forEach((node, index) => {
        const px = mapX(node.x);
        const py = mapY(node.y);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.strokeStyle = roadCenterStroke; 
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    NODES.forEach((node, index) => {
        const px = mapX(node.x);
        const py = mapY(node.y);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Active Path
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = roadWidth * 0.6;
    ctx.beginPath();
    activePath.forEach((node, index) => {
        const px = mapX(node.x);
        const py = mapY(node.y);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // 7. Displacement Vector
    const targetNode = NODES.find(n => n.id === finishNodeId);
    if (targetNode) {
        const sx = mapX(startNode.x);
        const sy = mapY(startNode.y);
        const tx = mapX(targetNode.x);
        const ty = mapY(targetNode.y);

        ctx.save();
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]); 
        
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        
        const angleDisp = Math.atan2(ty - sy, tx - sx);
        ctx.translate(tx, ty);
        ctx.rotate(angleDisp);
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-10, 5);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.restore();
    }

    // 8. Buildings and Labels
    const getPlacement = (id: string) => {
        const unit = cellSize * 1.5;
        const Up = { x: 0, y: -unit };
        const Down = { x: 0, y: unit };
        const TL = { x: -unit * 0.7, y: -unit * 0.7 };
        const TR = { x: unit * 0.7, y: -unit * 0.7 };
        const BL = { x: -unit * 0.7, y: unit * 0.7 };
        const BR = { x: unit * 0.7, y: unit * 0.7 };
        switch(id) {
            case 'A': return { bldg: Up };
            case 'B': return { bldg: {x:0,y:0} };
            case 'C': return { bldg: BR }; 
            case 'D': return { bldg: Up };
            case 'E': return { bldg: {x:0,y:0} }; 
            case 'F': return { bldg: BL };
            case 'G': return { bldg: Up };
            case 'H': return { bldg: {x:0,y:0} }; 
            case 'I': return { bldg: BR };
            case 'J': return { bldg: Down };
            default: return { bldg: Up };
        }
    };

    NODES.forEach(node => {
        const cx = mapX(node.x);
        const cy = mapY(node.y);
        const { bldg } = getPlacement(node.id);
        
        // Draw Buildings
        if (node.type !== BuildingType.CORNER) {
            if (showBuildings) {
                const bx = cx + bldg.x;
                const by = cy + bldg.y;
                const boxSize = cellSize * 2.4; 
                const boxHalf = boxSize / 2;

                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9'; 
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(bx - boxHalf, by - boxHalf, boxSize, boxSize, 8);
                else ctx.rect(bx - boxHalf, by - boxHalf, boxSize, boxSize);
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = isDarkMode ? '#475569' : '#cbd5e1';
                ctx.stroke();
                ctx.restore();

                const img = imagesRef.current[node.type];
                if (img) {
                    const padding = boxSize * 0.15;
                    const imgDim = boxSize - (padding * 2);
                    ctx.drawImage(img, bx - boxHalf + padding, by - boxHalf + padding, imgDim, imgDim);
                }
            }
        } 
        
        // Draw Labels (Corners only)
        if (node.type === BuildingType.CORNER) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 5;
            
            // Circle Background
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24'; 
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Text
            ctx.fillStyle = '#0f172a'; 
            ctx.font = 'bold 16px Inter, sans-serif'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, cx, cy + 1);
            
            ctx.restore();
        }
    });

    // 9. SUPER REALISTIC VEHICLE
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(vehicleAngleRef.current);

    const carScale = 1.6; 
    const carL = cellSize * carScale;     
    const carW = cellSize * carScale * 0.55; 

    // Shadows & Tires (same as before)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    const wheelL = carL * 0.22;
    const wheelW = carW * 0.25;
    const wheelInsetX = carL * 0.32; 
    const wheelOffsetY = carW * 0.42;

    ctx.fillStyle = '#171717'; 
    const drawTire = (x: number, y: number) => {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - wheelL/2, y - wheelW/2, wheelL, wheelW, 4);
        else ctx.rect(x - wheelL/2, y - wheelW/2, wheelL, wheelW);
        ctx.fill();
    };

    drawTire(wheelInsetX, -wheelOffsetY);  
    drawTire(wheelInsetX, wheelOffsetY);   
    drawTire(-wheelInsetX, -wheelOffsetY); 
    drawTire(-wheelInsetX, wheelOffsetY);  

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Chassis
    ctx.beginPath();
    ctx.moveTo(carL * 0.48, -carW * 0.3);
    ctx.quadraticCurveTo(carL * 0.52, 0, carL * 0.48, carW * 0.3);
    ctx.lineTo(carL * 0.35, carW * 0.48); 
    ctx.lineTo(-carL * 0.35, carW * 0.48);
    ctx.lineTo(-carL * 0.48, carW * 0.35);
    ctx.quadraticCurveTo(-carL * 0.5, 0, -carL * 0.48, -carW * 0.35);
    ctx.lineTo(-carL * 0.35, -carW * 0.48);
    ctx.lineTo(carL * 0.35, -carW * 0.48);
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(-carL/2, 0, carL/2, 0);
    bodyGrad.addColorStop(0, '#78350f');   
    bodyGrad.addColorStop(0.2, '#d97706'); 
    bodyGrad.addColorStop(0.5, '#fbbf24'); 
    bodyGrad.addColorStop(0.8, '#d97706'); 
    bodyGrad.addColorStop(1, '#78350f');   
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#451a03';
    ctx.stroke();

    // Vents
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(carL * 0.2, -carW * 0.15);
    ctx.lineTo(carL * 0.4, -carW * 0.1);
    ctx.lineTo(carL * 0.4, carW * 0.1);
    ctx.lineTo(carL * 0.2, carW * 0.15);
    ctx.fill();

    // Cabin
    const glassPath = new Path2D();
    const cabFront = carL * 0.15;
    const cabRear = -carL * 0.25;
    const cabSide = carW * 0.35;
    
    glassPath.moveTo(cabFront, -cabSide);
    glassPath.lineTo(cabRear, -carW * 0.25);
    glassPath.quadraticCurveTo(cabRear - carL*0.05, 0, cabRear, carW * 0.25);
    glassPath.lineTo(cabFront, cabSide);
    glassPath.quadraticCurveTo(cabFront + carL*0.1, 0, cabFront, -cabSide);
    
    ctx.fillStyle = '#0f172a'; 
    ctx.fill(glassPath);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fill(glassPath);
    
    const roofFront = carL * 0.05;
    const roofRear = -carL * 0.2;
    const roofSide = carW * 0.28;
    ctx.beginPath();
    ctx.moveTo(roofFront, -roofSide);
    ctx.lineTo(roofRear, -roofSide);
    ctx.quadraticCurveTo(roofRear - carL*0.02, 0, roofRear, roofSide);
    ctx.lineTo(roofFront, roofSide);
    ctx.quadraticCurveTo(roofFront + carL*0.02, 0, roofFront, -roofSide);
    ctx.fillStyle = bodyGrad; 
    ctx.fill();
    ctx.stroke();

    // Spoiler
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(-carL * 0.46, -carW * 0.35, carL * 0.08, carW * 0.7, 2);
    else ctx.rect(-carL * 0.46, -carW * 0.35, carL * 0.08, carW * 0.7);
    ctx.fill();

    // Lights
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)'; 
    ctx.beginPath();
    ctx.moveTo(carL * 0.48, -carW * 0.25);
    ctx.lineTo(carL * 3, -carW * 1.5);
    ctx.lineTo(carL * 3, carW * 1.5);
    ctx.lineTo(carL * 0.48, carW * 0.25);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(carL * 0.48, -carW * 0.25, carL * 0.03, carW * 0.08, 0, 0, Math.PI * 2);
    ctx.ellipse(carL * 0.48, carW * 0.25, carL * 0.03, carW * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(-carL * 0.5, -carW * 0.3, carL * 0.02, carW * 0.2, 1);
        ctx.roundRect(-carL * 0.5, carW * 0.1, carL * 0.02, carW * 0.2, 1);
    } else {
        ctx.rect(-carL * 0.5, -carW * 0.3, carL * 0.02, carW * 0.2);
        ctx.rect(-carL * 0.5, carW * 0.1, carL * 0.02, carW * 0.2);
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

  }, [activePath, gridScale, finishNodeId, showBuildings, friction, frictionStartNode, frictionEndNode, airResistance, isRunning, targetSpeed, isDarkMode]);

  // --- PHYSICS ENGINE ---
  const update = useCallback((deltaTime: number) => {
    if (isFinishedRef.current) return;
    
    // Engine Control directly from props
    const TARGET_SPEED = targetSpeed; 
    const MASS = mass; // Use prop
    const G = 9.8; 
    
    const fStartIdx = NODES.findIndex(n => n.id === frictionStartNode);
    const fEndIdx = NODES.findIndex(n => n.id === frictionEndNode);
    const inFrictionZone = currentPathIndexRef.current >= fStartIdx && currentPathIndexRef.current < fEndIdx;
    
    const mu = inFrictionZone ? friction : 0;
    
    const speedError = TARGET_SPEED - currentSpeedRef.current;
    
    // INCREASED RESPONSIVENESS (x50 instead of x5)
    // This allows the car to reach target speed almost instantly if there is no resistance,
    // ensuring accurate calibration for timing experiments.
    const engineForce = Math.max(0, speedError * 50); 
    
    const frictionForce = mu * MASS * G;
    const airForce = airResistance; 
    
    const totalResistive = frictionForce + airForce;
    const netForce = engineForce - totalResistive;
    const accel = netForce / MASS;
    
    currentSpeedRef.current += accel * deltaTime;
    if (currentSpeedRef.current < 0) currentSpeedRef.current = 0; 
    
    const path = activePath;
    const currentIdx = currentPathIndexRef.current;
    
    if (currentIdx >= path.length - 1) {
        if (!isFinishedRef.current) {
            isFinishedRef.current = true;
            
            const startNode = NODES[0];
            const endNode = path[path.length - 1];
            const dx = Math.abs(endNode.x - startNode.x) * gridScale;
            const dy = Math.abs(endNode.y - startNode.y) * gridScale;
            const displacement = Math.sqrt(dx*dx + dy*dy);
            
            const totalTime = (performance.now() - startTimeRef.current) / 1000;
            
            // Build Breakdown
            const pathSegments: string[] = [];
            let cumulativeDist = 0;
            for(let i=0; i<path.length-1; i++) {
                const n1 = path[i];
                const n2 = path[i+1];
                const d = Math.sqrt(Math.pow((n2.x-n1.x)*gridScale, 2) + Math.pow((n2.y-n1.y)*gridScale, 2));
                cumulativeDist += d;
                pathSegments.push(`${n1.label}→${n2.label}`);
            }
            const breakdownStr = `${pathSegments.join(' + ')} = ${cumulativeDist.toFixed(0)}m`;

            onFinish({
                timeTaken: totalTime,
                distanceTraveled: distanceTraveledRef.current,
                displacement: displacement,
                finalDestination: endNode.name,
                averageSpeed: distanceTraveledRef.current / totalTime,
                averageVelocity: displacement / totalTime,
                pathBreakdown: breakdownStr,
                segmentData: collectedSegmentsRef.current
            });
        }
        return;
    }

    const targetNode = path[currentIdx + 1];
    const dx = targetNode.x - vehiclePosRef.current.x;
    const dy = targetNode.y - vehiclePosRef.current.y;
    const distToTargetGrid = Math.sqrt(dx*dx + dy*dy);
    
    const moveStepMeters = currentSpeedRef.current * deltaTime;
    const moveStepGrid = moveStepMeters / gridScale;
    
    distanceTraveledRef.current += moveStepMeters;

    if (dx !== 0 || dy !== 0) {
        vehicleAngleRef.current = Math.atan2(dy, dx);
    }

    if (moveStepGrid >= distToTargetGrid) {
        // --- DATA COLLECTION FOR SEGMENT ---
        const now = performance.now();
        // Time taken for this specific segment
        // If it's the first segment, start from startTimeRef if segmentStartTimeRef is not set properly,
        // but we initialized it in reset.
        // Wait, startRef is in ms.
        let startTimeForSeg = segmentStartTimeRef.current;
        if (startTimeForSeg === 0) startTimeForSeg = startTimeRef.current;
        
        const segDuration = Math.max(0.001, (now - startTimeForSeg) / 1000);
        segmentStartTimeRef.current = now;

        const segDX = targetNode.x - path[currentIdx].x;
        const segDY = targetNode.y - path[currentIdx].y;
        
        let dirStr = "Stationary";
        if (segDX > 0) dirStr = "East";
        else if (segDX < 0) dirStr = "West";
        else if (segDY > 0) dirStr = "South";
        else if (segDY < 0) dirStr = "North";

        // Distance in meters
        const segDist = Math.sqrt(segDX*segDX + segDY*segDY) * gridScale;
        const segSpeed = segDist / segDuration;

        collectedSegmentsRef.current.push({
            from: path[currentIdx].label,
            to: targetNode.label,
            distance: segDist,
            time: segDuration,
            speed: segSpeed,
            direction: dirStr,
            velocityLabel: `${segSpeed.toFixed(1)} m/s ${dirStr}`
        });
        // ------------------------------------

        vehiclePosRef.current.x = targetNode.x;
        vehiclePosRef.current.y = targetNode.y;
        currentPathIndexRef.current++;
    } else {
        const ratio = moveStepGrid / distToTargetGrid;
        vehiclePosRef.current.x += dx * ratio;
        vehiclePosRef.current.y += dy * ratio;
    }

  }, [activePath, gridScale, friction, airResistance, frictionStartNode, frictionEndNode, onFinish, targetSpeed, mass]);

  useEffect(() => {
    const render = (time: number) => {
        if (!startTimeRef.current && isRunning) {
             startTimeRef.current = time;
             segmentStartTimeRef.current = time;
        }
        const deltaTime = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const canvas = canvasRef.current;
        if (canvas) {
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;
            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (isRunning) update(Math.min(deltaTime, 0.1));
                draw(ctx, canvas.width, canvas.height);
            }
        }
        animationFrameRef.current = requestAnimationFrame(render);
    };
    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [draw, isRunning, update]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default SimulationCanvas;