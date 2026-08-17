import type { Character, GameMode } from './game';

export interface RoomMember {
  id: string; // Peer / Client unique ID
  userId?: string; // Logged-in UserAccount ID (if any)
  displayName: string;
  avatar: string; // Emoji
  character: Character;
  color: string;
  isHost: boolean;
  isReady: boolean;
  isAi?: boolean;
  ping?: number;
  joinedAt: number;
}

export interface RoomSettings {
  roomCode: string;
  roomName: string;
  mode: GameMode;
  maxRounds: number;
  maxPlayers: number;
  isPrivate: boolean;
  hostId: string;
  createdAt: number;
}

export interface LobbyChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor?: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface InGameChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor?: string;
  text: string;
  timestamp: string;
  type?: 'chat' | 'emote' | 'action';
}

export type NetworkPacketType =
  | 'ROOM_JOIN'
  | 'ROOM_LEAVE'
  | 'ROOM_STATE_SYNC'
  | 'MEMBER_UPDATE'
  | 'MEMBER_READY_TOGGLE'
  | 'SETTINGS_UPDATE'
  | 'KICK_MEMBER'
  | 'LOBBY_CHAT'
  | 'GAME_START'
  | 'GAME_STATE_SYNC'
  | 'DICE_ROLL'
  | 'PLAYER_STEP_MOVE'
  | 'QUIZ_OPEN'
  | 'QUIZ_ANSWER_RESULT'
  | 'TILE_BUY_OR_UPGRADE'
  | 'TILE_INSPECTION'
  | 'EVENT_CARD_TRIGGER'
  | 'TURN_CHANGE'
  | 'FULL_STATE_SYNC'
  | 'INGAME_CHAT'
  | 'ACCOUNT_REGISTRY_SYNC'
  | 'HOST_PING'
  | 'CLIENT_PONG';

export interface NetworkPacket {
  id: string;
  type: NetworkPacketType;
  roomCode: string;
  senderId: string;
  timestamp: number;
  payload: any;
}

export interface OnlineRoomInfo {
  roomCode: string;
  roomName: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  mode: GameMode;
  maxRounds: number;
  isLocked: boolean;
}
