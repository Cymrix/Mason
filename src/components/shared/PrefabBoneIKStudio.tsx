import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  MasonProject, 
  PrefabData, 
  PrefabPart, 
  PrefabBone, 
  PrefabIKTarget, 
  PrefabSkeleton, 
  PrefabBoneKeyframe, 
  PrefabBoneAnimationTrack 
} from '../../engine/masonProjectSchema';
import { 
  solveSkeletonIK, 
  computeBoneWorldTransforms, 
  interpolateBoneKeyframes, 
  applySkeletonPoseToParts, 
  generateSkeletonPreset, 
  SkeletonPresetType, 
  normalizeAngleDeg, 
  degToRad, 
  radToDeg,
  BoneWorldTransform 
} from '../../engine/ikSolver';
import { useMasonViewport, ViewportCanvasContainer } from './viewport';
import { 
  Crosshair, 
  RotateCw, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Layers, 
  Sliders, 
  Check, 
  Sparkles, 
  Wand2, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Move, 
  Target, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Share2, 
  FolderPlus,
  GitBranch,
  Flame,
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';

interface PrefabBoneIKStudioProps {
  project: MasonProject;
  char: PrefabData;
  onUpdateCharacter: (updater: (prev: PrefabData) => PrefabData) => void;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const PrefabBoneIKStudio: React.FC<PrefabBoneIKStudioProps> = ({
  project,
  char,
  onUpdateCharacter,
  showToast
}) => {
  // Ensure skeleton structure - default to NO bones unless user explicitly creates or loads them
  const skeleton: PrefabSkeleton = useMemo(() => {
    if (char.skeleton) {
      return char.skeleton;
    }
    return {
      bones: [],
      ikTargets: [],
      animationTracks: [],
      rootX: 0,
      rootY: 0
    };
  }, [char.skeleton]);

  const bones = skeleton.bones || [];
  const ikTargets = skeleton.ikTargets || [];
  const animationTracks = skeleton.animationTracks || [];
  const parts = char.parts || [];

  // Active Tool Mode: 'ik' (Pose via IK target handles) | 'fk' (Direct bone rotation) | 'add_bone' (Extrude bones)
  const [toolMode, setToolMode] = useState<'ik' | 'fk' | 'add_bone'>('ik');

  // Selected items
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(bones[0]?.id || null);
  const [selectedIKId, setSelectedIKId] = useState<string | null>(ikTargets[0]?.id || null);

  // Active Animation Track & Timeline Scrubber
  const activeTrack = useMemo<PrefabBoneAnimationTrack>(() => {
    const found = animationTracks.find(t => t.id === skeleton.activeTrackId);
    return found || animationTracks[0] || {
      id: 'track_default',
      name: 'Default Pose Track',
      durationFrames: 6,
      frameRateFps: 8,
      loop: true,
      keyframes: [
        {
          frameIndex: 0,
          boneRotations: {},
          ikPositions: {}
        }
      ]
    };
  }, [animationTracks, skeleton.activeTrackId]);

  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Standard Mason Viewport Sub-Module Hook
  const viewport = useMasonViewport({
    initialScale: 2.4,
    minScale: 0.25,
    maxScale: 8.0,
    zoomSensitivity: 1.15,
    originMode: 'center'
  });

  // Viewport Layer Toggles
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showBones, setShowBones] = useState<boolean>(true);
  const [showIKTargets, setShowIKTargets] = useState<boolean>(true);
  const [showParts, setShowParts] = useState<boolean>(true);
  const [showSpriteBase, setShowSpriteBase] = useState<boolean>(true);
  const [partsOpacity, setPartsOpacity] = useState<number>(0.85);

  // Live Live IK & FK Pose Overrides in Viewport
  const [ikOverrides, setIKOverrides] = useState<Record<string, { targetX: number; targetY: number; flipBend?: boolean }>>({});
  const [boneRotationOverrides, setBoneRotationOverrides] = useState<Record<string, number>>({});

  // Active Dragging State in Canvas
  const [draggingTarget, setDraggingTarget] = useState<{
    kind: 'ik_target' | 'bone_tip' | 'bone_joint' | 'root';
    id: string;
    startMouseX: number;
    startMouseY: number;
    initialTargetX?: number;
    initialTargetY?: number;
    initialAngleDeg?: number;
    initialRootX?: number;
    initialRootY?: number;
  } | null>(null);

  // Preset Rig Modal
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);

  // Add IK Chain Modal
  const [isAddIKModalOpen, setIsAddIKModalOpen] = useState<boolean>(false);
  const [newIKName, setNewIKName] = useState<string>('New IK Target');
  const [newIKRootBoneId, setNewIKRootBoneId] = useState<string>(bones[0]?.id || '');
  const [newIKEffectorBoneId, setNewIKEffectorBoneId] = useState<string>(bones[bones.length - 1]?.id || '');

  // Sub-Tab inside Side Panel: 'bones' | 'ik' | 'tracks' | 'bindings'
  const [sidebarTab, setSidebarTab] = useState<'bones' | 'ik' | 'tracks' | 'bindings'>('bones');

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to update skeleton in parent PrefabData
  const updateSkeleton = useCallback((updater: (prev: PrefabSkeleton) => PrefabSkeleton) => {
    onUpdateCharacter(c => {
      const currentSkel = c.skeleton || {
        bones: [],
        ikTargets: [],
        animationTracks: [],
        rootX: 0,
        rootY: 0
      };
      const nextSkel = updater(currentSkel);
      return { ...c, skeleton: nextSkel };
    });
  }, [onUpdateCharacter]);

  // Compute interpolated keyframe pose if timeline has keyframes
  const activeInterpolatedPose = useMemo(() => {
    const kfs = (activeTrack.keyframes || []).slice().sort((a, b) => a.frameIndex - b.frameIndex);
    if (kfs.length === 0) {
      return { boneRotations: boneRotationOverrides, ikPositions: ikOverrides };
    }

    if (kfs.length === 1) {
      return {
        boneRotations: { ...kfs[0].boneRotations, ...boneRotationOverrides },
        ikPositions: { ...kfs[0].ikPositions, ...ikOverrides }
      };
    }

    // Find surrounding keyframes
    let prevKf = kfs[0];
    let nextKf = kfs[kfs.length - 1];

    for (let i = 0; i < kfs.length; i++) {
      if (kfs[i].frameIndex <= currentFrame) {
        prevKf = kfs[i];
      }
      if (kfs[i].frameIndex >= currentFrame) {
        nextKf = kfs[i];
        break;
      }
    }

    if (prevKf.frameIndex === nextKf.frameIndex) {
      return {
        boneRotations: { ...prevKf.boneRotations, ...boneRotationOverrides },
        ikPositions: { ...prevKf.ikPositions, ...ikOverrides }
      };
    }

    const t = (currentFrame - prevKf.frameIndex) / (nextKf.frameIndex - prevKf.frameIndex);
    const interp = interpolateBoneKeyframes(prevKf, nextKf, t, 'ease-in-out');

    return {
      boneRotations: { ...interp.boneRotations, ...boneRotationOverrides },
      ikPositions: { ...interp.ikPositions, ...ikOverrides }
    };
  }, [activeTrack, currentFrame, boneRotationOverrides, ikOverrides]);

  // Solved bone transforms for current frame & viewport
  const solvedState = useMemo(() => {
    return solveSkeletonIK(
      skeleton,
      activeInterpolatedPose.ikPositions,
      activeInterpolatedPose.boneRotations
    );
  }, [skeleton, activeInterpolatedPose]);

  const { boneRotations, transforms: boneTransforms } = solvedState;

  // Animation Playback Timer
  useEffect(() => {
    if (!isPlaying) return;
    const fps = Math.max(1, activeTrack.frameRateFps || 8);
    const intervalMs = 1000 / fps;
    const maxFrames = Math.max(1, activeTrack.durationFrames || 6);

    const timer = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        if (next >= maxFrames) {
          return activeTrack.loop ? 0 : maxFrames - 1;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeTrack]);

  // Capture Current Pose into Keyframe at Current Frame Index
  const handleCaptureKeyframe = () => {
    const currentRotationsSnapshot: Record<string, number> = {};
    bones.forEach(b => {
      currentRotationsSnapshot[b.id] = boneRotations[b.id] !== undefined
        ? Math.round(boneRotations[b.id] * 10) / 10
        : b.localAngleDeg;
    });

    const currentIKSnapshot: Record<string, { x: number; y: number; flipBend?: boolean }> = {};
    ikTargets.forEach(ik => {
      const targetPos = ikOverrides[ik.id] || { targetX: ik.targetX, targetY: ik.targetY, flipBend: ik.flipBend };
      currentIKSnapshot[ik.id] = {
        x: Math.round(targetPos.targetX),
        y: Math.round(targetPos.targetY),
        flipBend: targetPos.flipBend
      };
    });

    updateSkeleton(skel => {
      const tracks = skel.animationTracks || [];
      const updatedTracks = tracks.map(track => {
        if (track.id !== activeTrack.id) return track;
        const existingKfs = (track.keyframes || []).filter(k => k.frameIndex !== currentFrame);
        const newKf: PrefabBoneKeyframe = {
          frameIndex: currentFrame,
          boneRotations: currentRotationsSnapshot,
          ikPositions: currentIKSnapshot
        };
        const newKfs = [...existingKfs, newKf].sort((a, b) => a.frameIndex - b.frameIndex);
        return { ...track, keyframes: newKfs };
      });
      return { ...skel, animationTracks: updatedTracks };
    });

    showToast(`Captured pose keyframe at frame #${currentFrame}`, 'success');
  };

  // Delete Keyframe at Current Frame
  const handleDeleteKeyframe = () => {
    updateSkeleton(skel => {
      const tracks = skel.animationTracks || [];
      const updatedTracks = tracks.map(track => {
        if (track.id !== activeTrack.id) return track;
        const newKfs = (track.keyframes || []).filter(k => k.frameIndex !== currentFrame);
        return { ...track, keyframes: newKfs };
      });
      return { ...skel, animationTracks: updatedTracks };
    });
    showToast(`Removed keyframe at frame #${currentFrame}`, 'info');
  };

  // Apply Pose to Composite Parts
  const handleApplyPoseToParts = () => {
    if (bones.length === 0) {
      showToast('No skeleton bones available to apply pose from', 'info');
      return;
    }
    const updatedParts = applySkeletonPoseToParts(skeleton, boneTransforms, parts);
    onUpdateCharacter(c => ({
      ...c,
      parts: updatedParts
    }));
    showToast(`Applied skeleton pose to ${parts.length} composite parts!`, 'success');
  };

  // Reset Rig Pose
  const handleResetPose = () => {
    setIKOverrides({});
    setBoneRotationOverrides({});
    showToast('Reset skeleton pose to rest angles', 'info');
  };

  // 1-Click Auto-Bind Composite Parts to Bones based on proximity/matching names
  const handleAutoBindParts = () => {
    if (parts.length === 0 || bones.length === 0) {
      showToast('No composite parts or bones available to bind', 'error');
      return;
    }

    const updatedBones = bones.map((bone, idx) => {
      // Find matching part by name similarity or proximity
      const cleanBoneName = bone.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchByName = parts.find(p => {
        const cleanPartName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanPartName.includes(cleanBoneName) || cleanBoneName.includes(cleanPartName);
      });

      const chosenPart = matchByName || parts[idx % parts.length];
      return {
        ...bone,
        attachedPartId: chosenPart?.id || bone.attachedPartId
      };
    });

    updateSkeleton(skel => ({ ...skel, bones: updatedBones }));
    showToast(`Auto-bound ${updatedBones.filter(b => b.attachedPartId).length} parts to bones!`, 'success');
  };

  // Load Preset Skeleton
  const handleLoadPreset = (presetType: SkeletonPresetType) => {
    const preset = generateSkeletonPreset(presetType);
    updateSkeleton(() => preset);
    setSelectedBoneId(preset.bones[0]?.id || null);
    setSelectedIKId(preset.ikTargets[0]?.id || null);
    setIKOverrides({});
    setBoneRotationOverrides({});
    setIsPresetModalOpen(false);
    showToast(`Loaded "${presetType.replace(/_/g, ' ')}" skeleton rig!`, 'success');
  };

  // Clear Skeleton (Remove all bones and IK targets)
  const handleClearSkeleton = () => {
    updateSkeleton(skel => ({
      ...skel,
      bones: [],
      ikTargets: [],
      animationTracks: []
    }));
    setSelectedBoneId(null);
    setSelectedIKId(null);
    setIKOverrides({});
    setBoneRotationOverrides({});
    showToast('Cleared skeleton (no bones configured)', 'info');
  };

  // Add Bone / Extrude Child Bone (or Root Bone if none exist)
  const handleAddChildBone = (parentBoneId?: string | null) => {
    const newId = `bone_${Date.now().toString().slice(-4)}`;
    const parent = bones.find(b => b.id === parentBoneId);
    const newBone: PrefabBone = {
      id: newId,
      name: parent 
        ? `${parent.name} Joint` 
        : (bones.length === 0 ? 'Root Bone' : `Bone ${bones.length + 1}`),
      parentBoneId: parent ? parent.id : null,
      length: parent ? 22 : 28,
      localAngleDeg: parent ? 30 : 0,
      color: '#38bdf8',
      width: 6,
      minAngleDeg: -160,
      maxAngleDeg: 160
    };

    updateSkeleton(skel => ({
      ...skel,
      bones: [...(skel.bones || []), newBone]
    }));
    setSelectedBoneId(newId);
    showToast(`Created ${parent ? 'child bone' : 'root bone'} "${newBone.name}"`, 'success');
  };

  // Delete Bone (Supports removing down to 0 bones)
  const handleDeleteBone = (boneId: string) => {
    updateSkeleton(skel => {
      const remainingBones = (skel.bones || []).filter(b => b.id !== boneId);
      // Clean up parent references
      const cleaned = remainingBones.map(b => b.parentBoneId === boneId ? { ...b, parentBoneId: null } : b);
      // Clean up IK references
      const remainingIK = (skel.ikTargets || []).filter(ik => ik.chainRootBoneId !== boneId && ik.endEffectorBoneId !== boneId);
      return {
        ...skel,
        bones: cleaned,
        ikTargets: remainingIK
      };
    });

    if (selectedBoneId === boneId) {
      setSelectedBoneId(bones.find(b => b.id !== boneId)?.id || null);
    }
    showToast('Deleted bone and updated hierarchy', 'info');
  };

  // Add IK Chain
  const handleCreateIKTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIKRootBoneId || !newIKEffectorBoneId) return;

    const effectorTrans = boneTransforms.get(newIKEffectorBoneId);
    const targetX = effectorTrans ? effectorTrans.endX : 20;
    const targetY = effectorTrans ? effectorTrans.endY : 20;

    const newIK: PrefabIKTarget = {
      id: `ik_${Date.now().toString().slice(-4)}`,
      name: newIKName.trim() || 'IK Target',
      chainRootBoneId: newIKRootBoneId,
      endEffectorBoneId: newIKEffectorBoneId,
      targetX: Math.round(targetX),
      targetY: Math.round(targetY),
      flipBend: false,
      enabled: true,
      color: '#f59e0b'
    };

    updateSkeleton(skel => ({
      ...skel,
      ikTargets: [...(skel.ikTargets || []), newIK]
    }));

    setSelectedIKId(newIK.id);
    setIsAddIKModalOpen(false);
    showToast(`Added IK Chain "${newIK.name}"`, 'success');
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If middle click, right click, or space/alt panning, delegate to viewport container
    if (e.button === 1 || e.button === 2 || e.altKey || viewport.isSpaceDown) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Viewport world coordinates via shared sub-module
    const worldPt = viewport.screenToWorld({ x: clientX, y: clientY }, 'center');
    const worldX = worldPt.x;
    const worldY = worldPt.y;
    const currentScale = viewport.scale;

    // 1. Check IK Target Handles (Highest click priority)
    if (showIKTargets) {
      for (const ik of ikTargets) {
        const ikPos = ikOverrides[ik.id] || { targetX: ik.targetX, targetY: ik.targetY };
        const dist = Math.hypot(worldX - ikPos.targetX, worldY - ikPos.targetY);
        if (dist <= 14 / currentScale + 4) {
          setSelectedIKId(ik.id);
          setDraggingTarget({
            kind: 'ik_target',
            id: ik.id,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            initialTargetX: ikPos.targetX,
            initialTargetY: ikPos.targetY
          });
          return;
        }
      }
    }

    // 2. Check Bone Tip and Joint Handles
    for (const bone of bones) {
      const trans = boneTransforms.get(bone.id);
      if (!trans) continue;

      // Tip handle
      const distTip = Math.hypot(worldX - trans.endX, worldY - trans.endY);
      if (distTip <= 12 / currentScale + 3) {
        setSelectedBoneId(bone.id);
        if (toolMode === 'add_bone') {
          handleAddChildBone(bone.id);
          return;
        }

        setDraggingTarget({
          kind: 'bone_tip',
          id: bone.id,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          initialAngleDeg: boneRotations[bone.id] ?? bone.localAngleDeg
        });
        return;
      }

      // Base joint
      const distStart = Math.hypot(worldX - trans.startX, worldY - trans.startY);
      if (distStart <= 12 / currentScale + 3) {
        setSelectedBoneId(bone.id);
        if (!bone.parentBoneId) {
          // Drag Root
          setDraggingTarget({
            kind: 'root',
            id: bone.id,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            initialRootX: skeleton.rootX || 0,
            initialRootY: skeleton.rootY || 0
          });
        }
        return;
      }
    }
  };

  // Canvas Mouse Move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingTarget || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const worldPt = viewport.screenToWorld({ x: clientX, y: clientY }, 'center');
    const worldX = worldPt.x;
    const worldY = worldPt.y;
    const currentScale = viewport.scale;

    if (draggingTarget.kind === 'ik_target') {
      const ikId = draggingTarget.id;
      const ik = ikTargets.find(t => t.id === ikId);
      const currentFlip = ikOverrides[ikId]?.flipBend ?? ik?.flipBend ?? false;

      setIKOverrides(prev => ({
        ...prev,
        [ikId]: {
          targetX: Math.round(worldX),
          targetY: Math.round(worldY),
          flipBend: currentFlip
        }
      }));
    } else if (draggingTarget.kind === 'bone_tip') {
      const boneId = draggingTarget.id;
      const bone = bones.find(b => b.id === boneId);
      const trans = boneTransforms.get(boneId);
      if (!bone || !trans) return;

      const parentTrans = bone.parentBoneId ? boneTransforms.get(bone.parentBoneId) : undefined;
      const parentAngle = parentTrans ? parentTrans.worldAngleDeg : 0;

      const dx = worldX - trans.startX;
      const dy = worldY - trans.startY;
      const targetWorldAngle = radToDeg(Math.atan2(dy, dx));
      let newLocal = normalizeAngleDeg(targetWorldAngle - parentAngle);

      if (bone.minAngleDeg !== undefined) newLocal = Math.max(bone.minAngleDeg, newLocal);
      if (bone.maxAngleDeg !== undefined) newLocal = Math.min(bone.maxAngleDeg, newLocal);

      setBoneRotationOverrides(prev => ({
        ...prev,
        [boneId]: Math.round(newLocal)
      }));
    } else if (draggingTarget.kind === 'root') {
      const deltaX = (e.clientX - draggingTarget.startMouseX) / currentScale;
      const deltaY = (e.clientY - draggingTarget.startMouseY) / currentScale;
      const newRootX = Math.round((draggingTarget.initialRootX || 0) + deltaX);
      const newRootY = Math.round((draggingTarget.initialRootY || 0) + deltaY);

      updateSkeleton(skel => ({
        ...skel,
        rootX: newRootX,
        rootY: newRootY
      }));
    }
  };

  // Canvas Mouse Up
  const handleCanvasMouseUp = () => {
    setDraggingTarget(null);
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Canvas background
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + viewport.pan.x, height / 2 + viewport.pan.y);
    ctx.scale(viewport.scale, viewport.scale);

    // 1. Grid
    if (showGrid) {
      const gridSize = 16;
      ctx.strokeStyle = '#181824';
      ctx.lineWidth = 0.5;
      const range = 240;
      for (let x = -range; x <= range; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -range);
        ctx.lineTo(x, range);
        ctx.stroke();
      }
      for (let y = -range; y <= range; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-range, y);
        ctx.lineTo(range, y);
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
    }

    // 2. Render Bound Composite Parts behind/in-line
    if (showParts && parts.length > 0) {
      ctx.save();
      ctx.globalAlpha = partsOpacity;
      parts.forEach(part => {
        // Find if bound to any bone
        const boundBone = bones.find(b => b.attachedPartId === part.id);
        let partX = part.offsetX;
        let partY = part.offsetY;
        let partRot = part.rotationDeg || 0;

        if (boundBone) {
          const trans = boneTransforms.get(boundBone.id);
          if (trans) {
            const midX = (trans.startX + trans.endX) / 2;
            const midY = (trans.startY + trans.endY) / 2;
            const off = boundBone.partOffsetPx || { x: 0, y: 0 };
            const rotOff = boundBone.partRotationOffsetDeg || 0;
            partX = midX + off.x;
            partY = midY + off.y;
            partRot = normalizeAngleDeg(trans.worldAngleDeg + rotOff);
          }
        }

        ctx.save();
        ctx.translate(partX, partY);
        ctx.rotate(degToRad(partRot));

        // Draw part bounding box
        ctx.fillStyle = boundBone ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = boundBone ? '#38bdf8' : '#71717a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-14, -14, 28, 28, 4);
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(part.name.slice(0, 10), 0, 3);

        ctx.restore();
      });
      ctx.restore();
    }

    // 3. Render Bones (Classic 2D Rigging Diamond Octahedron)
    if (showBones) {
      bones.forEach(bone => {
        const trans = boneTransforms.get(bone.id);
        if (!trans) return;

        const isSelected = selectedBoneId === bone.id;
        const color = bone.color || '#38bdf8';
        const boneW = bone.width || 7;

        const length = trans.length;
        const angleRad = degToRad(trans.worldAngleDeg);
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const perpCos = -sin;
        const perpSin = cos;

        // Diamond points:
        // Base: startX, startY
        // Left flank: start + forward * (length * 0.22) - perp * (boneW * 0.5)
        // Right flank: start + forward * (length * 0.22) + perp * (boneW * 0.5)
        // Tip: endX, endY
        const flankDist = length * 0.22;
        const halfW = Math.max(3, boneW * 0.5);

        const flankLeftX = trans.startX + cos * flankDist - perpCos * halfW;
        const flankLeftY = trans.startY + sin * flankDist - perpSin * halfW;

        const flankRightX = trans.startX + cos * flankDist + perpCos * halfW;
        const flankRightY = trans.startY + sin * flankDist + perpSin * halfW;

        // Bone Body
        ctx.beginPath();
        ctx.moveTo(trans.startX, trans.startY);
        ctx.lineTo(flankLeftX, flankLeftY);
        ctx.lineTo(trans.endX, trans.endY);
        ctx.lineTo(flankRightX, flankRightY);
        ctx.closePath();

        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 41, 59, 0.75)';
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#38bdf8' : color;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Bone Center Axis Line
        ctx.strokeStyle = isSelected ? '#ffffff' : color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trans.startX, trans.startY);
        ctx.lineTo(trans.endX, trans.endY);
        ctx.stroke();

        // Joint Base Circle
        ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.beginPath();
        ctx.arc(trans.startX, trans.startY, isSelected ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Tip Circle
        ctx.fillStyle = isSelected ? '#38bdf8' : color;
        ctx.beginPath();
        ctx.arc(trans.endX, trans.endY, isSelected ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Bone Label
        ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(bone.name, flankRightX + 4, flankRightY + 2);
      });
    }

    // 4. Render IK Targets and Chain Connectors
    if (showIKTargets) {
      ikTargets.forEach(ik => {
        if (!ik.enabled && !ikOverrides[ik.id]) return;

        const ikPos = ikOverrides[ik.id] || { targetX: ik.targetX, targetY: ik.targetY, flipBend: ik.flipBend };
        const isSelected = selectedIKId === ik.id;
        const color = ik.color || '#f59e0b';

        // Find chain root and end effector
        const rootTrans = boneTransforms.get(ik.chainRootBoneId);
        const effectorTrans = boneTransforms.get(ik.endEffectorBoneId);

        // Dashed Ray from chain root to target
        if (rootTrans) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(rootTrans.startX, rootTrans.startY);
          ctx.lineTo(ikPos.targetX, ikPos.targetY);
          ctx.stroke();
          ctx.restore();
        }

        // Target Crosshair / Ring
        ctx.save();
        ctx.translate(ikPos.targetX, ikPos.targetY);

        // Outer Ring
        ctx.strokeStyle = isSelected ? '#ffffff' : color;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, isSelected ? 9 : 7, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Dot
        ctx.fillStyle = isSelected ? '#f59e0b' : color;
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Crosshairs
        ctx.strokeStyle = isSelected ? '#ffffff' : color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 12);
        ctx.stroke();

        // Label & Bend indicator
        ctx.fillStyle = isSelected ? '#ffffff' : color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${ik.name} ${ikPos.flipBend ? '(Flipped)' : ''}`, 14, 3);

        ctx.restore();
      });
    }

    ctx.restore();
  }, [
    viewport.scale,
    viewport.pan.x,
    viewport.pan.y,
    viewport.viewportSize.width,
    viewport.viewportSize.height,
    showGrid, 
    showBones, 
    showIKTargets, 
    showParts, 
    partsOpacity, 
    bones, 
    ikTargets, 
    parts, 
    selectedBoneId, 
    selectedIKId, 
    boneTransforms, 
    ikOverrides
  ]);

  const selectedBone = useMemo(() => {
    return bones.find(b => b.id === selectedBoneId) || null;
  }, [bones, selectedBoneId]);

  const selectedIK = useMemo(() => {
    return ikTargets.find(t => t.id === selectedIKId) || null;
  }, [ikTargets, selectedIKId]);

  const currentKf = useMemo(() => {
    return (activeTrack.keyframes || []).find(k => k.frameIndex === currentFrame);
  }, [activeTrack, currentFrame]);

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 select-none overflow-hidden">
      
      {/* 1. TOP TOOLBAR CONTROLS */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        
        {/* Left: Mode Buttons & Presets */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setToolMode('ik')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                toolMode === 'ik' ? 'bg-amber-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
              title="Pose limbs and appendages using Inverse Kinematics targets"
            >
              <Target size={14} className={toolMode === 'ik' ? 'text-white' : 'text-amber-400'} />
              <span>IK Posing</span>
            </button>

            <button
              type="button"
              onClick={() => setToolMode('fk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                toolMode === 'fk' ? 'bg-cyan-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
              title="Direct Forward Kinematics bone rotation"
            >
              <RotateCw size={14} className={toolMode === 'fk' ? 'text-white' : 'text-cyan-400'} />
              <span>FK Rotation</span>
            </button>

            <button
              type="button"
              onClick={() => setToolMode('add_bone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                toolMode === 'add_bone' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
              title="Click existing bones to extrude child joints"
            >
              <Plus size={14} className={toolMode === 'add_bone' ? 'text-white' : 'text-emerald-400'} />
              <span>Add Bone</span>
            </button>
          </div>

          {/* Preset Skeletons Button */}
          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-600/40 text-purple-300 hover:text-white hover:bg-purple-900/60 text-xs font-bold transition shadow-sm"
          >
            <Wand2 size={13} />
            <span>Preset Rigs</span>
          </button>
        </div>

        {/* Center / Right: Posing Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleApplyPoseToParts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
            title="Sync posed bone transforms directly to composite parts offsets and rotations"
          >
            <Check size={14} />
            <span>Apply Pose to Parts</span>
          </button>

          <button
            type="button"
            onClick={handleAutoBindParts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition"
            title="Automatically bind closest composite parts to bones"
          >
            <Sparkles size={13} className="text-cyan-400" />
            <span>Auto-Bind Parts</span>
          </button>

          <button
            type="button"
            onClick={handleResetPose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition border border-neutral-800"
            title="Reset active pose to base rest angles"
          >
            <RotateCcw size={13} />
            <span>Reset Pose</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: SIDEBAR + VIEWPORT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT SIDEBAR: Hierarchy, IK Targets, Inspector */}
        <div className="w-full md:w-80 lg:w-96 bg-neutral-900/95 border-r border-neutral-800 flex flex-col shrink-0 overflow-hidden">
          
          {/* Sub-tabs header */}
          <div className="flex items-center bg-neutral-950 border-b border-neutral-800 p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarTab('bones')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                sidebarTab === 'bones' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <GitBranch size={13} className="text-cyan-400" />
              <span>Bones ({bones.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('ik')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                sidebarTab === 'ik' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Target size={13} className="text-amber-400" />
              <span>IK Chains ({ikTargets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('bindings')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                sidebarTab === 'bindings' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers size={13} className="text-emerald-400" />
              <span>Parts</span>
            </button>
          </div>

          {/* Sub-tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {/* TAB 1: BONES HIERARCHY & INSPECTOR */}
            {sidebarTab === 'bones' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Skeleton Hierarchy
                  </span>
                  <div className="flex items-center gap-1.5">
                    {bones.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSkeleton}
                        className="px-2 py-1 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 hover:text-white text-[11px] font-bold transition"
                        title="Remove all bones and reset skeleton"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddChildBone(selectedBoneId)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition"
                    >
                      <Plus size={12} />
                      <span>{bones.length === 0 ? 'Add Root Bone' : (selectedBoneId ? 'Add Child' : 'Add Bone')}</span>
                    </button>
                  </div>
                </div>

                {/* Bone List Tree */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-1.5 space-y-1 max-h-48 overflow-y-auto">
                  {bones.length === 0 ? (
                    <div className="py-6 px-3 text-center space-y-2">
                      <p className="text-xs text-neutral-400">No skeleton bones configured for this prefab.</p>
                      <p className="text-[11px] text-neutral-500">Bones are optional. You can build rigid prefabs without bones or create a skeletal rig below.</p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddChildBone(null)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-900/60 border border-cyan-600/40 text-cyan-200 text-xs font-bold hover:bg-cyan-800/80 transition"
                        >
                          <Plus size={12} />
                          <span>Add Root Bone</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPresetModalOpen(true)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-600/40 text-purple-200 text-xs font-bold hover:bg-purple-800/80 transition"
                        >
                          <Wand2 size={12} />
                          <span>Preset Rigs</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    bones.map(b => {
                      const isSelected = selectedBoneId === b.id;
                      const depth = b.parentBoneId ? 1 : 0;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBoneId(b.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                            isSelected 
                              ? 'bg-cyan-950 border border-cyan-500/50 text-white font-bold' 
                              : 'text-neutral-300 hover:bg-neutral-900'
                          }`}
                          style={{ paddingLeft: `${depth * 14 + 10}px` }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || '#38bdf8' }} />
                            <span className="truncate">{b.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                            {b.length}px • {Math.round(boneRotations[b.id] ?? b.localAngleDeg)}°
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Bone Inspector */}
                {selectedBone && (
                  <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <Sliders size={13} />
                        Bone Parameters
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBone(selectedBone.id)}
                        className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                        title="Delete bone"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold block">Bone Name</label>
                        <input
                          type="text"
                          value={selectedBone.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSkeleton(skel => ({
                              ...skel,
                              bones: skel.bones.map(b => b.id === selectedBone.id ? { ...b, name: val } : b)
                            }));
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Length (px)</label>
                          <input
                            type="number"
                            min={4}
                            max={200}
                            value={selectedBone.length}
                            onChange={(e) => {
                              const val = Math.max(4, Number(e.target.value));
                              updateSkeleton(skel => ({
                                ...skel,
                                bones: skel.bones.map(b => b.id === selectedBone.id ? { ...b, length: val } : b)
                              }));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Local Angle (°)</label>
                          <input
                            type="number"
                            value={Math.round(boneRotations[selectedBone.id] ?? selectedBone.localAngleDeg)}
                            onChange={(e) => {
                              const val = normalizeAngleDeg(Number(e.target.value));
                              setBoneRotationOverrides(prev => ({ ...prev, [selectedBone.id]: val }));
                              updateSkeleton(skel => ({
                                ...skel,
                                bones: skel.bones.map(b => b.id === selectedBone.id ? { ...b, localAngleDeg: val } : b)
                              }));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono mt-1"
                          />
                        </div>
                      </div>

                      {/* Parent Bone Selector */}
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold block">Parent Bone</label>
                        <select
                          value={selectedBone.parentBoneId || ''}
                          onChange={(e) => {
                            const val = e.target.value || null;
                            updateSkeleton(skel => ({
                              ...skel,
                              bones: skel.bones.map(b => b.id === selectedBone.id ? { ...b, parentBoneId: val } : b)
                            }));
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                        >
                          <option value="">(Root Bone / None)</option>
                          {bones.filter(b => b.id !== selectedBone.id).map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Part Binding for Selected Bone */}
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold block">Bound Composite Part</label>
                        <select
                          value={selectedBone.attachedPartId || ''}
                          onChange={(e) => {
                            const val = e.target.value || undefined;
                            updateSkeleton(skel => ({
                              ...skel,
                              bones: skel.bones.map(b => b.id === selectedBone.id ? { ...b, attachedPartId: val } : b)
                            }));
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                        >
                          <option value="">(No Part Attached)</option>
                          {parts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                          ))}
                        </select>
                      </div>

                      {/* Joint Angle Limits */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Min Limit (°)</label>
                          <input
                            type="number"
                            value={selectedBone.minAngleDeg ?? -180}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateSkeleton(skel => ({
                                ...skel,
                                bones: skel.bones.map(b => b.id === selectedBone.id ? { ...b, minAngleDeg: val } : b)
                              }));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold block">Max Limit (°)</label>
                          <input
                            type="number"
                            value={selectedBone.maxAngleDeg ?? 180}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateSkeleton(skel => ({
                                ...skel,
                                bones: skel.bones.map(b => b.id === selectedBone.id ? { ...b, maxAngleDeg: val } : b)
                              }));
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: IK CHAINS & TARGETS */}
            {sidebarTab === 'ik' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    IK Chains & Effectors
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddIKModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition"
                  >
                    <Plus size={12} />
                    <span>New IK Chain</span>
                  </button>
                </div>

                {/* IK Target Cards */}
                <div className="space-y-2">
                  {ikTargets.map(ik => {
                    const isSelected = selectedIKId === ik.id;
                    const ikPos = ikOverrides[ik.id] || { targetX: ik.targetX, targetY: ik.targetY, flipBend: ik.flipBend };
                    return (
                      <div
                        key={ik.id}
                        onClick={() => setSelectedIKId(ik.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-2 ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-500/60 text-white shadow-md'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target size={14} className="text-amber-400" />
                            <span className="font-bold">{ik.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newFlip = !ikPos.flipBend;
                                setIKOverrides(prev => ({
                                  ...prev,
                                  [ik.id]: {
                                    targetX: ikPos.targetX,
                                    targetY: ikPos.targetY,
                                    flipBend: newFlip
                                  }
                                }));
                                updateSkeleton(skel => ({
                                  ...skel,
                                  ikTargets: skel.ikTargets.map(t => t.id === ik.id ? { ...t, flipBend: newFlip } : t)
                                }));
                                showToast(`Toggled bend direction for "${ik.name}"`, 'info');
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                ikPos.flipBend
                                  ? 'bg-amber-600 border-amber-400 text-white'
                                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
                              }`}
                              title="Flip knee / elbow bend direction"
                            >
                              Flip Bend
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSkeleton(skel => ({
                                  ...skel,
                                  ikTargets: skel.ikTargets.filter(t => t.id !== ik.id)
                                }));
                              }}
                              className="text-neutral-500 hover:text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400">
                          <div>Root: {bones.find(b => b.id === ik.chainRootBoneId)?.name || 'Root'}</div>
                          <div>Tip: {bones.find(b => b.id === ik.endEffectorBoneId)?.name || 'Tip'}</div>
                          <div>Target X: {Math.round(ikPos.targetX)}px</div>
                          <div>Target Y: {Math.round(ikPos.targetY)}px</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: BINDINGS & COMPOSITE PARTS */}
            {sidebarTab === 'bindings' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Part Attachments ({parts.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoBindParts}
                    className="text-xs text-cyan-400 hover:underline font-bold"
                  >
                    Auto-Map
                  </button>
                </div>

                <div className="space-y-2">
                  {parts.map(part => {
                    const boundBone = bones.find(b => b.attachedPartId === part.id);
                    return (
                      <div
                        key={part.id}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs gap-2"
                      >
                        <div className="truncate">
                          <div className="font-bold text-neutral-200 truncate">{part.name}</div>
                          <div className="text-[10px] text-neutral-500">{part.type}</div>
                        </div>

                        <select
                          value={boundBone?.id || ''}
                          onChange={(e) => {
                            const newBoneId = e.target.value;
                            updateSkeleton(skel => ({
                              ...skel,
                              bones: skel.bones.map(b => {
                                if (b.attachedPartId === part.id) {
                                  return { ...b, attachedPartId: undefined };
                                }
                                if (b.id === newBoneId) {
                                  return { ...b, attachedPartId: part.id };
                                }
                                return b;
                              })
                            }));
                          }}
                          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                        >
                          <option value="">(Unbound)</option>
                          {bones.map(b => (
                            <option key={b.id} value={b.id}>Attach to {b.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / MAIN CANVAS VIEWPORT */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-neutral-950">
          <ViewportCanvasContainer
            viewport={viewport}
            cursorMode="crosshair"
            showHud={true}
            hudProps={{
              position: 'top-right',
              themeColor: 'amber',
              showGrid: showGrid,
              onToggleGrid: () => setShowGrid(!showGrid),
              onResetZoom: () => viewport.resetView(),
              onFitContent: () => viewport.fitContent(128, 128, 64),
              leadingSlot: (
                <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 p-0.5 rounded-lg shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowBones(b => !b)}
                    className={`px-2 py-1 text-[11px] font-bold rounded transition ${
                      showBones ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/40' : 'text-neutral-500 hover:text-white'
                    }`}
                    title="Toggle Bone Rigging Visuals"
                  >
                    Bones
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIKTargets(t => !t)}
                    className={`px-2 py-1 text-[11px] font-bold rounded transition ${
                      showIKTargets ? 'bg-amber-950/80 text-amber-300 border border-amber-700/40' : 'text-neutral-500 hover:text-white'
                    }`}
                    title="Toggle IK Target Handles"
                  >
                    IK Targets
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowParts(p => !p)}
                    className={`px-2 py-1 text-[11px] font-bold rounded transition ${
                      showParts ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/40' : 'text-neutral-500 hover:text-white'
                    }`}
                    title="Toggle Bound Composite Parts"
                  >
                    Parts
                  </button>
                </div>
              )
            }}
          >
            {/* Interactive Rig Canvas */}
            <canvas
              ref={canvasRef}
              width={viewport.viewportSize.width}
              height={viewport.viewportSize.height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="w-full h-full block cursor-crosshair"
            />

            {/* Instructions banner at bottom-left of canvas */}
            <div className="absolute bottom-3 left-3 pointer-events-none z-10 hidden sm:block">
              <div className="bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur text-[11px] text-neutral-400 flex items-center gap-3">
                <span className="text-amber-400 font-bold">🎯 IK Mode:</span> Drag target rings to pose limbs.
                <span className="text-cyan-400 font-bold">🔄 FK Mode:</span> Drag bone tips to rotate.
                <span className="text-emerald-400 font-bold">➕ Add Bone:</span> Click bone to extrude child.
              </div>
            </div>
          </ViewportCanvasContainer>
        </div>
      </div>

      {/* 3. BOTTOM ANIMATION TIMELINE & KEYFRAME SCRUBBER */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-3 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentFrame(0)}
            className="p-1.5 text-neutral-400 hover:text-white rounded bg-neutral-950 border border-neutral-800"
            title="First Frame"
          >
            <SkipBack size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(p => !p)}
            className={`p-2 rounded-xl text-white font-bold transition shadow ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            type="button"
            onClick={() => setCurrentFrame(f => Math.min((activeTrack.durationFrames || 6) - 1, f + 1))}
            className="p-1.5 text-neutral-400 hover:text-white rounded bg-neutral-950 border border-neutral-800"
            title="Next Frame"
          >
            <SkipForward size={14} />
          </button>

          <div className="text-xs font-mono font-bold text-neutral-300 ml-2">
            Frame <span className="text-cyan-400 font-bold">{currentFrame}</span> / {(activeTrack.durationFrames || 6) - 1}
          </div>
        </div>

        {/* Timeline Frame Scrubber Bar */}
        <div className="flex-1 max-w-xl flex items-center gap-1.5 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
          {Array.from({ length: Math.max(1, activeTrack.durationFrames || 6) }).map((_, fIdx) => {
            const isCur = fIdx === currentFrame;
            const hasKf = (activeTrack.keyframes || []).some(k => k.frameIndex === fIdx);

            return (
              <button
                key={fIdx}
                type="button"
                onClick={() => setCurrentFrame(fIdx)}
                className={`flex-1 h-8 rounded-lg flex flex-col items-center justify-center relative transition ${
                  isCur 
                    ? 'bg-cyan-600 text-white font-bold shadow' 
                    : hasKf 
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300' 
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-500'
                }`}
              >
                <span className="text-[10px] font-mono">{fIdx}</span>
                {hasKf && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Keyframe Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCaptureKeyframe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow"
            title="Capture active skeleton pose into this timeline frame"
          >
            <Check size={14} />
            <span>Capture Frame</span>
          </button>

          {currentKf && (
            <button
              type="button"
              onClick={handleDeleteKeyframe}
              className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition"
              title="Delete keyframe at current frame"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* PRESET RIGS MODAL */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Wand2 size={16} className="text-purple-400" />
                Choose Preset Skeleton Rig
              </h3>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleLoadPreset('two_bone_limb')}
                className="p-3 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500 rounded-xl text-left transition space-y-1"
              >
                <div className="font-bold text-white">🦾 2-Bone Limb Rig</div>
                <div className="text-neutral-400 text-[11px]">Bicep + Forearm / Thigh + Shin with 2-Bone Analytic IK & Flip Bend.</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset('tentacle_tail')}
                className="p-3 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500 rounded-xl text-left transition space-y-1"
              >
                <div className="font-bold text-white">🐙 4-Bone Tentacle / Tail</div>
                <div className="text-neutral-400 text-[11px]">Multi-segment flexible spine with CCD Inverse Kinematics.</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset('dragon_neck_head')}
                className="p-3 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500 rounded-xl text-left transition space-y-1"
              >
                <div className="font-bold text-white">🐉 Dragon Neck & Head</div>
                <div className="text-neutral-400 text-[11px]">Thorax, multi-joint neck, aimable head, and animated jaw.</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset('creature_wing')}
                className="p-3 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500 rounded-xl text-left transition space-y-1"
              >
                <div className="font-bold text-white">🦅 Creature / Bat Wing</div>
                <div className="text-neutral-400 text-[11px]">Shoulder, elbow joint, outer wing tip, and membrane strut.</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset('biped_humanoid')}
                className="p-3 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500 rounded-xl text-left transition space-y-1"
              >
                <div className="font-bold text-white">🧍 Complete Biped Rig</div>
                <div className="text-neutral-400 text-[11px]">Full body humanoid skeleton with 4 IK effectors (hands & feet).</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset('quadruped_beast')}
                className="p-3 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500 rounded-xl text-left transition space-y-1"
              >
                <div className="font-bold text-white">🐕 Quadruped Beast Rig</div>
                <div className="text-neutral-400 text-[11px]">Torso, neck, head, 4 multi-joint legs with paws, and tail.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD IK CHAIN MODAL */}
      {isAddIKModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleCreateIKTarget} className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Target size={16} className="text-amber-400" />
                Create New IK Target Chain
              </h3>
              <button
                type="button"
                onClick={() => setIsAddIKModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block">IK Target Name</label>
                <input
                  type="text"
                  value={newIKName}
                  onChange={(e) => setNewIKName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block">Chain Root Bone (Top Ancestor)</label>
                <select
                  value={newIKRootBoneId}
                  onChange={(e) => setNewIKRootBoneId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                >
                  {bones.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block">End Effector Bone (Tip Goal)</label>
                <select
                  value={newIKEffectorBoneId}
                  onChange={(e) => setNewIKEffectorBoneId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono mt-1"
                >
                  {bones.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddIKModalOpen(false)}
                className="px-3 py-1.5 text-neutral-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Create IK Target
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
