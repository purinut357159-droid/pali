import mqtt, { type MqttClient } from 'mqtt';
import type { UserAccount, GameInvite } from '../types/auth';
import { syncExternalAccounts, getStoredAccounts } from './authService';

export interface PublicRoomInfo {
  roomCode: string;
  roomName: string;
  hostName: string;
  hostAvatar: string;
  mode: 'rounds' | 'points';
  currentPlayers: number;
  maxPlayers: number;
  status: 'waiting' | 'in_game';
  hostId: string;
  timestamp: number;
}

const TOPIC_ROOMS = 'pali_tycoon/v2/public_rooms';
const TOPIC_ACCOUNTS = 'pali_tycoon/v2/global_accounts';
const TOPIC_INVITES = 'pali_tycoon/v2/invites';

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081',
];

class PublicDiscoveryService {
  private client: MqttClient | null = null;
  private clientId: string;
  private currentBrokerIndex: number = 0;
  private isConnected: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;

  private activeRooms: Map<string, PublicRoomInfo> = new Map();
  private roomUpdateListeners: Set<(rooms: PublicRoomInfo[]) => void> = new Set();
  private inviteListeners: Set<(invite: GameInvite) => void> = new Set();

  private announceInterval: number | null = null;
  private activeAnnouncedRoom: PublicRoomInfo | null = null;

  constructor() {
    this.clientId = `pali_client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    this.initBroadcastChannel();
    this.initMqtt();

    // Periodic cleanup of stale rooms (inactive for > 12 seconds)
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        this.cleanStaleRooms();
      }, 3000);
    }
  }

  private initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('pali_discovery_channel_v2');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingPayload(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }
    }
  }

  private initMqtt() {
    const brokerUrl = BROKERS[this.currentBrokerIndex];
    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
        keepalive: 30,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.client?.subscribe([TOPIC_ROOMS, TOPIC_ACCOUNTS, `${TOPIC_INVITES}/#`], (err) => {
          if (!err) {
            // Query for currently active public rooms upon connect
            this.publish(TOPIC_ROOMS, { type: 'QUERY_ROOMS', fromId: this.clientId });
            // Share known accounts with the global network
            this.broadcastAccounts(getStoredAccounts());
          }
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          this.handleIncomingPayload(payload, topic);
        } catch (e) {
          console.warn('Failed to parse MQTT message', e);
        }
      });

      this.client.on('error', () => {
        this.tryNextBroker();
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (e) {
      console.warn('Failed to connect to MQTT broker', e);
      this.tryNextBroker();
    }
  }

  private tryNextBroker() {
    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }
    this.currentBrokerIndex = (this.currentBrokerIndex + 1) % BROKERS.length;
    setTimeout(() => {
      this.initMqtt();
    }, 2000);
  }

  private publish(topic: string, data: any) {
    const messageStr = JSON.stringify(data);

    // 1. Send via MQTT if connected
    if (this.client && this.isConnected) {
      try {
        this.client.publish(topic, messageStr);
      } catch (e) {
        console.warn('MQTT publish error', e);
      }
    }

    // 2. Broadcast via BroadcastChannel for multi-tab support
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch (e) {
        console.warn('BroadcastChannel publish error', e);
      }
    }
  }

  private handleIncomingPayload(payload: any, _topic?: string) {
    if (!payload || typeof payload !== 'object') return;

    switch (payload.type) {
      case 'ROOM_ANNOUNCE': {
        const room: PublicRoomInfo = payload.room;
        if (room && room.roomCode) {
          this.activeRooms.set(room.roomCode, {
            ...room,
            timestamp: Date.now(),
          });
          this.notifyRoomUpdate();
        }
        break;
      }

      case 'ROOM_CLOSED': {
        const roomCode: string = payload.roomCode;
        if (roomCode && this.activeRooms.has(roomCode)) {
          this.activeRooms.delete(roomCode);
          this.notifyRoomUpdate();
        }
        break;
      }

      case 'QUERY_ROOMS': {
        // If this client is hosting an active announced room, re-announce it immediately
        if (this.activeAnnouncedRoom) {
          this.publish(TOPIC_ROOMS, {
            type: 'ROOM_ANNOUNCE',
            room: {
              ...this.activeAnnouncedRoom,
              timestamp: Date.now(),
            },
          });
        }
        break;
      }

      case 'GLOBAL_ACCOUNTS_SYNC': {
        if (Array.isArray(payload.accounts) && payload.accounts.length > 0) {
          syncExternalAccounts(payload.accounts, false);
        }
        break;
      }

      case 'GLOBAL_INVITE': {
        const invite: GameInvite = payload.invite;
        if (invite && invite.toUserId) {
          this.inviteListeners.forEach((fn) => {
            try {
              fn(invite);
            } catch (e) {
              console.error('Error in invite listener', e);
            }
          });
        }
        break;
      }
    }
  }

  private cleanStaleRooms() {
    const now = Date.now();
    let hasDeleted = false;
    this.activeRooms.forEach((room, code) => {
      // If room has not sent a heartbeat in 12 seconds, remove it
      if (now - room.timestamp > 12000) {
        this.activeRooms.delete(code);
        hasDeleted = true;
      }
    });

    if (hasDeleted) {
      this.notifyRoomUpdate();
    }
  }

  private notifyRoomUpdate() {
    const list = Array.from(this.activeRooms.values()).sort((a, b) => b.timestamp - a.timestamp);
    this.roomUpdateListeners.forEach((fn) => {
      try {
        fn(list);
      } catch (e) {
        console.error('Error in room update listener', e);
      }
    });
  }

  // -------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------

  public onRoomsUpdate(listener: (rooms: PublicRoomInfo[]) => void): () => void {
    this.roomUpdateListeners.add(listener);
    listener(Array.from(this.activeRooms.values()));
    // Send a query to fetch latest from swarm
    this.publish(TOPIC_ROOMS, { type: 'QUERY_ROOMS', fromId: this.clientId });

    return () => {
      this.roomUpdateListeners.delete(listener);
    };
  }

  public onInvite(listener: (invite: GameInvite) => void): () => void {
    this.inviteListeners.add(listener);
    return () => {
      this.inviteListeners.delete(listener);
    };
  }

  public startAnnouncingPublicRoom(room: Omit<PublicRoomInfo, 'timestamp'>) {
    this.stopAnnouncingPublicRoom();

    this.activeAnnouncedRoom = {
      ...room,
      timestamp: Date.now(),
    };

    // Immediate announcement
    this.publish(TOPIC_ROOMS, {
      type: 'ROOM_ANNOUNCE',
      room: this.activeAnnouncedRoom,
    });

    // Heartbeat every 4 seconds to keep room alive in the public browser
    this.announceInterval = window.setInterval(() => {
      if (this.activeAnnouncedRoom) {
        this.activeAnnouncedRoom.timestamp = Date.now();
        this.publish(TOPIC_ROOMS, {
          type: 'ROOM_ANNOUNCE',
          room: this.activeAnnouncedRoom,
        });
      }
    }, 4000);
  }

  public updateAnnouncedRoomPlayerCount(currentPlayers: number, status?: 'waiting' | 'in_game') {
    if (this.activeAnnouncedRoom) {
      this.activeAnnouncedRoom.currentPlayers = currentPlayers;
      if (status) this.activeAnnouncedRoom.status = status;
      this.activeAnnouncedRoom.timestamp = Date.now();
      this.publish(TOPIC_ROOMS, {
        type: 'ROOM_ANNOUNCE',
        room: this.activeAnnouncedRoom,
      });
    }
  }

  public stopAnnouncingPublicRoom() {
    if (this.announceInterval) {
      clearInterval(this.announceInterval);
      this.announceInterval = null;
    }
    if (this.activeAnnouncedRoom) {
      this.publish(TOPIC_ROOMS, {
        type: 'ROOM_CLOSED',
        roomCode: this.activeAnnouncedRoom.roomCode,
      });
      this.activeAnnouncedRoom = null;
    }
  }

  public broadcastAccounts(accounts: UserAccount[]) {
    if (!Array.isArray(accounts) || accounts.length === 0) return;
    this.publish(TOPIC_ACCOUNTS, {
      type: 'GLOBAL_ACCOUNTS_SYNC',
      accounts,
      fromId: this.clientId,
      timestamp: Date.now(),
    });
  }

  public sendInvite(invite: GameInvite) {
    this.publish(`${TOPIC_INVITES}/${invite.toUserId}`, {
      type: 'GLOBAL_INVITE',
      invite,
      timestamp: Date.now(),
    });
  }

  public getKnownPublicRooms(): PublicRoomInfo[] {
    return Array.from(this.activeRooms.values());
  }
}

export const publicDiscoveryService = new PublicDiscoveryService();
