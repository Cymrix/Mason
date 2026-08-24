import { ParticleSystemData, ParticleBlendMode, ParticleShape, ParticleCurveMode, ParticleFxStyle, ParticleAnimStyle, ParticleSizeCurve, ParticleEmissiveMode } from '../masonProjectSchema';

export interface ParticleInstance {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  lifetime: number;
  maxLifetime: number;
  startSize: number;
  midSize?: number;
  endSize: number;
  sizeCurve: ParticleSizeCurve;
  alphaCurve?: ParticleCurveMode;
  startColor: string;
  startAlpha: number;
  midColor?: string;
  midAlpha?: number;
  endColor: string;
  endAlpha: number;
  shape: ParticleShape;
  customGlyph?: string;
  customSvgPath?: string;
  glowBlurRadius: number;
  blendMode: ParticleBlendMode;
  drag: number;
  startDrag?: number;
  midDrag?: number;
  endDrag?: number;
  dragCurve?: ParticleCurveMode;
  angularDrag: number;
  gravityScale?: number;
  gravityScaleX?: number;
  gravityX: number;
  gravityY: number;
  windSensitivity?: number;
  windForce: number;
  turbulenceJitter: number;
  collides: boolean;
  restitution: number;
  bounces?: number;
  destroyOnCollision: boolean;
  spawnCollisionSparks: boolean;
  isRestingOnFloor?: boolean;
  fxStyle?: ParticleFxStyle;
  isEmissive?: boolean;
  emissiveMode?: ParticleEmissiveMode;
  emissiveStartColor?: string;
  emissiveStartStrength?: number;
  emissiveMidColor?: string;
  emissiveMidStrength?: number;
  emissiveEndColor?: string;
  emissiveEndStrength?: number;
  emissiveCurve?: ParticleCurveMode;
  startRotationDeg?: number;
  midRotationDeg?: number;
  endRotationDeg?: number;
  rotationCurve?: ParticleCurveMode;
  sizeAnimStyle?: ParticleAnimStyle;
  colorAnimStyle?: ParticleAnimStyle;
  emissiveAnimStyle?: ParticleAnimStyle;
  rotationAnimStyle?: ParticleAnimStyle;
  animateSize?: boolean;
  animateColor?: boolean;
  animateAlpha?: boolean;
  animateEmissive?: boolean;
  animateRotation?: boolean;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getTrackNodesForData(visuals: any, track: string): { time: number; value: any }[] {
  if (visuals?.trackNodes?.[track]) {
    return visuals.trackNodes[track];
  }

  if (track === 'size') {
    const start = visuals?.startSize ?? 8;
    const end = visuals?.endSize ?? 2;
    if (visuals?.midSize !== undefined && visuals.midSize !== start) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midSize }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }

  if (track === 'color') {
    const start = visuals?.startColor ?? '#ffa500';
    const end = visuals?.endColor ?? '#ff0000';
    if (visuals?.midColor) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midColor }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }

  if (track === 'alpha') {
    const start = visuals?.startAlpha ?? 1.0;
    const end = visuals?.endAlpha ?? 0.0;
    if (visuals?.midAlpha !== undefined) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midAlpha }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }

  if (track === 'emissive') {
    const start = visuals?.emissiveStartStrength ?? 35;
    const end = visuals?.emissiveEndStrength ?? 0;
    if (visuals?.emissiveMidStrength !== undefined) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.emissiveMidStrength }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }

  if (track === 'rotation') {
    const start = visuals?.startRotationDeg ?? 0;
    const end = visuals?.endRotationDeg ?? 360;
    if (visuals?.midRotationDeg !== undefined) {
      return [{ time: 0, value: start }, { time: 0.5, value: visuals.midRotationDeg }, { time: 1, value: end }];
    }
    return [{ time: 0, value: start }, { time: 1, value: end }];
  }

  if (track === 'speed') {
    return [{ time: 0, value: 0 }, { time: 1, value: 0 }];
  }

  if (track === 'drag') {
    return [{ time: 0, value: 0.98 }, { time: 1, value: 0.98 }];
  }

  return [{ time: 0, value: 0 }, { time: 1, value: 1 }];
}

export function evaluateTrackValue(
  progress: number,
  track: 'size' | 'color' | 'alpha' | 'emissive' | 'rotation' | 'speed' | 'drag',
  visuals: any
): any {
  let animStyle: ParticleAnimStyle = 'one_shot';
  let repeatCount = 1;
  let curve: ParticleCurveMode = 'linear';

  if (track === 'size') {
    animStyle = visuals.sizeAnimStyle || 'one_shot';
    repeatCount = visuals.trackRepeats?.size ?? visuals.sizeLoops ?? 1;
    curve = visuals.sizeCurve || 'linear';
  } else if (track === 'color') {
    animStyle = visuals.colorAnimStyle || 'one_shot';
    repeatCount = visuals.trackRepeats?.color ?? visuals.colorLoops ?? 1;
    curve = visuals.colorCurve || 'linear';
  } else if (track === 'alpha') {
    animStyle = visuals.alphaAnimStyle || 'one_shot';
    repeatCount = visuals.trackRepeats?.alpha ?? visuals.alphaLoops ?? 1;
    curve = visuals.alphaCurve || 'linear';
  } else if (track === 'emissive') {
    animStyle = visuals.emissiveAnimStyle || 'one_shot';
    repeatCount = visuals.trackRepeats?.emissive ?? visuals.emissiveLoops ?? 1;
    curve = visuals.emissiveCurve || 'linear';
  } else if (track === 'rotation') {
    animStyle = visuals.rotationAnimStyle || 'one_shot';
    repeatCount = visuals.trackRepeats?.rotation ?? visuals.rotationLoops ?? 1;
    curve = visuals.rotationCurve || 'linear';
  }

  let localProgress = progress;

  if (animStyle === 'repeat') {
    const duration = 1 / repeatCount;
    localProgress = (progress % duration) * repeatCount;
  } else if (animStyle === 'oscillate') {
    const duration = 1 / repeatCount;
    const pairProgress = (progress % duration) * repeatCount;
    if (pairProgress < 0.5) {
      localProgress = pairProgress * 2;
    } else {
      localProgress = 2 - pairProgress * 2;
    }
  }

  localProgress = Math.max(0, Math.min(1, localProgress));

  const nodes = getTrackNodesForData(visuals, track);
  const sorted = [...nodes].sort((a, b) => a.time - b.time);

  let nodeA = sorted[0];
  let nodeB = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (localProgress >= sorted[i].time && localProgress <= sorted[i + 1].time) {
      nodeA = sorted[i];
      nodeB = sorted[i + 1];
      break;
    }
  }

  let segmentT = 0;
  const timeDelta = nodeB.time - nodeA.time;
  if (timeDelta > 0.0001) {
    segmentT = (localProgress - nodeA.time) / timeDelta;
  }
  segmentT = Math.max(0, Math.min(1, segmentT));

  let easedT = segmentT;
  switch (curve) {
    case 'balanced':
      easedT = segmentT * segmentT * (3 - 2 * segmentT);
      break;
    case 'bell_arch':
    case 'bell':
      easedT = Math.sin(segmentT * Math.PI);
      break;
    case 'burst_decay':
    case 'quick_in_long_out':
      easedT = 1 - Math.pow(1 - segmentT, 2.2);
      break;
    case 'burst_shrink':
    case 'long_in_quick_out':
      easedT = Math.pow(segmentT, 2.2);
      break;
    case 'constant':
      easedT = 0;
      break;
    case 'linear':
    default:
      easedT = segmentT;
      break;
  }

  if (track === 'color') {
    const rgbA = hexToRgb(nodeA.value as string);
    const rgbB = hexToRgb(nodeB.value as string);
    const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * easedT);
    const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * easedT);
    const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * easedT);
    return rgbToHex(r, g, b);
  } else {
    const valA = Number(nodeA.value);
    const valB = Number(nodeB.value);
    if (curve === 'constant') {
      return valA;
    }
    return valA + (valB - valA) * easedT;
  }
}

export function getAnimProgress(progress: number, animStyle?: ParticleAnimStyle): number {
  if (!animStyle || animStyle === 'one_shot') {
    return progress;
  }
  if (animStyle === 'repeat') {
    return (progress * 3) % 1.0;
  }
  if (animStyle === 'oscillate') {
    const t = progress * 6;
    return 1 - Math.abs((t % 2) - 1);
  }
  return progress;
}

export function evaluateColorAlpha(
  progress: number,
  visuals: any
): { color: string; alpha: number; r: number; g: number; b: number } {
  const colHex = evaluateTrackValue(progress, 'color', visuals);
  const alphaVal = evaluateTrackValue(progress, 'alpha', visuals);
  const rgb = hexToRgb(colHex);
  return { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaVal})`, alpha: alphaVal, r: rgb.r, g: rgb.g, b: rgb.b };
}

export function evaluateSize(
  progress: number,
  visuals: any
): number {
  return Math.max(0.1, evaluateTrackValue(progress, 'size', visuals));
}


export interface ActiveEmitter {
  system: ParticlePhysicsConfig;
  originX: number;
  originY: number;
  accumulator: number;
}

export class ParticleEngine {
  public particles: ParticleInstance[] = [];

  // Used for fluid dynamics self-collision
  private spatialGrid = new Map<string, ParticleInstance[]>();
  private CELL_SIZE = 48;

  constructor() {}

  public spawnParticles(
    count: number,
    data: ParticleSystemData,
    origin: { x: number; y: number }
  ) {
    const { emitter, kinematics, visuals, physics } = data;
    
    const getRandVal = (min: number, max?: number) => {
      if (max === undefined || max <= min) return min;
      return min + Math.random() * (max - min);
    };

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= (emitter.maxParticles || 300)) break;

      let spawnX = origin.x;
      let spawnY = origin.y;
      
      if (emitter.shape === 'box') {
        spawnX += (Math.random() - 0.5) * (emitter.width || 32);
        spawnY += (Math.random() - 0.5) * (emitter.height || 32);
      } else if (emitter.shape === 'circle') {
        const r = Math.sqrt(Math.random()) * (emitter.radius || 20);
        const theta = Math.random() * Math.PI * 2;
        spawnX += Math.cos(theta) * r;
        spawnY += Math.sin(theta) * r;
      } else if (emitter.shape === 'ring') {
        const theta = Math.random() * Math.PI * 2;
        const r = emitter.radius || 25;
        spawnX += Math.cos(theta) * r;
        spawnY += Math.sin(theta) * r;
      } else if (emitter.shape === 'line') {
        spawnX += (Math.random() - 0.5) * (emitter.width || 48);
      }

      const angleDeg = kinematics.angleDeg !== undefined ? kinematics.angleDeg : 270;
      const spreadDeg = kinematics.spreadDeg !== undefined ? kinematics.spreadDeg : 30;
      const baseAngleRad = angleDeg * (Math.PI / 180);
      const spreadRad = ((Math.random() - 0.5) * spreadDeg) * (Math.PI / 180);
      const launchAngle = baseAngleRad + spreadRad;

      const rawMinSpd = kinematics.minSpeed !== undefined ? kinematics.minSpeed : 0.3;
      const rawMaxSpd = kinematics.maxSpeed !== undefined ? kinematics.maxSpeed : 0.85;
      const effMinSpd = (rawMinSpd > 15 ? rawMinSpd / 100 : rawMinSpd) * 100;
      const effMaxSpd = (rawMaxSpd > 15 ? rawMaxSpd / 100 : rawMaxSpd) * 100;
      const speed = effMinSpd + Math.random() * Math.max(0, effMaxSpd - effMinSpd);

      if (emitter.shape === 'cone') {
        const coneRadius = Math.random() * (emitter.radius || 30);
        spawnX += Math.cos(launchAngle) * coneRadius;
        spawnY += Math.sin(launchAngle) * coneRadius;
      }

      const vx = Math.cos(launchAngle) * speed;
      const vy = Math.sin(launchAngle) * speed;
      
      const lifetime = visuals.minLifetime + Math.random() * Math.max(0.1, visuals.maxLifetime - visuals.minLifetime);
      const vRot = kinematics.minAngularVelocity + Math.random() * Math.max(0, kinematics.maxAngularVelocity - kinematics.minAngularVelocity);

      const instStartSize = getRandVal(visuals.startSize, visuals.startSizeMax);
      const instMidSize = visuals.midSize !== undefined ? getRandVal(visuals.midSize, visuals.midSizeMax) : undefined;
      const instEndSize = getRandVal(visuals.endSize, visuals.endSizeMax);
      
      const instStartRot = getRandVal(visuals.startRotationDeg ?? 0, visuals.startRotationDegMax);
      const instMidRot = visuals.midRotationDeg !== undefined ? getRandVal(visuals.midRotationDeg, visuals.midRotationDegMax) : undefined;
      const instEndRot = getRandVal(visuals.endRotationDeg ?? 360, visuals.endRotationDegMax);
      
      const instEmissiveStartStr = getRandVal(visuals.emissiveStartStrength ?? 35, visuals.emissiveStartStrengthMax);
      const instEmissiveMidStr = visuals.emissiveMidStrength !== undefined ? getRandVal(visuals.emissiveMidStrength, visuals.emissiveMidStrengthMax) : undefined;
      const instEmissiveEndStr = getRandVal(visuals.emissiveEndStrength ?? 0, visuals.emissiveEndStrengthMax);

      const instStartDrag = getRandVal(kinematics.startDrag ?? kinematics.drag ?? 0.98, kinematics.startDragMax);
      const instMidDrag = kinematics.midDrag !== undefined ? getRandVal(kinematics.midDrag, kinematics.midDragMax) : undefined;
      const instEndDrag = getRandVal(kinematics.endDrag ?? kinematics.drag ?? 0.98, kinematics.endDragMax);

      this.particles.push({
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        rotation: instStartRot * (Math.PI / 180),
        vRot,
        lifetime: 0,
        maxLifetime: lifetime,
        startSize: instStartSize,
        midSize: instMidSize,
        endSize: instEndSize,
        sizeCurve: visuals.sizeCurve || 'linear',
        alphaCurve: visuals.alphaCurve || 'linear',
        startColor: visuals.startColor || '#ffffff',
        startAlpha: visuals.startAlpha !== undefined ? visuals.startAlpha : 1,
        midColor: visuals.midColor,
        midAlpha: visuals.midAlpha,
        endColor: visuals.endColor || visuals.startColor || '#ffffff',
        endAlpha: visuals.endAlpha !== undefined ? visuals.endAlpha : 0,
        shape: visuals.shape || 'glow_circle',
        customGlyph: visuals.customGlyph,
        customSvgPath: visuals.customSvgPath,
        glowBlurRadius: visuals.glowBlurRadius || 0,
        blendMode: visuals.blendMode || 'source-over',
        drag: instStartDrag,
        startDrag: instStartDrag,
        midDrag: instMidDrag,
        endDrag: instEndDrag,
        dragCurve: kinematics.dragCurve || 'linear',
        angularDrag: kinematics.angularDrag ?? 0.98,
        gravityScale: kinematics.gravityScale !== undefined ? kinematics.gravityScale : (kinematics.gravityY !== undefined ? kinematics.gravityY / 980 : 0),
        gravityScaleX: kinematics.gravityScaleX !== undefined ? kinematics.gravityScaleX : (kinematics.gravityX !== undefined ? kinematics.gravityX / 980 : 0),
        gravityX: kinematics.gravityX ?? 0,
        gravityY: kinematics.gravityY ?? 0,
        windSensitivity: kinematics.windSensitivity !== undefined ? kinematics.windSensitivity : 1.0,
        windForce: kinematics.windForce ?? 0,
        turbulenceJitter: kinematics.turbulenceJitter ?? 0,
        collides: physics.collideWithMapSolids ?? false,
        restitution: physics.collisionRestitution ?? 0.3,
        bounces: 0,
        destroyOnCollision: physics.destroyOnCollision ?? false,
        spawnCollisionSparks: physics.spawnCollisionSparks ?? false,
        fxStyle: visuals.fxStyle || 'default',
        isEmissive: visuals.isEmissive ?? false,
        emissiveMode: visuals.emissiveMode || 'glow_only',
        emissiveStartColor: visuals.emissiveStartColor || visuals.startColor,
        emissiveStartStrength: instEmissiveStartStr,
        emissiveMidColor: visuals.emissiveMidColor,
        emissiveMidStrength: instEmissiveMidStr,
        emissiveEndColor: visuals.emissiveEndColor || visuals.endColor,
        emissiveEndStrength: instEmissiveEndStr,
        emissiveCurve: visuals.emissiveCurve || 'balanced',
        startRotationDeg: instStartRot,
        midRotationDeg: instMidRot,
        endRotationDeg: instEndRot,
        rotationCurve: visuals.rotationCurve || 'linear',
        sizeAnimStyle: visuals.sizeAnimStyle || 'one_shot',
        colorAnimStyle: visuals.colorAnimStyle || 'one_shot',
        emissiveAnimStyle: visuals.emissiveAnimStyle || 'one_shot',
        rotationAnimStyle: visuals.rotationAnimStyle || 'one_shot',
        animateSize: visuals.animateSize !== false,
        animateColor: visuals.animateColor !== false,
        animateAlpha: visuals.animateAlpha !== false,
        animateEmissive: visuals.animateEmissive !== false,
        animateRotation: visuals.animateRotation !== false
      });
    }
  }

  public update(dt: number, physicsConfig: any = {}, floorY: number = 1000) {
    const aliveParticles: ParticleInstance[] = [];
    const newSparks: ParticleInstance[] = [];

    const fluidEnabled = physicsConfig.fluidSelfCollision ?? false;
    const fluidForce = physicsConfig.fluidRepulsionForce ?? 0.5;

    this.spatialGrid.clear();

    if (fluidEnabled) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const cellX = Math.floor(p.x / this.CELL_SIZE);
        const cellY = Math.floor(p.y / this.CELL_SIZE);
        const key = `${cellX},${cellY}`;
        if (!this.spatialGrid.has(key)) {
          this.spatialGrid.set(key, []);
        }
        this.spatialGrid.get(key)!.push(p);
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.lifetime += dt;

      if (p.lifetime >= p.maxLifetime) {
        continue;
      }

      const rawProgress = p.lifetime / p.maxLifetime;
      
      const visuals = {
        startSize: p.startSize, endSize: p.endSize, midSize: p.midSize, sizeCurve: p.sizeCurve,
        startColor: p.startColor, startAlpha: p.startAlpha, midColor: p.midColor, midAlpha: p.midAlpha, endColor: p.endColor, endAlpha: p.endAlpha, alphaCurve: p.alphaCurve,
        emissiveStartStrength: p.emissiveStartStrength, emissiveMidStrength: p.emissiveMidStrength, emissiveEndStrength: p.emissiveEndStrength, emissiveCurve: p.emissiveCurve,
        startRotationDeg: p.startRotationDeg, midRotationDeg: p.midRotationDeg, endRotationDeg: p.endRotationDeg, rotationCurve: p.rotationCurve,
        sizeAnimStyle: p.sizeAnimStyle, colorAnimStyle: p.colorAnimStyle, emissiveAnimStyle: p.emissiveAnimStyle, rotationAnimStyle: p.rotationAnimStyle,
      };

      if (!p.isRestingOnFloor) {
        if (p.turbulenceJitter > 0) {
          p.vx += (Math.random() - 0.5) * p.turbulenceJitter * 2;
          p.vy += (Math.random() - 0.5) * p.turbulenceJitter * 2;
        }

        const dragT = Math.min(1, rawProgress);
        const kinematicsConfig = {
          startDrag: p.startDrag, midDrag: p.midDrag, endDrag: p.endDrag, dragCurve: p.dragCurve, drag: p.startDrag
        };
        p.drag = evaluateTrackValue(dragT, 'drag', {
           ...kinematicsConfig,
           trackNodes: { drag: getTrackNodesForData({ startSize: p.startDrag, endSize: p.endDrag, midSize: p.midDrag }, 'size') } // Hack to reuse track evaluator
        });
        
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.rotation *= p.angularDrag;

        if (fluidEnabled) {
          const cellX = Math.floor(p.x / this.CELL_SIZE);
          const cellY = Math.floor(p.y / this.CELL_SIZE);
          
          let repulseX = 0;
          let repulseY = 0;
          let neighborCount = 0;

          for (let nx = -1; nx <= 1; nx++) {
            for (let ny = -1; ny <= 1; ny++) {
              const key = `${cellX + nx},${cellY + ny}`;
              const cellParticles = this.spatialGrid.get(key);
              
              if (cellParticles) {
                for (let j = 0; j < cellParticles.length; j++) {
                  const neighbor = cellParticles[j];
                  if (neighbor !== p) {
                    const dx = p.x - neighbor.x;
                    const dy = p.y - neighbor.y;
                    const distSq = dx * dx + dy * dy;
                    
                    const pProgress = p.animateSize ? getAnimProgress(rawProgress, p.sizeAnimStyle) : rawProgress;
                    const nProgress = neighbor.animateSize ? getAnimProgress(neighbor.lifetime / neighbor.maxLifetime, neighbor.sizeAnimStyle) : neighbor.lifetime / neighbor.maxLifetime;
                    const pSize = evaluateSize(pProgress, visuals);
                    const nSize = evaluateSize(nProgress, { startSize: neighbor.startSize, endSize: neighbor.endSize, midSize: neighbor.midSize, sizeCurve: neighbor.sizeCurve });
                    
                    const minDist = (pSize + nSize) * 0.5 * 1.5;
                    const minDistSq = minDist * minDist;
                    
                    if (distSq < minDistSq && distSq > 0.01) {
                      const dist = Math.sqrt(distSq);
                      const pushForce = (1 - dist / minDist) * fluidForce * 50; 
                      repulseX += (dx / dist) * pushForce;
                      repulseY += (dy / dist) * pushForce;
                      neighborCount++;
                    }
                  }
                }
              }
            }
          }
          
          if (neighborCount > 0) {
            p.vx += repulseX * dt;
            p.vy += repulseY * dt;
          }
        }

        p.vy += p.gravityY * dt;
        p.vx += p.gravityX * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.animateRotation) {
          p.rotation += p.vRot * dt;
        }

        if (p.collides && p.y >= floorY) {
          p.y = floorY;
          p.vy = -p.vy * p.restitution;
          p.vx *= 0.8;
          
          if (p.bounces === undefined) p.bounces = 0;
          p.bounces++;
          
          if (p.spawnCollisionSparks && Math.abs(p.vy) > 10) {
             const sparkCount = Math.floor(Math.random() * 3) + 1;
             for(let s=0; s<sparkCount; s++) {
                newSparks.push({
                   x: p.x, y: p.y,
                   vx: (Math.random() - 0.5) * 200,
                   vy: -Math.random() * 150,
                   rotation: 0, vRot: (Math.random() - 0.5) * 10,
                   lifetime: 0, maxLifetime: 0.2 + Math.random() * 0.2,
                   startSize: p.startSize * 0.3, endSize: 0, sizeCurve: 'linear',
                   startColor: '#ffffff', startAlpha: 1, endColor: '#ffaa00', endAlpha: 0,
                   shape: 'glow_circle', glowBlurRadius: 5, blendMode: 'screen',
                   drag: 0.95, angularDrag: 0.95, gravityX: 0, gravityY: 980, collides: false, restitution: 0,
                   destroyOnCollision: false, spawnCollisionSparks: false, fxStyle: 'default',
                   animateSize: true, animateColor: true, animateAlpha: true, animateEmissive: false, animateRotation: true, windForce: 0, turbulenceJitter: 0
                });
             }
          }

          if (p.destroyOnCollision) {
            p.lifetime = p.maxLifetime;
            continue;
          }
          
          if (Math.abs(p.vy) < 5) {
            p.vy = 0;
            p.isRestingOnFloor = true;
          }
        }
      }

      aliveParticles.push(p);
    }

    this.particles = [...aliveParticles, ...newSparks];
  }

  public render(ctx: CanvasRenderingContext2D, panOffset: {x: number, y: number}, zoom: number, defaultParticleData: any) {
    // Basic rendering loop
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const rawProgress = p.lifetime / p.maxLifetime;

      const visuals = {
        startSize: p.startSize, endSize: p.endSize, midSize: p.midSize, sizeCurve: p.sizeCurve,
        startColor: p.startColor, startAlpha: p.startAlpha, midColor: p.midColor, midAlpha: p.midAlpha, endColor: p.endColor, endAlpha: p.endAlpha, alphaCurve: p.alphaCurve,
        emissiveStartColor: p.emissiveStartColor, emissiveMidColor: p.emissiveMidColor, emissiveEndColor: p.emissiveEndColor,
        emissiveStartStrength: p.emissiveStartStrength, emissiveMidStrength: p.emissiveMidStrength, emissiveEndStrength: p.emissiveEndStrength, emissiveCurve: p.emissiveCurve,
        startRotationDeg: p.startRotationDeg, midRotationDeg: p.midRotationDeg, endRotationDeg: p.endRotationDeg, rotationCurve: p.rotationCurve,
        sizeAnimStyle: p.sizeAnimStyle, colorAnimStyle: p.colorAnimStyle, emissiveAnimStyle: p.emissiveAnimStyle, rotationAnimStyle: p.rotationAnimStyle,
      };

      const sizeProgress = p.animateSize ? getAnimProgress(rawProgress, p.sizeAnimStyle) : rawProgress;
      const colorProgress = p.animateColor ? getAnimProgress(rawProgress, p.colorAnimStyle) : rawProgress;
      const emissiveProgress = p.animateEmissive ? getAnimProgress(rawProgress, p.emissiveAnimStyle) : rawProgress;
      const rotationProgress = p.animateRotation ? getAnimProgress(rawProgress, p.rotationAnimStyle) : rawProgress;

      const currentSize = evaluateSize(sizeProgress, visuals);
      const { color, alpha } = evaluateColorAlpha(colorProgress, visuals);

      let currentRotation = p.rotation;
      if (p.animateRotation && visuals.startRotationDeg !== undefined) {
         currentRotation += evaluateTrackValue(rotationProgress, 'rotation', visuals) * (Math.PI / 180);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(currentRotation);
      ctx.globalCompositeOperation = p.blendMode as any;

      if (p.isEmissive) {
         const emStr = evaluateTrackValue(emissiveProgress, 'emissive', visuals);
         const emColHex = evaluateTrackValue(colorProgress, 'color', { ...visuals, trackNodes: { color: getTrackNodesForData({ startColor: p.emissiveStartColor || p.startColor, midColor: p.emissiveMidColor, endColor: p.emissiveEndColor || p.endColor }, 'color') } });
         const emRgb = hexToRgb(emColHex);
         
         if (p.emissiveMode === 'glow_only' || p.emissiveMode === 'light_up_area') {
           ctx.shadowColor = `rgba(${emRgb.r}, ${emRgb.g}, ${emRgb.b}, ${alpha})`;
           ctx.shadowBlur = emStr;
           
           if (p.emissiveMode === 'light_up_area') {
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
           } else {
              ctx.fillStyle = color;
           }
         } else {
           ctx.fillStyle = color;
         }
      } else {
         ctx.fillStyle = color;
         if (p.glowBlurRadius > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = p.glowBlurRadius;
         }
      }

      if (p.shape === 'glow_circle') {
        ctx.beginPath();
        ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(-currentSize, -currentSize, currentSize * 2, currentSize * 2);
      } else if (p.shape === 'spark_line') {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = currentSize;
        ctx.beginPath();
        ctx.moveTo(-currentSize * 2, 0);
        ctx.lineTo(currentSize * 2, 0);
        ctx.stroke();
      }
      // Add other shapes if needed, or rely on custom SVG (omitted here for brevity)
      
      ctx.restore();
    }

    ctx.restore();
  }
}
