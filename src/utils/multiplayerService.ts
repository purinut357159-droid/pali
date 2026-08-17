import { Peer, type DataConnection } from 'peerjs';
import type {
  RoomMember,
  RoomSettings,
  NetworkPacket,
  NetworkPacketType,
  LobbyChatMessage,
  InGameChatMessage,
} from '../types/multiplayer';
import { syncExternalAccounts, getStoredAccounts } from './authService';

export type MultiplayerEventListener = (payload: any, senderId?: string, packet?: NetworkPacket) => void;

export class MultiplayerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map(); // Host holds connections to clients; Client holds connection to Host
  private broadcastChannel: BroadcastChannel | null = null;
  private processedPacketIds: Set<string> = new Set();
  
  public currentRoomCode: string | null = null;
  public currentMemberId: string = '';
  public isHost: boolean = false;
  public settings: RoomSettings | null = null;
  public members: RoomMember[] = [];

  private listeners: Map<string, Set<MultiplayerEventListener>> = new Map();

  constructor() {
    this.currentMemberId = `m_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }

  public on(event: string, listener: MultiplayerEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private emit(event: string, payload: any, senderId?: string, packet?: NetworkPacket) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((fn) => {
        try {
          fn(payload, senderId, packet);
        } catch (e) {
          console.error(`Error in multiplayer listener for "${event}"`, e);
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Room Creation & Joining
  // -------------------------------------------------------------

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PALI-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createRoom(
    customSettings: Partial<RoomSettings>,
    hostMember: Omit<RoomMember, 'id' | 'isHost'>
  ): Promise<{ success: boolean; roomCode: string; message?: string }> {
    this.leaveRoom();

    const roomCode = customSettings.roomCode || this.generateRoomCode();
    const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

    this.currentRoomCode = cleanCode;
    this.isHost = true;

    const hostFullMember: RoomMember = {
      ...hostMember,
      id: this.currentMemberId,
      isHost: true,
      isReady: true,
      joinedAt: Date.now(),
    };

    this.members = [hostFullMember];
    this.settings = {
      roomCode: cleanCode,
      roomName: customSettings.roomName || `ห้องสำนักเรียนของ ${hostMember.displayName}`,
      mode: customSettings.mode || 'points',
      maxRounds: customSettings.maxRounds || 20,
      maxPlayers: customSettings.maxPlayers || 4,
      isPrivate: customSettings.isPrivate ?? false,
      hostId: this.currentMemberId,
      createdAt: Date.now(),
    };

    this.setupBroadcastChannel(cleanCode);
    this.setupPeerAsHost(cleanCode);

    this.savePublicRoomInfo();
    this.emit('room_state_change', { settings: this.settings, members: this.members });

    return { success: true, roomCode: cleanCode };
  }

  public async joinRoom(
    roomCode: string,
    member: Omit<RoomMember, 'id' | 'isHost'>
  ): Promise<{ success: boolean; message?: string }> {
    this.leaveRoom();

    const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    this.currentRoomCode = cleanCode;
    this.isHost = false;

    const myMember: RoomMember = {
      ...member,
      id: this.currentMemberId,
      isHost: false,
      isReady: false,
      joinedAt: Date.now(),
    };

    this.members = [myMember];
    this.setupBroadcastChannel(cleanCode);
    this.setupPeerAsClient(cleanCode, myMember);

    // Broadcast JOIN request
    this.sendPacket('ROOM_JOIN', { member: myMember });

    return { success: true };
  }

  public leaveRoom(): void {
    if (this.currentRoomCode) {
      this.sendPacket('ROOM_LEAVE', { memberId: this.currentMemberId });
      this.removePublicRoomInfo(this.currentRoomCode);
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    this.currentRoomCode = null;
    this.isHost = false;
    this.settings = null;
    this.members = [];
    this.processedPacketIds.clear();
    this.emit('room_state_change', { settings: null, members: [] });
  }

  // -------------------------------------------------------------
  // Member & Settings Actions
  // -------------------------------------------------------------

  public toggleReady(isReady?: boolean): void {
    const me = this.members.find((m) => m.id === this.currentMemberId);
    if (!me) return;

    const newReady = isReady !== undefined ? isReady : !me.isReady;
    me.isReady = newReady;

    this.sendPacket('MEMBER_READY_TOGGLE', { memberId: this.currentMemberId, isReady: newReady });
    this.emit('room_state_change', { settings: this.settings, members: this.members });

    if (this.isHost) {
      this.broadcastRoomSync();
    }
  }

  public updateMyMember(updates: Partial<RoomMember>): void {
    const me = this.members.find((m) => m.id === this.currentMemberId);
    if (!me) return;

    Object.assign(me, updates);
    this.sendPacket('MEMBER_UPDATE', { memberId: this.currentMemberId, updates });
    this.emit('room_state_change', { settings: this.settings, members: this.members });

    if (this.isHost) {
      this.broadcastRoomSync();
    }
  }

  public updateSettings(updates: Partial<RoomSettings>): void {
    if (!this.isHost || !this.settings) return;

    Object.assign(this.settings, updates);
    this.sendPacket('SETTINGS_UPDATE', { settings: this.settings });
    this.emit('room_state_change', { settings: this.settings, members: this.members });
    this.savePublicRoomInfo();
  }

  public sendLobbyChat(text: string): void {
    const me = this.members.find((m) => m.id === this.currentMemberId);
    const msg: LobbyChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.currentMemberId,
      senderName: me?.displayName || 'ผู้เล่น',
      senderAvatar: me?.avatar || '🧘‍♂️',
      senderColor: me?.color || '#d4af37',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    this.sendPacket('LOBBY_CHAT', { message: msg });
    this.emit('lobby_chat', msg);
  }

  public sendInGameChat(text: string, type: 'chat' | 'emote' | 'action' = 'chat'): void {
    const me = this.members.find((m) => m.id === this.currentMemberId);
    const msg: InGameChatMessage = {
      id: `ingame_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.currentMemberId,
      senderName: me?.displayName || 'ผู้เล่น',
      senderAvatar: me?.avatar || '🧘‍♂️',
      senderColor: me?.color || '#d4af37',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      type,
    };

    this.sendPacket('INGAME_CHAT', { message: msg });
    this.emit('ingame_chat', msg);
  }

  public startGame(initialConfig: any): void {
    if (!this.isHost) return;
    this.sendPacket('GAME_START', { config: initialConfig });
    this.emit('game_start', initialConfig);
  }

  public broadcastGameAction(type: NetworkPacketType, payload: any): void {
    this.sendPacket(type, payload);
  }

  // -------------------------------------------------------------
  // Network Packet Dispatcher & Peer Setup
  // -------------------------------------------------------------

  private setupBroadcastChannel(roomCode: string): void {
    try {
      this.broadcastChannel = new BroadcastChannel(`pali_room_${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const packet: NetworkPacket = event.data;
        this.handleIncomingPacket(packet);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }
  }

  private setupPeerAsHost(roomCode: string): void {
    try {
      const hostPeerId = `pali_host_${roomCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      this.peer = new Peer(hostPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', () => {
        this.emit('connection_status', { status: 'connected', isHost: true });
      });

      this.peer.on('connection', (conn) => {
        this.handleNewClientConnection(conn);
      });

      this.peer.on('error', (err) => {
        // If host ID is already taken, fallback to random peer ID and manage via BroadcastChannel
        console.warn('Peer host warning:', err.type, err.message);
        this.emit('connection_status', { status: 'peer_fallback', error: err });
      });
    } catch (e) {
      console.error('Failed to init host peer', e);
    }
  }

  private setupPeerAsClient(roomCode: string, myMember: RoomMember): void {
    try {
      const clientPeerId = `pali_client_${roomCode.toLowerCase()}_${this.currentMemberId}`;
      this.peer = new Peer(clientPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', () => {
        const hostPeerId = `pali_host_${roomCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const conn = this.peer!.connect(hostPeerId, {
          reliable: true,
          metadata: { member: myMember },
        });

        this.connections.set('host', conn);

        conn.on('open', () => {
          this.emit('connection_status', { status: 'connected', isHost: false });
          conn.send({
            id: `pkt_${Date.now()}_join`,
            type: 'ROOM_JOIN',
            roomCode,
            senderId: this.currentMemberId,
            timestamp: Date.now(),
            payload: { member: myMember },
          });
          conn.send({
            id: `pkt_${Date.now()}_acc_sync_client`,
            type: 'ACCOUNT_REGISTRY_SYNC',
            roomCode,
            senderId: this.currentMemberId,
            timestamp: Date.now(),
            payload: { accounts: getStoredAccounts() },
          });
        });

        conn.on('data', (data: any) => {
          this.handleIncomingPacket(data as NetworkPacket);
        });

        conn.on('close', () => {
          this.emit('connection_status', { status: 'disconnected', reason: 'host_disconnected' });
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Client peer error:', err);
      });
    } catch (e) {
      console.error('Failed to init client peer', e);
    }
  }

  private handleNewClientConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

      // Send initial room state sync to the new client
      const syncPacket: NetworkPacket = {
        id: `pkt_${Date.now()}_sync`,
        type: 'ROOM_STATE_SYNC',
        roomCode: this.currentRoomCode || '',
        senderId: this.currentMemberId,
        timestamp: Date.now(),
        payload: {
          settings: this.settings,
          members: this.members,
        },
      };
      conn.send(syncPacket);

      // Send accounts sync to the new client
      conn.send({
        id: `pkt_${Date.now()}_acc_sync_host`,
        type: 'ACCOUNT_REGISTRY_SYNC',
        roomCode: this.currentRoomCode || '',
        senderId: this.currentMemberId,
        timestamp: Date.now(),
        payload: { accounts: getStoredAccounts() },
      });
    });

    conn.on('data', (data: any) => {
      const packet = data as NetworkPacket;
      this.handleIncomingPacket(packet);

      // If host, relay packet to all other connected clients
      if (this.isHost) {
        this.connections.forEach((c, peerId) => {
          if (peerId !== conn.peer && c.open) {
            c.send(packet);
          }
        });
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  public sendPacket(type: NetworkPacketType, payload: any): void {
    if (!this.currentRoomCode) return;

    const packet: NetworkPacket = {
      id: `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      roomCode: this.currentRoomCode,
      senderId: this.currentMemberId,
      timestamp: Date.now(),
      payload,
    };

    this.processedPacketIds.add(packet.id);

    // 1. Send through BroadcastChannel for same-device multi-tab
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch (e) {
        console.warn('Failed to broadcast packet', e);
      }
    }

    // 2. Send through PeerJS WebRTC connections
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch (e) {
          console.warn('Failed to send packet over WebRTC', e);
        }
      }
    });
  }

  private handleIncomingPacket(packet: NetworkPacket): void {
    if (!packet || packet.roomCode !== this.currentRoomCode) return;
    if (packet.senderId === this.currentMemberId) return;

    // Deduplicate packets arriving via multiple channels
    if (this.processedPacketIds.has(packet.id)) return;
    this.processedPacketIds.add(packet.id);

    // Keep set bounded
    if (this.processedPacketIds.size > 2000) {
      const arr = Array.from(this.processedPacketIds);
      this.processedPacketIds = new Set(arr.slice(arr.length - 1000));
    }

    switch (packet.type) {
      case 'ROOM_JOIN': {
        const newMember: RoomMember = packet.payload.member;
        if (newMember && !this.members.some((m) => m.id === newMember.id)) {
          this.members.push(newMember);
          this.emit('room_state_change', { settings: this.settings, members: this.members });
          this.emit('member_joined', newMember);

          if (this.isHost) {
            this.broadcastRoomSync();
            this.savePublicRoomInfo();
          }
        }
        break;
      }

      case 'ROOM_LEAVE': {
        const { memberId } = packet.payload;
        this.members = this.members.filter((m) => m.id !== memberId);
        this.emit('room_state_change', { settings: this.settings, members: this.members });
        this.emit('member_left', { memberId });

        if (this.isHost) {
          this.broadcastRoomSync();
          this.savePublicRoomInfo();
        }
        break;
      }

      case 'ROOM_STATE_SYNC': {
        if (!this.isHost) {
          this.settings = packet.payload.settings;
          this.members = packet.payload.members;
          this.emit('room_state_change', { settings: this.settings, members: this.members });
        }
        break;
      }

      case 'MEMBER_READY_TOGGLE': {
        const { memberId, isReady } = packet.payload;
        const target = this.members.find((m) => m.id === memberId);
        if (target) {
          target.isReady = isReady;
          this.emit('room_state_change', { settings: this.settings, members: this.members });
        }
        break;
      }

      case 'MEMBER_UPDATE': {
        const { memberId, updates } = packet.payload;
        const target = this.members.find((m) => m.id === memberId);
        if (target) {
          Object.assign(target, updates);
          this.emit('room_state_change', { settings: this.settings, members: this.members });
        }
        break;
      }

      case 'SETTINGS_UPDATE': {
        if (!this.isHost && packet.payload.settings) {
          this.settings = packet.payload.settings;
          this.emit('room_state_change', { settings: this.settings, members: this.members });
        }
        break;
      }

      case 'LOBBY_CHAT': {
        this.emit('lobby_chat', packet.payload.message);
        break;
      }

      case 'INGAME_CHAT': {
        this.emit('ingame_chat', packet.payload.message);
        break;
      }

      case 'GAME_START': {
        this.emit('game_start', packet.payload.config);
        break;
      }

      case 'ACCOUNT_REGISTRY_SYNC': {
        if (Array.isArray(packet.payload?.accounts)) {
          syncExternalAccounts(packet.payload.accounts, false);
        }
        break;
      }

      default: {
        // Any gameplay action (DICE_ROLL, PLAYER_STEP_MOVE, QUIZ_OPEN, QUIZ_ANSWER_RESULT, TILE_BUY_OR_UPGRADE, TURN_CHANGE, etc.)
        this.emit('game_action', packet.payload, packet.senderId, packet);
        this.emit(packet.type.toLowerCase(), packet.payload, packet.senderId, packet);
        break;
      }
    }
  }

  private broadcastRoomSync(): void {
    if (!this.isHost) return;
    this.sendPacket('ROOM_STATE_SYNC', {
      settings: this.settings,
      members: this.members,
    });
  }

  // -------------------------------------------------------------
  // Public Open Rooms Discovery via Shared Registry
  // -------------------------------------------------------------

  public static getPublicRooms(): {
    roomCode: string;
    roomName: string;
    hostName: string;
    playerCount: number;
    maxPlayers: number;
    mode: string;
    maxRounds: number;
    updatedAt: number;
  }[] {
    try {
      const raw = localStorage.getItem('pali_public_rooms_v2');
      if (!raw) return [];
      const rooms: any[] = JSON.parse(raw);
      const now = Date.now();
      // Keep only active rooms updated in last 5 minutes
      return rooms.filter((r) => now - r.updatedAt < 5 * 60 * 1000);
    } catch {
      return [];
    }
  }

  private savePublicRoomInfo(): void {
    if (!this.settings || this.settings.isPrivate) return;
    try {
      const rooms = MultiplayerService.getPublicRooms().filter(
        (r) => r.roomCode !== this.settings?.roomCode
      );
      const host = this.members.find((m) => m.isHost);
      rooms.push({
        roomCode: this.settings.roomCode,
        roomName: this.settings.roomName,
        hostName: host?.displayName || 'เจ้าสำนัก',
        playerCount: this.members.length,
        maxPlayers: this.settings.maxPlayers,
        mode: this.settings.mode,
        maxRounds: this.settings.maxRounds,
        updatedAt: Date.now(),
      });
      localStorage.setItem('pali_public_rooms_v2', JSON.stringify(rooms));
    } catch {}
  }

  private removePublicRoomInfo(roomCode: string): void {
    try {
      const rooms = MultiplayerService.getPublicRooms().filter((r) => r.roomCode !== roomCode);
      localStorage.setItem('pali_public_rooms_v2', JSON.stringify(rooms));
    } catch {}
  }
}

export const multiplayerService = new MultiplayerService();
