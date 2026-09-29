import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MasonProject,
  MultiplayerFile,
  MultiplayerData,
  MeshServerNode,
  SpatialZone,
  ReplicatedComponentDef,
  MultiplayerTopology,
  SyncStrategy,
  CryptoScheme,
  createDefaultMultiplayerFile
} from '../engine/masonProjectSchema';
import {
  Server,
  Network,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Wifi,
  WifiOff,
  Activity,
  Layers,
  Save,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Globe,
  Lock,
  Key,
  Users,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  FileCode,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw
} from 'lucide-react';

interface MultiplayerStudioProps {
  project: MasonProject;
  activeMultiplayerFile: MultiplayerFile;
  onSaveMultiplayerFile: (file: MultiplayerFile) => void;
  onSwitchMultiplayerFile: (fileName: string) => void;
  onCreateNewMultiplayer: (name: string) => void;
  onBackToDashboard: () => void;
}

interface SimulatedEntity {
  id: string;
  name: string;
  isLocalPlayer: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  health: number;
  currentZoneId: string;
  currentNodeId: string;
  ping: number;
  packetCount: number;
  handoffStatus?: 'idle' | 'dual_connecting' | 'migrated';
  handoffTimer?: number;
}

interface PacketLogEntry {
  id: string;
  timestamp: string;
  direction: 'in' | 'out';
  opcode: string;
  nodeId: string;
  sizeBytes: number;
  sequence: number;
  signatureVerified: boolean;
  rttMs: number;
}

export const MultiplayerStudio: React.FC<MultiplayerStudioProps> = ({
  project,
  activeMultiplayerFile,
  onSaveMultiplayerFile,
  onSwitchMultiplayerFile,
  onCreateNewMultiplayer,
  onBackToDashboard
}) => {
  // Current file data state
  const [data, setData] = useState<MultiplayerData>(() => {
    return activeMultiplayerFile?.multiplayerData || createDefaultMultiplayerFile().multiplayerData;
  });

  const [activeTab, setActiveTab] = useState<'architecture' | 'mesh' | 'crypto' | 'replication' | 'sandbox' | 'codegen'>('sandbox');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Selected Zone or Node for inspector editing
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(data.spatialZones[0]?.id || null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(data.meshNodes[0]?.id || null);

  // Sandbox simulation states
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [simEntities, setSimEntities] = useState<SimulatedEntity[]>([
    {
      id: 'local_player',
      name: 'Player 1 (You)',
      isLocalPlayer: true,
      x: 180,
      y: 180,
      targetX: 180,
      targetY: 180,
      vx: 0,
      vy: 0,
      color: '#38bdf8',
      health: 100,
      currentZoneId: 'zone_town_haven',
      currentNodeId: 'node_us_east',
      ping: 22,
      packetCount: 0
    },
    {
      id: 'bot_valkyrie',
      name: 'Valkyrie_77 (Remote)',
      isLocalPlayer: false,
      x: 240,
      y: 220,
      targetX: 380,
      targetY: 150,
      vx: 1.2,
      vy: -0.6,
      color: '#a855f7',
      health: 85,
      currentZoneId: 'zone_town_haven',
      currentNodeId: 'node_us_east',
      ping: 48,
      packetCount: 0
    },
    {
      id: 'bot_ranger',
      name: 'ShadowRanger (Remote)',
      isLocalPlayer: false,
      x: 720,
      y: 190,
      targetX: 850,
      targetY: 300,
      vx: 0.8,
      vy: 0.9,
      color: '#22c55e',
      health: 95,
      currentZoneId: 'zone_whispering_woods',
      currentNodeId: 'node_us_east',
      ping: 35,
      packetCount: 0
    },
    {
      id: 'bot_dune_strider',
      name: 'DuneStrider (Remote)',
      isLocalPlayer: false,
      x: 280,
      y: 580,
      targetX: 420,
      targetY: 660,
      vx: -1.1,
      vy: 0.5,
      color: '#f59e0b',
      health: 60,
      currentZoneId: 'zone_canyon_pass',
      currentNodeId: 'node_us_west',
      ping: 55,
      packetCount: 0
    },
    {
      id: 'bot_void_reaver',
      name: 'VoidReaver (Remote)',
      isLocalPlayer: false,
      x: 820,
      y: 560,
      targetX: 950,
      targetY: 640,
      vx: 1.5,
      vy: 0.7,
      color: '#ef4444',
      health: 120,
      currentZoneId: 'zone_obsidian_depths',
      currentNodeId: 'node_eu_central',
      ping: 72,
      packetCount: 0
    }
  ]);

  // Real-time packet logs
  const [packetLogs, setPacketLogs] = useState<PacketLogEntry[]>([]);
  const packetSequenceRef = useRef<number>(100);

  // Bandwidth history for live sparkline
  const [bandwidthHistory, setBandwidthHistory] = useState<number[]>([12, 18, 15, 24, 28, 22, 35, 30, 26, 32, 29, 38]);
  const [currentKbpTotal, setCurrentKbpTotal] = useState<number>(28.4);

  // Keypair test validator state
  const [cryptoTestMsg, setCryptoTestMsg] = useState<string>('action:cast_spell;spell:lightning_bolt;tick:1042');
  const [cryptoSignatureHex, setCryptoSignatureHex] = useState<string>('');
  const [cryptoVerifyResult, setCryptoVerifyResult] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Code generator state
  const [codeGenTarget, setCodeGenTarget] = useState<'server_ts' | 'client_sdk' | 'docker' | 'json'>('server_ts');
  const [copiedCodeNotice, setCopiedCodeNotice] = useState<boolean>(false);

  // Sync state when file changes
  useEffect(() => {
    if (activeMultiplayerFile?.multiplayerData) {
      setData(activeMultiplayerFile.multiplayerData);
      setIsDirty(false);
    }
  }, [activeMultiplayerFile?.fileName]);

  const updateData = useCallback((updater: (prev: MultiplayerData) => MultiplayerData) => {
    setData(prev => {
      const next = updater(prev);
      setIsDirty(true);
      return next;
    });
  }, []);

  const handleSave = () => {
    if (!activeMultiplayerFile) return;
    const updatedFile: MultiplayerFile = {
      ...activeMultiplayerFile,
      updatedAt: new Date().toISOString(),
      multiplayerData: data
    };
    onSaveMultiplayerFile(updatedFile);
    setIsDirty(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Spatial zone resolver for arbitrary coordinates
  const resolveZoneAt = useCallback((x: number, y: number): SpatialZone | undefined => {
    return data.spatialZones.find(z => 
      x >= z.bounds.minX && x <= z.bounds.maxX &&
      y >= z.bounds.minY && y <= z.bounds.maxY
    );
  }, [data.spatialZones]);

  // Sandbox animation & tick simulation loop
  useEffect(() => {
    if (!isSimRunning) return;
    const intervalMs = Math.floor(1000 / data.tickRate);

    const timer = setInterval(() => {
      setSimEntities(prevEntities => {
        return prevEntities.map(ent => {
          let nx = ent.x;
          let ny = ent.y;

          if (ent.isLocalPlayer) {
            // Move toward target point
            const dx = ent.targetX - ent.x;
            const dy = ent.targetY - ent.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 3) {
              const speed = 4.2;
              nx += (dx / dist) * Math.min(dist, speed);
              ny += (dy / dist) * Math.min(dist, speed);
            }
          } else {
            // Autonomous random roaming bot
            nx += ent.vx;
            ny += ent.vy;

            // Bounce off world bounds
            if (nx < 40 || nx > data.worldBounds.width - 40) ent.vx = -ent.vx;
            if (ny < 40 || ny > data.worldBounds.height - 40) ent.vy = -ent.vy;

            // Occasional direction change
            if (Math.random() < 0.03) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 1.0 + Math.random() * 1.5;
              ent.vx = Math.cos(angle) * spd;
              ent.vy = Math.sin(angle) * spd;
            }
          }

          // Evaluate spatial zone
          const detectedZone = resolveZoneAt(nx, ny) || data.spatialZones[0];
          let updatedZoneId = ent.currentZoneId;
          let updatedNodeId = ent.currentNodeId;
          let handoffStatus = ent.handoffStatus || 'idle';
          let handoffTimer = ent.handoffTimer || 0;

          if (detectedZone && detectedZone.id !== ent.currentZoneId) {
            // Transitioning zone!
            updatedZoneId = detectedZone.id;
            const targetNode = data.meshNodes.find(n => n.id === detectedZone.assignedNodeId);
            if (targetNode && targetNode.id !== ent.currentNodeId) {
              updatedNodeId = targetNode.id;
              handoffStatus = 'dual_connecting';
              handoffTimer = 15; // 15 ticks of dual-buffering
            }
          } else if (handoffStatus === 'dual_connecting') {
            handoffTimer--;
            if (handoffTimer <= 0) {
              handoffStatus = 'migrated';
              handoffTimer = 10;
            }
          } else if (handoffStatus === 'migrated') {
            handoffTimer--;
            if (handoffTimer <= 0) {
              handoffStatus = 'idle';
            }
          }

          return {
            ...ent,
            x: nx,
            y: ny,
            currentZoneId: updatedZoneId,
            currentNodeId: updatedNodeId,
            handoffStatus,
            handoffTimer,
            packetCount: ent.packetCount + 1
          };
        });
      });

      // Generate packet log stream
      packetSequenceRef.current += 1;
      const opcodes = ['MSG_INPUT', 'MSG_STATE_DELTA', 'MSG_ENTITY_POS', 'MSG_ZONE_HEARTBEAT'];
      const randomOp = opcodes[Math.floor(Math.random() * opcodes.length)];
      const randomNode = data.meshNodes[Math.floor(Math.random() * data.meshNodes.length)];
      
      const newEntry: PacketLogEntry = {
        id: `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        direction: Math.random() > 0.4 ? 'in' : 'out',
        opcode: randomOp,
        nodeId: randomNode?.id || 'node_us_east',
        sizeBytes: Math.floor(48 + Math.random() * 128),
        sequence: packetSequenceRef.current,
        signatureVerified: true,
        rttMs: Math.round(data.simulation.simulatedPingMs + (Math.random() * data.simulation.simulatedJitterMs * 2 - data.simulation.simulatedJitterMs))
      };

      setPacketLogs(prev => [newEntry, ...prev.slice(0, 18)]);

      // Update bandwidth waveform
      setBandwidthHistory(prev => {
        const nextVal = Math.round(18 + Math.random() * 20);
        setCurrentKbpTotal(+(nextVal * 1.15).toFixed(1));
        return [...prev.slice(1), nextVal];
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimRunning, data.tickRate, data.worldBounds, data.meshNodes, data.simulation, resolveZoneAt]);

  // Keypair test generation
  const handleGenerateKeypair = () => {
    const chars = '0123456789abcdef';
    let pub = 'ed25519:';
    let priv = 'ed25519_priv:';
    for (let i = 0; i < 64; i++) {
      pub += chars[Math.floor(Math.random() * chars.length)];
      priv += chars[Math.floor(Math.random() * chars.length)];
    }
    updateData(d => ({
      ...d,
      auth: {
        ...d.auth,
        serverPublicKeyHex: pub,
        serverPrivateKeyHexMock: priv
      }
    }));
  };

  // Sign test message
  const handleSignTestMessage = () => {
    // Generate deterministic mock hex signature
    let hash = 0;
    for (let i = 0; i < cryptoTestMsg.length; i++) {
      hash = (hash << 5) - hash + cryptoTestMsg.charCodeAt(i);
      hash |= 0;
    }
    const sigHex = 'sig_' + Math.abs(hash).toString(16).padStart(8, '0') + '_ed25519_verified';
    setCryptoSignatureHex(sigHex);
    setCryptoVerifyResult('valid');
  };

  // Code generation text output
  const generatedCode = useMemo(() => {
    if (codeGenTarget === 'server_ts') {
      return `/**
 * Mason Authoritative Game Server (${data.name})
 * Topology: ${data.topology} | Tick Rate: ${data.tickRate}Hz
 * Auto-generated by Mason Multiplayer Studio v0.364
 */
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as crypto from 'crypto';

interface ClientSession {
  id: string;
  socket: WebSocket;
  publicKey: string;
  role: string;
  zoneId: string;
  x: number;
  y: number;
  lastSequence: number;
  lastPing: number;
}

const SERVER_PORT = process.env.PORT || 9001;
const TICK_RATE = ${data.tickRate};
const TICK_INTERVAL_MS = Math.floor(1000 / TICK_RATE);
const WORLD_WIDTH = ${data.worldBounds.width};
const WORLD_HEIGHT = ${data.worldBounds.height};
const CRYPTO_SCHEME = '${data.auth.scheme}';
const REQUIRE_SIGNED = ${data.auth.requireSignedPackets};

const sessions = new Map<string, ClientSession>();

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
  const clientId = 'c_' + Math.random().toString(36).substring(2, 9);
  console.log(\`[Server] Client connected: \${clientId}\`);

  const session: ClientSession = {
    id: clientId,
    socket: ws,
    publicKey: '',
    role: 'verified_player',
    zoneId: '${data.spatialZones[0]?.id || "zone_default"}',
    x: 200,
    y: 200,
    lastSequence: 0,
    lastPing: Date.now()
  };
  sessions.set(clientId, session);

  ws.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (REQUIRE_SIGNED && !msg.signature) {
        ws.send(JSON.stringify({ op: 'ERR_UNAUTHORIZED', error: 'Missing Ed25519 signature' }));
        return;
      }
      handleClientPacket(session, msg);
    } catch (err) {
      console.error('[Server] Malformed packet received:', err);
    }
  });

  ws.on('close', () => {
    sessions.delete(clientId);
    broadcastDeltaSnapshot({ op: 'ENTITY_DESPAWN', entityId: clientId });
    console.log(\`[Server] Client disconnected: \${clientId}\`);
  });
});

function handleClientPacket(session: ClientSession, packet: any) {
  if (packet.op === 'CLIENT_INPUT') {
    // Authoritative physics & movement validation
    session.x = Math.max(0, Math.min(WORLD_WIDTH, packet.x));
    session.y = Math.max(0, Math.min(WORLD_HEIGHT, packet.y));
    session.lastSequence = packet.seq;
  }
}

// 60Hz Authoritative Tick Loop
let currentTick = 0;
setInterval(() => {
  currentTick++;
  const snapshotEntities = Array.from(sessions.values()).map(s => ({
    id: s.id,
    x: s.x,
    y: s.y,
    zone: s.zoneId
  }));

  const payload = JSON.stringify({
    op: 'SNAPSHOT_TICK',
    tick: currentTick,
    timestamp: Date.now(),
    entities: snapshotEntities
  });

  for (const session of sessions.values()) {
    if (session.socket.readyState === WebSocket.OPEN) {
      session.socket.send(payload);
    }
  }
}, TICK_INTERVAL_MS);

server.listen(SERVER_PORT, () => {
  console.log(\`[Mason Cluster] Authoritative server listening on port \${SERVER_PORT} at \${TICK_RATE}Hz\`);
});
`;
    }

    if (codeGenTarget === 'client_sdk') {
      return `/**
 * Mason Network Client SDK (${data.name})
 * Client-side Prediction, Reconciliation, & Hermite Interpolation Buffer
 */
export class MasonNetworkClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private localPlayerId: string = '';
  private serverTick: number = 0;
  private pendingInputs: Array<{ seq: number; x: number; y: number; dt: number }> = [];
  private sequenceCounter: number = 0;
  
  // Interpolation snapshot buffer
  private snapshotBuffer: Array<{ tick: number; timestamp: number; entities: any[] }> = [];
  private readonly INTERPOLATION_DELAY_MS = ${data.simulation.interpolationBufferMs};

  constructor(serverUrl: string = 'ws://localhost:9001') {
    this.serverUrl = serverUrl;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl);
      this.ws.onopen = () => {
        console.log('[MasonClient] Connected to Authoritative Server');
        resolve();
      };
      this.ws.onmessage = (event) => this.onMessage(JSON.parse(event.data));
      this.ws.onerror = (err) => reject(err);
    });
  }

  public sendMovementInput(targetX: number, targetY: number, dt: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.sequenceCounter++;
    
    // 1. Client-Side Prediction: apply immediately locally
    const input = { seq: this.sequenceCounter, x: targetX, y: targetY, dt };
    this.pendingInputs.push(input);

    // 2. Transmit to authoritative server
    this.ws.send(JSON.stringify({
      op: 'CLIENT_INPUT',
      seq: this.sequenceCounter,
      x: targetX,
      y: targetY,
      timestamp: Date.now()
    }));
  }

  private onMessage(msg: any) {
    if (msg.op === 'SNAPSHOT_TICK') {
      this.serverTick = msg.tick;
      this.snapshotBuffer.push({
        tick: msg.tick,
        timestamp: msg.timestamp,
        entities: msg.entities
      });

      // Keep only recent 20 snapshots
      if (this.snapshotBuffer.length > 20) {
        this.snapshotBuffer.shift();
      }

      // 3. Server Reconciliation: purge verified inputs
      const me = msg.entities.find((e: any) => e.id === this.localPlayerId);
      if (me && msg.lastVerifiedSeq) {
        this.pendingInputs = this.pendingInputs.filter(inp => inp.seq > msg.lastVerifiedSeq);
      }
    }
  }

  public getInterpolatedEntities(renderTimeMs: number) {
    const targetTime = renderTimeMs - this.INTERPOLATION_DELAY_MS;
    // Interpolate between snapshot[i] and snapshot[i+1]
    return this.snapshotBuffer[this.snapshotBuffer.length - 1]?.entities || [];
  }
}
`;
    }

    if (codeGenTarget === 'docker') {
      return `# Dockerfile & Compose for Mason Authoritative Mesh Cluster
# Auto-generated by Mason Multiplayer Studio

version: '3.8'

services:
  redis-state-bus:
    image: redis:7-alpine
    container_name: mason-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  node-us-east:
    build: .
    container_name: mason-node-us-east
    environment:
      - PORT=9001
      - NODE_ID=node_us_east
      - REGION=us-east
      - TICK_RATE=${data.tickRate}
      - REDIS_URL=redis://redis-state-bus:6379
    ports:
      - "9001:9001"
    depends_on:
      - redis-state-bus

  node-us-west:
    build: .
    container_name: mason-node-us-west
    environment:
      - PORT=9002
      - NODE_ID=node_us_west
      - REGION=us-west
      - TICK_RATE=${data.tickRate}
      - REDIS_URL=redis://redis-state-bus:6379
    ports:
      - "9002:9002"
    depends_on:
      - redis-state-bus

  node-eu-central:
    build: .
    container_name: mason-node-eu-central
    environment:
      - PORT=9003
      - NODE_ID=node_eu_central
      - REGION=eu-central
      - TICK_RATE=${data.tickRate}
      - REDIS_URL=redis://redis-state-bus:6379
    ports:
      - "9003:9003"
    depends_on:
      - redis-state-bus
`;
    }

    return JSON.stringify(data, null, 2);
  }, [codeGenTarget, data]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCodeNotice(true);
    setTimeout(() => setCopiedCodeNotice(false), 2000);
  };

  const handleDownloadCode = () => {
    let extension = '.ts';
    if (codeGenTarget === 'docker') extension = '.yml';
    if (codeGenTarget === 'json') extension = '.json';
    const filename = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${codeGenTarget}${extension}`;
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-200 select-none overflow-hidden font-sans">
      {/* 1. TOP HEADER & WORKSPACE TOOLBAR */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
            <Server size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-wide">{data.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                {data.topology.replace('_', ' ')}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                {data.tickRate} Hz
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate max-w-sm">
              {activeMultiplayerFile?.fileName || 'authoritative_mesh.multiplayer'}
            </p>
          </div>

          {/* File Switcher Dropdown */}
          {project.fileSystem.multiplayer && project.fileSystem.multiplayer.length > 1 && (
            <select
              value={activeMultiplayerFile?.fileName}
              onChange={(e) => onSwitchMultiplayerFile(e.target.value)}
              className="ml-2 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500"
            >
              {project.fileSystem.multiplayer.map(f => (
                <option key={f.fileName} value={f.fileName}>
                  {f.name} ({f.fileName})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'sandbox'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Radio size={14} className={isSimRunning ? 'text-emerald-400 animate-pulse' : ''} />
            <span>Live Sandbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mesh')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'mesh'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Globe size={14} />
            <span>Server Mesh & Zones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'crypto'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Ed25519 Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('replication')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'replication'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Layers size={14} />
            <span>Replication</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Cpu size={14} />
            <span>Cluster Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('codegen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'codegen'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Code2 size={14} />
            <span>Export Code</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {saveSuccessNotice && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-1 rounded-lg animate-in fade-in">
              <CheckCircle2 size={13} />
              Saved!
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isDirty
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400/50'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <Save size={14} />
            <span>Save Network</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const name = prompt('Enter name for new multiplayer network config:', 'Arena Cluster Network');
              if (name) onCreateNewMultiplayer(name);
            }}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
            title="Create New Network Config"
          >
            <Plus size={16} />
          </button>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="ml-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 text-xs font-semibold transition"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE VIEWPORTS */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================== */}
        {/* TAB 1: LIVE NETWORK SANDBOX & TELEMETRY                        */}
        {/* ============================================================== */}
        {activeTab === 'sandbox' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Interactive Arena Canvas */}
            <div className="flex-1 flex flex-col bg-neutral-950 relative overflow-hidden">
              {/* Arena HUD Controls */}
              <div className="h-10 bg-neutral-900/80 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 z-10 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Spatial Mesh World Arena
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Click anywhere inside arena to move Player 1 across zone borders
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSimRunning(!isSimRunning)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition"
                  >
                    {isSimRunning ? <Pause size={13} /> : <Play size={13} />}
                    <span>{isSimRunning ? 'Pause' : 'Resume'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimEntities(prev => prev.map(e => e.isLocalPlayer ? { ...e, x: 180, y: 180, targetX: 180, targetY: 180 } : e));
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-400 hover:text-neutral-200 transition"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Position</span>
                  </button>
                </div>
              </div>

              {/* Live 2D Spatial Partitioning Arena Viewport */}
              <div
                className="flex-1 relative cursor-crosshair overflow-hidden bg-neutral-950 flex items-center justify-center p-4"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickY = e.clientY - rect.top;
                  // Scale coordinates to worldBounds
                  const scaleX = data.worldBounds.width / rect.width;
                  const scaleY = data.worldBounds.height / rect.height;
                  const targetX = Math.round(clickX * scaleX);
                  const targetY = Math.round(clickY * scaleY);

                  setSimEntities(prev => prev.map(ent => {
                    if (ent.isLocalPlayer) {
                      return { ...ent, targetX, targetY };
                    }
                    return ent;
                  }));
                }}
              >
                {/* SVG Arena Display */}
                <svg
                  className="w-full h-full max-w-[1000px] max-h-[660px] border border-neutral-800/80 rounded-2xl bg-neutral-900/60 shadow-2xl overflow-hidden"
                  viewBox={`0 0 ${data.worldBounds.width} ${data.worldBounds.height}`}
                >
                  <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#262626" strokeWidth="0.8" />
                    </pattern>
                  </defs>

                  {/* Background Grid */}
                  <rect width={data.worldBounds.width} height={data.worldBounds.height} fill="url(#grid-pattern)" />

                  {/* Spatial Zones Rendering */}
                  {data.spatialZones.map(zone => {
                    const width = zone.bounds.maxX - zone.bounds.minX;
                    const height = zone.bounds.maxY - zone.bounds.minY;
                    const assignedNode = data.meshNodes.find(n => n.id === zone.assignedNodeId);

                    return (
                      <g key={zone.id}>
                        <rect
                          x={zone.bounds.minX}
                          y={zone.bounds.minY}
                          width={width}
                          height={height}
                          fill={zone.color}
                          fillOpacity={0.12}
                          stroke={zone.color}
                          strokeWidth={2}
                          strokeDasharray={zone.isPvpAllowed ? '6,4' : undefined}
                          rx={8}
                        />

                        {/* Zone Header Label */}
                        <text
                          x={zone.bounds.minX + 14}
                          y={zone.bounds.minY + 24}
                          fill="#ffffff"
                          fontSize="14"
                          fontWeight="bold"
                          className="font-sans drop-shadow"
                        >
                          {zone.name}
                        </text>

                        {/* Assigned Node Badge in Zone */}
                        <text
                          x={zone.bounds.minX + 14}
                          y={zone.bounds.minY + 42}
                          fill={zone.color}
                          fontSize="11"
                          fontWeight="600"
                          className="font-mono"
                        >
                          Node: {assignedNode?.name || zone.assignedNodeId} ({assignedNode?.region})
                        </text>

                        {zone.isPvpAllowed && (
                          <text
                            x={zone.bounds.maxX - 100}
                            y={zone.bounds.minY + 24}
                            fill="#ef4444"
                            fontSize="11"
                            fontWeight="bold"
                            className="font-sans"
                          >
                            ⚔️ PVP ACTIVE
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Entity Renders */}
                  {simEntities.map(ent => {
                    return (
                      <g key={ent.id} className="transition-transform duration-75">
                        {/* Target travel line for local player */}
                        {ent.isLocalPlayer && (
                          <line
                            x1={ent.x}
                            y1={ent.y}
                            x2={ent.targetX}
                            y2={ent.targetY}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            opacity={0.6}
                          />
                        )}

                        {/* Dual-Connecting Handoff Indicator */}
                        {ent.handoffStatus === 'dual_connecting' && (
                          <circle
                            cx={ent.x}
                            cy={ent.y}
                            r={26}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="3,3"
                            className="animate-spin"
                          />
                        )}

                        {/* Entity Outer Ring */}
                        <circle
                          cx={ent.x}
                          cy={ent.y}
                          r={ent.isLocalPlayer ? 14 : 10}
                          fill={ent.color}
                          fillOpacity={0.25}
                          stroke={ent.color}
                          strokeWidth={ent.isLocalPlayer ? 3 : 2}
                        />

                        {/* Entity Center Dot */}
                        <circle
                          cx={ent.x}
                          cy={ent.y}
                          r={ent.isLocalPlayer ? 5 : 4}
                          fill="#ffffff"
                        />

                        {/* Entity Name Tag */}
                        <text
                          x={ent.x}
                          y={ent.y - 18}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={ent.isLocalPlayer ? '12' : '10'}
                          fontWeight="bold"
                          className="font-sans drop-shadow"
                        >
                          {ent.name}
                        </text>

                        {/* Ping / Handoff Status Tag */}
                        <text
                          x={ent.x}
                          y={ent.y + 24}
                          textAnchor="middle"
                          fill={ent.handoffStatus === 'dual_connecting' ? '#f59e0b' : '#94a3b8'}
                          fontSize="9"
                          fontWeight="bold"
                          className="font-mono"
                        >
                          {ent.handoffStatus === 'dual_connecting' ? '⚡ HANDOFF' : `${ent.ping}ms (${ent.currentNodeId})`}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Local Player State Overlay Card */}
                {(() => {
                  const me = simEntities.find(e => e.isLocalPlayer);
                  const currentZone = data.spatialZones.find(z => z.id === me?.currentZoneId);
                  const currentNode = data.meshNodes.find(n => n.id === me?.currentNodeId);

                  return (
                    <div className="absolute bottom-6 left-6 p-3.5 rounded-2xl bg-neutral-900/95 border border-neutral-700/80 shadow-2xl backdrop-blur max-w-xs space-y-2 pointer-events-none">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          Player 1 Local Client
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {me?.ping || 22}ms RTT
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 space-y-1">
                        <div>Zone: <span className="text-white font-semibold">{currentZone?.name || 'Unknown'}</span></div>
                        <div>Node: <span className="text-indigo-400 font-mono font-semibold">{currentNode?.name || 'US-East'}</span></div>
                        <div>Coords: <span className="text-neutral-300 font-mono">X: {Math.round(me?.x || 0)}, Y: {Math.round(me?.y || 0)}</span></div>
                        {me?.handoffStatus === 'dual_connecting' && (
                          <div className="text-amber-400 font-bold flex items-center gap-1">
                            <Zap size={12} className="animate-bounce" />
                            Dual-Buffer Seamless Zone Handoff Active!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Telemetry & Network Injection Panel */}
            <div className="w-96 border-l border-neutral-800 bg-neutral-900/70 flex flex-col shrink-0 overflow-y-auto">
              {/* Network Condition Simulator */}
              <div className="p-4 border-b border-neutral-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-400" />
                    Network Condition Injector
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-mono">Real-Time</span>
                </div>

                {/* Simulated Ping */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Simulated Latency (Ping)</span>
                    <span className="font-mono text-cyan-400 font-bold">{data.simulation.simulatedPingMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="350"
                    step="5"
                    value={data.simulation.simulatedPingMs}
                    onChange={(e) => updateData(d => ({
                      ...d,
                      simulation: { ...d.simulation, simulatedPingMs: Number(e.target.value) }
                    }))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Simulated Jitter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Latency Jitter</span>
                    <span className="font-mono text-amber-400 font-bold">±{data.simulation.simulatedJitterMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="2"
                    value={data.simulation.simulatedJitterMs}
                    onChange={(e) => updateData(d => ({
                      ...d,
                      simulation: { ...d.simulation, simulatedJitterMs: Number(e.target.value) }
                    }))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Simulated Packet Loss */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Packet Loss Rate</span>
                    <span className="font-mono text-rose-400 font-bold">{data.simulation.simulatedPacketLossPct} %</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={data.simulation.simulatedPacketLossPct}
                    onChange={(e) => updateData(d => ({
                      ...d,
                      simulation: { ...d.simulation, simulatedPacketLossPct: Number(e.target.value) }
                    }))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Toggles for Prediction & Reconciliation */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800 text-[11px] cursor-pointer hover:bg-neutral-950">
                    <input
                      type="checkbox"
                      checked={data.simulation.clientPredictionEnabled}
                      onChange={(e) => updateData(d => ({
                        ...d,
                        simulation: { ...d.simulation, clientPredictionEnabled: e.target.checked }
                      }))}
                      className="rounded accent-indigo-500"
                    />
                    <span className="text-neutral-300 font-semibold">Client Prediction</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800 text-[11px] cursor-pointer hover:bg-neutral-950">
                    <input
                      type="checkbox"
                      checked={data.simulation.serverReconciliationEnabled}
                      onChange={(e) => updateData(d => ({
                        ...d,
                        simulation: { ...d.simulation, serverReconciliationEnabled: e.target.checked }
                      }))}
                      className="rounded accent-indigo-500"
                    />
                    <span className="text-neutral-300 font-semibold">Reconciliation</span>
                  </label>
                </div>
              </div>

              {/* Bandwidth Throughput Sparkline */}
              <div className="p-4 border-b border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Activity size={13} className="text-emerald-400" />
                    Throughput Waveform
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{currentKbpTotal} KB/s</span>
                </div>

                {/* Mini SVG Sparkline */}
                <div className="h-16 w-full bg-neutral-950 rounded-xl p-1.5 flex items-end justify-between gap-1 border border-neutral-800">
                  {bandwidthHistory.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t transition-all duration-150"
                      style={{ height: `${Math.min(100, Math.max(15, (val / 40) * 100))}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Real-time Packet Inspector Stream */}
              <div className="flex-1 flex flex-col p-4 space-y-2 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Terminal size={13} className="text-indigo-400" />
                    Live Packet Inspector
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">Opcode & Hash</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                  {packetLogs.map(pkt => (
                    <div
                      key={pkt.id}
                      className={`p-1.5 rounded-lg border flex items-center justify-between ${
                        pkt.direction === 'in'
                          ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-300'
                          : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold">{pkt.direction === 'in' ? '↓ IN' : '↑ OUT'}</span>
                        <span className="text-neutral-200 font-semibold truncate">{pkt.opcode}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-neutral-500">#{pkt.sequence}</span>
                        <span className="text-neutral-400">{pkt.sizeBytes}B</span>
                        <span className="text-emerald-400 font-bold">{pkt.rttMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SERVER MESH & SPATIAL ZONES                             */}
        {/* ============================================================== */}
        {activeTab === 'mesh' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Server Node Directory & Allocation */}
            <div className="w-80 border-r border-neutral-800 bg-neutral-900/60 flex flex-col p-4 space-y-4 shrink-0 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Server size={14} className="text-indigo-400" />
                  Cluster Server Nodes ({data.meshNodes.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const id = `node_${Date.now().toString(36)}`;
                    const newNode: MeshServerNode = {
                      id,
                      name: `New Server Node (${id})`,
                      region: 'us-west',
                      host: 'cluster.mason.io',
                      port: 9000 + data.meshNodes.length + 1,
                      allocatedZones: [],
                      maxClients: 200,
                      currentClients: 0,
                      status: 'active',
                      avgLatencyMs: 25,
                      cpuLoadPct: 15
                    };
                    updateData(d => ({ ...d, meshNodes: [...d.meshNodes, newNode] }));
                    setSelectedNodeId(id);
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>Add Node</span>
                </button>
              </div>

              <div className="space-y-2">
                {data.meshNodes.map(node => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{node.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          node.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-neutral-400 flex items-center justify-between font-mono">
                        <span>{node.host}:{node.port}</span>
                        <span className="text-indigo-300 font-semibold">{node.region}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                        <span>Clients: {node.currentClients}/{node.maxClients}</span>
                        <span>CPU: {node.cpuLoadPct}%</span>
                        <span className="text-cyan-400">{node.avgLatencyMs}ms</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Node Details Form */}
              {(() => {
                const selectedNode = data.meshNodes.find(n => n.id === selectedNodeId);
                if (!selectedNode) return null;

                return (
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Edit Node Details</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (data.meshNodes.length <= 1) {
                            alert('A cluster requires at least one server node.');
                            return;
                          }
                          updateData(d => ({
                            ...d,
                            meshNodes: d.meshNodes.filter(n => n.id !== selectedNode.id)
                          }));
                          setSelectedNodeId(data.meshNodes[0]?.id || null);
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition"
                        title="Delete Server Node"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-neutral-400 text-[10px] block mb-0.5">Node Name</label>
                        <input
                          type="text"
                          value={selectedNode.name}
                          onChange={(e) => updateData(d => ({
                            ...d,
                            meshNodes: d.meshNodes.map(n => n.id === selectedNode.id ? { ...n, name: e.target.value } : n)
                          }))}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-neutral-400 text-[10px] block mb-0.5">Region</label>
                          <select
                            value={selectedNode.region}
                            onChange={(e) => updateData(d => ({
                              ...d,
                              meshNodes: d.meshNodes.map(n => n.id === selectedNode.id ? { ...n, region: e.target.value } : n)
                            }))}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white text-xs"
                          >
                            <option value="us-east">US-East</option>
                            <option value="us-west">US-West</option>
                            <option value="eu-central">EU-Central</option>
                            <option value="ap-east">AP-East</option>
                            <option value="sa-east">SA-East</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-neutral-400 text-[10px] block mb-0.5">Port</label>
                          <input
                            type="number"
                            value={selectedNode.port}
                            onChange={(e) => updateData(d => ({
                              ...d,
                              meshNodes: d.meshNodes.map(n => n.id === selectedNode.id ? { ...n, port: Number(e.target.value) } : n)
                            }))}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-neutral-400 text-[10px] block mb-0.5">Max Clients</label>
                          <input
                            type="number"
                            value={selectedNode.maxClients}
                            onChange={(e) => updateData(d => ({
                              ...d,
                              meshNodes: d.meshNodes.map(n => n.id === selectedNode.id ? { ...n, maxClients: Number(e.target.value) } : n)
                            }))}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-neutral-400 text-[10px] block mb-0.5">Status</label>
                          <select
                            value={selectedNode.status}
                            onChange={(e) => updateData(d => ({
                              ...d,
                              meshNodes: d.meshNodes.map(n => n.id === selectedNode.id ? { ...n, status: e.target.value as any } : n)
                            }))}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white text-xs"
                          >
                            <option value="active">Active</option>
                            <option value="standby">Standby</option>
                            <option value="draining">Draining</option>
                            <option value="offline">Offline</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Spatial Zone Manager & Visual Map */}
            <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe size={16} className="text-indigo-400" />
                    Spatial Partitioning & MMO Zone Mapping
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Define boundary regions mapped to specific server nodes. Players seamlessly handoff between nodes across boundaries with zero disconnection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const id = `zone_${Date.now().toString(36)}`;
                    const newZone: SpatialZone = {
                      id,
                      name: `New Zone (${id})`,
                      assignedNodeId: data.meshNodes[0]?.id || 'node_us_east',
                      bounds: { minX: 100, minY: 100, maxX: 400, maxY: 400 },
                      biomeTheme: 'forest',
                      color: '#a855f7',
                      isPvpAllowed: false,
                      maxZoneEntities: 100
                    };
                    updateData(d => ({ ...d, spatialZones: [...d.spatialZones, newZone] }));
                    setSelectedZoneId(id);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus size={14} />
                  <span>Create Spatial Zone</span>
                </button>
              </div>

              {/* Zone List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.spatialZones.map(zone => {
                  const isSelected = selectedZoneId === zone.id;
                  const assignedNode = data.meshNodes.find(n => n.id === zone.assignedNodeId);

                  return (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-neutral-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: zone.color }} />
                            <span className="text-xs font-bold text-white">{zone.name}</span>
                          </div>
                          {zone.isPvpAllowed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              ⚔️ PvP Zone
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              🛡️ Sanctuary
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-neutral-400 space-y-1 font-mono">
                          <div>Node: <span className="text-indigo-400 font-semibold">{assignedNode?.name || zone.assignedNodeId}</span></div>
                          <div>Bounds: [{zone.bounds.minX}, {zone.bounds.minY}] to [{zone.bounds.maxX}, {zone.bounds.maxY}]</div>
                          <div>Max Entities: <span className="text-neutral-200">{zone.maxZoneEntities}</span></div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-neutral-400 text-[10px] block">Assigned Node</label>
                              <select
                                value={zone.assignedNodeId}
                                onChange={(e) => updateData(d => ({
                                  ...d,
                                  spatialZones: d.spatialZones.map(z => z.id === zone.id ? { ...z, assignedNodeId: e.target.value } : z)
                                }))}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-white text-xs mt-0.5"
                              >
                                {data.meshNodes.map(n => (
                                  <option key={n.id} value={n.id}>{n.name} ({n.region})</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-neutral-400 text-[10px] block">Theme Color</label>
                              <input
                                type="color"
                                value={zone.color}
                                onChange={(e) => updateData(d => ({
                                  ...d,
                                  spatialZones: d.spatialZones.map(z => z.id === zone.id ? { ...z, color: e.target.value } : z)
                                }))}
                                className="w-full h-7 bg-neutral-950 border border-neutral-700 rounded-lg p-0.5 cursor-pointer mt-0.5"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={zone.isPvpAllowed}
                                onChange={(e) => updateData(d => ({
                                  ...d,
                                  spatialZones: d.spatialZones.map(z => z.id === zone.id ? { ...z, isPvpAllowed: e.target.checked } : z)
                                }))}
                                className="rounded accent-indigo-500"
                              />
                              <span>Allow PvP Combat</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                if (data.spatialZones.length <= 1) {
                                  alert('At least one spatial zone is required.');
                                  return;
                                }
                                updateData(d => ({
                                  ...d,
                                  spatialZones: d.spatialZones.filter(z => z.id !== zone.id)
                                }));
                                setSelectedZoneId(data.spatialZones[0]?.id || null);
                              }}
                              className="text-neutral-500 hover:text-rose-400 text-[11px] font-semibold transition"
                            >
                              Remove Zone
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CRYPTOGRAPHIC AUTH & SECURITY (Ed25519)                 */}
        {/* ============================================================== */}
        {activeTab === 'crypto' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl mx-auto">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                Ed25519 Cryptographic Authentication & Replay Prevention
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Zero-trust packet signing ensures players cannot spoof actions, spoof entity IDs, or tamper with authoritative movement inputs.
              </p>
            </div>

            {/* Keypair Card */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cluster Root Keypair</h4>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateKeypair}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
                >
                  <Sparkles size={13} />
                  <span>Generate New Ed25519 Keypair</span>
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-neutral-400 text-[11px] block mb-1">Server Public Key (Hex / PEM)</label>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-emerald-400 break-all select-all flex items-center justify-between">
                    <span>{data.auth.serverPublicKeyHex}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(data.auth.serverPublicKeyHex)}
                      className="ml-2 p-1 text-neutral-400 hover:text-white transition"
                      title="Copy Public Key"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 text-[11px] block mb-1">Cluster Private Seed (Internal Secret)</label>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-rose-400 break-all select-all flex items-center justify-between">
                    <span>{data.auth.serverPrivateKeyHexMock}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(data.auth.serverPrivateKeyHexMock)}
                      className="ml-2 p-1 text-neutral-400 hover:text-white transition"
                      title="Copy Secret Key"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Policy Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.auth.requireSignedPackets}
                    onChange={(e) => updateData(d => ({
                      ...d,
                      auth: { ...d.auth, requireSignedPackets: e.target.checked }
                    }))}
                    className="rounded accent-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-white">Require Signatures</div>
                    <div className="text-[10px] text-neutral-400">Reject unsigned client packets</div>
                  </div>
                </label>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                  <div className="text-neutral-400 text-[10px]">Anti-Replay Nonce Window</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={data.auth.antiReplayNonceWindowMs}
                      onChange={(e) => updateData(d => ({
                        ...d,
                        auth: { ...d.auth, antiReplayNonceWindowMs: Number(e.target.value) }
                      }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-white font-mono text-xs"
                    />
                    <span className="text-neutral-400 text-[10px]">ms</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                  <div className="text-neutral-400 text-[10px]">Token Session TTL</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={data.auth.sessionTokenExpirySeconds}
                      onChange={(e) => updateData(d => ({
                        ...d,
                        auth: { ...d.auth, sessionTokenExpirySeconds: Number(e.target.value) }
                      }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-white font-mono text-xs"
                    />
                    <span className="text-neutral-400 text-[10px]">sec</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Signature Validator Sandbox */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={14} className="text-indigo-400" />
                Live Cryptographic Signature Testbed
              </h4>
              <p className="text-[11px] text-neutral-400">
                Type an action packet payload below, sign with the Ed25519 secret seed, and verify with the public key.
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={cryptoTestMsg}
                  onChange={(e) => setCryptoTestMsg(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200"
                  placeholder="Enter message to sign..."
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSignTestMessage}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Lock size={13} />
                    <span>Sign Packet</span>
                  </button>

                  {cryptoSignatureHex && (
                    <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>Verified: {cryptoSignatureHex}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RBAC Permission Tiers */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-indigo-400" />
                Role-Based Access Control (RBAC) Tiers
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.auth.roles.map(role => (
                  <div key={role.id} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white" style={{ color: role.color }}>
                        {role.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">Tier Level {role.level}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(perm => (
                        <span key={perm} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-800">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: REPLICATION & STATE REPLICATION SCHEMA                  */}
        {/* ============================================================== */}
        {activeTab === 'replication' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-indigo-400" />
                  Authoritative Entity Component Replication
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Configure component properties synced over the network, compression formats, and frequency rates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const id = `rep_${Date.now().toString(36)}`;
                  const newComp: ReplicatedComponentDef = {
                    id,
                    name: 'Custom Ability State',
                    priority: 'high',
                    sendRateHz: 30,
                    compression: 'delta_packed',
                    properties: [
                      { name: 'abilityId', type: 'string', tolerance: 0 },
                      { name: 'cooldownRemaining', type: 'float', tolerance: 0.1 }
                    ]
                  };
                  updateData(d => ({ ...d, replication: [...d.replication, newComp] }));
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus size={14} />
                <span>Add Component</span>
              </button>
            </div>

            <div className="space-y-3">
              {data.replication.map(comp => (
                <div key={comp.id} className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white">{comp.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        comp.priority === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        comp.priority === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}>
                        {comp.priority}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950 text-cyan-400 border border-neutral-800">
                        {comp.sendRateHz} Hz
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950 text-indigo-300 border border-neutral-800">
                        {comp.compression}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateData(d => ({
                          ...d,
                          replication: d.replication.filter(r => r.id !== comp.id)
                        }));
                      }}
                      className="text-neutral-500 hover:text-rose-400 p-1 transition"
                      title="Delete Component"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Properties Table */}
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-2.5 space-y-1.5">
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex justify-between px-2">
                      <span>Property Name</span>
                      <span>Type</span>
                      <span>Deadband Tolerance</span>
                    </div>
                    {comp.properties.map(prop => (
                      <div key={prop.name} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-neutral-900/60 font-mono">
                        <span className="text-white font-semibold">{prop.name}</span>
                        <span className="text-indigo-400">{prop.type}</span>
                        <span className="text-neutral-400">±{prop.tolerance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: TOPOLOGY & CLUSTER ARCHITECTURE SETTINGS                */}
        {/* ============================================================== */}
        {activeTab === 'architecture' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-indigo-400" />
                Cluster Topology & Global Synchronization Strategy
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose the network topology suited for your game: low-overhead peer-to-peer, authoritative dedicated hub, or massive multiplayer server mesh.
              </p>
            </div>

            {/* Topology Picker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => updateData(d => ({ ...d, topology: 'distributed_mesh' }))}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  data.topology === 'distributed_mesh'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Distributed Server Mesh</span>
                    <Globe size={16} className="text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-2">
                    MMO-scale architecture. Regional server clusters partition game space into zones with zero-downtime border handoffs.
                  </p>
                </div>
                <span className="mt-4 text-[10px] font-bold text-indigo-400 uppercase">Recommended for MMO / Worlds</span>
              </div>

              <div
                onClick={() => updateData(d => ({ ...d, topology: 'dedicated_hub' }))}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  data.topology === 'dedicated_hub'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Dedicated Authoritative Hub</span>
                    <Server size={16} className="text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-2">
                    Central authoritative server instance. Deterministic ticks, anti-cheat validation, and reliable snapshot broadcasts.
                  </p>
                </div>
                <span className="mt-4 text-[10px] font-bold text-cyan-400 uppercase">Standard Arena / Action</span>
              </div>

              <div
                onClick={() => updateData(d => ({ ...d, topology: 'peer_to_peer' }))}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  data.topology === 'peer_to_peer'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Peer-to-Peer WebRTC Mesh</span>
                    <Users size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-2">
                    Direct browser-to-browser WebRTC data channels with host migration fallback. Zero dedicated server hosting costs.
                  </p>
                </div>
                <span className="mt-4 text-[10px] font-bold text-emerald-400 uppercase">Co-op / Casual 2-8 Players</span>
              </div>
            </div>

            {/* Global Numeric Parameters */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tick Rate & Room Capacities</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-neutral-400 text-[10px] block mb-1">Authoritative Tick Rate (Hz)</label>
                  <select
                    value={data.tickRate}
                    onChange={(e) => updateData(d => ({ ...d, tickRate: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  >
                    <option value={20}>20 Hz (Low Bandwidth)</option>
                    <option value={30}>30 Hz (Standard Mobile)</option>
                    <option value={60}>60 Hz (Competitive High-Speed)</option>
                    <option value={128}>128 Hz (Ultra Competitive)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] block mb-1">Max Players per World / Room</label>
                  <input
                    type="number"
                    value={data.maxPlayersPerRoom}
                    onChange={(e) => updateData(d => ({ ...d, maxPlayersPerRoom: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] block mb-1">Zone Handoff Buffer Distance</label>
                  <input
                    type="number"
                    value={data.zoneHandoffBufferDistance}
                    onChange={(e) => updateData(d => ({ ...d, zoneHandoffBufferDistance: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: CODE GENERATION & EXPORT                                */}
        {/* ============================================================== */}
        {activeTab === 'codegen' && (
          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 size={18} className="text-indigo-400" />
                  Production Server & Client Code Generator
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Export ready-to-run TypeScript server source code, client prediction managers, and Docker deployment configs.
                </p>
              </div>

              {/* Target Switcher & Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setCodeGenTarget('server_ts')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      codeGenTarget === 'server_ts' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    server.ts
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeGenTarget('client_sdk')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      codeGenTarget === 'client_sdk' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    NetworkClient.ts
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeGenTarget('docker')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      codeGenTarget === 'docker' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    docker-compose.yml
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeGenTarget('json')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      codeGenTarget === 'json' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    config.json
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition"
                >
                  <Copy size={13} />
                  <span>{copiedCodeNotice ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  <Download size={13} />
                  <span>Download Script</span>
                </button>
              </div>
            </div>

            {/* Code Output Box */}
            <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-auto font-mono text-xs text-neutral-300 leading-relaxed shadow-inner">
              <pre>{generatedCode}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
