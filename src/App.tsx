import React, { useState, useEffect } from 'react';
import type { GameState, Player, BoardTile, Question, CardEffect, GameMode } from './types/game';
import type { UserAccount, GameInvite } from './types/auth';
import type { RoomMember, RoomSettings } from './types/multiplayer';
import { BOARD_TILES } from './data/boardConfig';
import { QUESTION_BANK } from './data/questionBank';
import { BOON_CARDS, KARMA_CARDS } from './data/cardsData';
import { GameHeader } from './components/GameHeader';
import { PlayerCard } from './components/PlayerCard';
import { Board } from './components/Board';
import { QuizModal } from './components/QuizModal';
import { TileDetailModal } from './components/TileDetailModal';
import { EventModal } from './components/EventModal';
import { ReviewNotebook } from './components/ReviewNotebook';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import type { PlayerSetupConfig } from './components/CharacterSelectModal';
import { WinnerModal } from './components/WinnerModal';
import { ChatWidget } from './components/ChatWidget';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { FriendsModal } from './components/FriendsModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { InGameOnlineChat } from './components/InGameOnlineChat';
import { addWrongQuestionToSRS, markQuestionMastered } from './utils/srsEngine';
import { audioManager } from './utils/audioManager';
import {
  getCurrentUser,
  recordMatchResult,
  syncUserReviewDeck,
  liveRecordStatChange,
} from './utils/authService';
import { checkPropertyCombo, UPGRADE_NAMES } from './utils/comboEngine';
import { multiplayerService } from './utils/multiplayerService';
import { getPendingInvitesForUser, clearInvite } from './utils/friendService';
import { publicDiscoveryService } from './utils/publicDiscoveryService';
import { Check, X, Sparkles } from 'lucide-react';

function shuffleQuestionOptions(q: Question): Question {
  const originalCorrectText = q.options[q.correctAnswer];
  const shuffledOptions = [...q.options];

  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }

  const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText);

  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'saved'>('login');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [showOnlineLobbyModal, setShowOnlineLobbyModal] = useState<boolean>(false);
  const [matchRecorded, setMatchRecorded] = useState<boolean>(false);

  // Online Multiplayer State
  const [isOnlineMatch, setIsOnlineMatch] = useState<boolean>(false);
  const [onlineRoomSettings, setOnlineRoomSettings] = useState<RoomSettings | null>(null);
  const [, setOnlineRoomMembers] = useState<RoomMember[]>([]);
  const [myOnlineMemberId, setMyOnlineMemberId] = useState<string>('');
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);
  const [activeInviteBanner, setActiveInviteBanner] = useState<GameInvite | null>(null);
  const [remotePlayerNotice, setRemotePlayerNotice] = useState<string | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    mode: 'points',
    maxRounds: 20,
    currentRound: 1,
    currentTurnPlayerIndex: 0,
    players: [],
    tiles: BOARD_TILES,
    dice: [1, 1],
    isDiceRolled: false,
    gameStatus: 'setup',
    logs: [],
    reviewItems: currentUser?.reviewItems || [],
    askedQuestionIds: [],
  });

  const [activeQuiz, setActiveQuiz] = useState<{
    question: Question;
    title: string;
    targetTile?: BoardTile;
    mode: 'buy' | 'rent' | 'quiz' | 'exam' | 'upgrade';
  } | null>(null);

  const [activeTileDetail, setActiveTileDetail] = useState<BoardTile | null>(null);
  const [activeEventCard, setActiveEventCard] = useState<{ card: CardEffect; player: Player } | null>(null);
  const [showReviewNotebook, setShowReviewNotebook] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [rolledDoubles, setRolledDoubles] = useState<boolean>(false);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);

  // Parse URL query parameter ?room=PALI-XXXX on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        const clean = roomParam.trim().toUpperCase();
        setInitialRoomCode(clean);
        setShowOnlineLobbyModal(true);
      }
    } catch {}
  }, []);

  // Check for incoming game invites
  useEffect(() => {
    if (!currentUser) return;

    const checkInvites = () => {
      const pending = getPendingInvitesForUser(currentUser.id);
      if (pending.length > 0) {
        setActiveInviteBanner(pending[0]);
      }
    };

    checkInvites();

    const handleAccountSync = () => {
      checkInvites();
      const updatedUser = getCurrentUser();
      if (updatedUser) setCurrentUser(updatedUser);
    };

    const unsubGlobalInvite = publicDiscoveryService.onInvite((invite) => {
      if (currentUser && invite.toUserId === currentUser.id) {
        setActiveInviteBanner(invite);
        audioManager.playSathuChime();
      }
    });

    window.addEventListener('pali_accounts_updated', handleAccountSync);
    window.addEventListener('storage', handleAccountSync);

    return () => {
      unsubGlobalInvite();
      window.removeEventListener('pali_accounts_updated', handleAccountSync);
      window.removeEventListener('storage', handleAccountSync);
    };
  }, [currentUser]);

  // Sync initial review items if user logs in
  useEffect(() => {
    if (currentUser?.reviewItems && gameState.gameStatus === 'setup') {
      setGameState((prev) => ({
        ...prev,
        reviewItems: currentUser.reviewItems,
      }));
    }
  }, [currentUser, gameState.gameStatus]);

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const newLog = {
      id: Date.now().toString() + Math.random().toString(),
      timestamp: new Date().toLocaleTimeString('th-TH'),
      text,
      type,
    };
    setGameState((prev) => ({
      ...prev,
      logs: [newLog, ...prev.logs],
    }));
  };

  // -------------------------------------------------------------
  // START GAME (Local & Online)
  // -------------------------------------------------------------

  const handleStartGame = (configs: PlayerSetupConfig[], mode: GameMode, rounds: number) => {
    const playerColors = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981'];
    setMatchRecorded(false);
    setIsOnlineMatch(false);
    setOnlineRoomSettings(null);

    const newPlayers: Player[] = configs.map((cfg, idx) => ({
      id: `p_${idx + 1}`,
      name: cfg.name,
      character: cfg.character,
      wisdomPoints: 2000,
      position: 0,
      isAi: cfg.isAi,
      aiDifficulty: 'medium',
      color: playerColors[idx % playerColors.length],
      isSkipTurn: false,
      isBankrupt: false,
      hasCompletedFirstLap: false,
      doublesStreak: 0,
      tutoringWrongCount: 0,
      freeAnswerCards: cfg.character.id === 'student' ? 1 : 0,
      ownedProperties: [],
      exp: 0,
      level: 1,
      stats: { correctAnswers: 0, totalAnswers: 0, propertiesBought: 0, examsPassed: 0 },
    }));

    setGameState({
      mode,
      maxRounds: rounds,
      currentRound: 1,
      currentTurnPlayerIndex: 0,
      players: newPlayers,
      tiles: BOARD_TILES.map((t) => ({ ...t, ownerId: null, upgradeLevel: 0 })),
      dice: [1, 1],
      isDiceRolled: false,
      gameStatus: 'playing',
      logs: [],
      reviewItems: currentUser?.reviewItems || gameState.reviewItems,
      askedQuestionIds: [],
    });

    addLog(`🎲 เริ่มเกมบาลีส่วนฐี (${configs.length} ผู้เล่น)! ผู้เล่นทุกคนเริ่มด้วย 2,000 แต้มปัญญาเท่ากัน`, 'success');
  };

  const handleStartOnlineGame = (roomMembers: RoomMember[], settings: RoomSettings) => {
    setMatchRecorded(false);
    setIsOnlineMatch(true);
    setOnlineRoomSettings(settings);
    setOnlineRoomMembers(roomMembers);
    setMyOnlineMemberId(multiplayerService.currentMemberId);
    setShowOnlineLobbyModal(false);

    const newPlayers: Player[] = roomMembers.map((m) => ({
      id: m.id,
      name: m.displayName,
      character: m.character,
      wisdomPoints: 2000,
      position: 0,
      isAi: !!m.isAi,
      aiDifficulty: 'medium',
      color: m.color,
      isSkipTurn: false,
      isBankrupt: false,
      hasCompletedFirstLap: false,
      doublesStreak: 0,
      tutoringWrongCount: 0,
      freeAnswerCards: m.character.id === 'student' ? 1 : 0,
      ownedProperties: [],
      exp: 0,
      level: 1,
      stats: { correctAnswers: 0, totalAnswers: 0, propertiesBought: 0, examsPassed: 0 },
    }));

    setGameState({
      mode: settings.mode,
      maxRounds: settings.maxRounds,
      currentRound: 1,
      currentTurnPlayerIndex: 0,
      players: newPlayers,
      tiles: BOARD_TILES.map((t) => ({ ...t, ownerId: null, upgradeLevel: 0 })),
      dice: [1, 1],
      isDiceRolled: false,
      gameStatus: 'playing',
      logs: [],
      reviewItems: currentUser?.reviewItems || gameState.reviewItems,
      askedQuestionIds: [],
    });

    addLog(`🌐 เริ่มการแข่งขันออนไลน์ ห้อง "${settings.roomCode}" (${newPlayers.length} ผู้เล่น)!`, 'success');
  };

  // -------------------------------------------------------------
  // MULTIPLAYER NETWORK SYNC LISTENERS
  // -------------------------------------------------------------

  useEffect(() => {
    if (!isOnlineMatch) return;

    const unsubs = [
      multiplayerService.on('dice_roll', (payload: any) => {
        executeDiceRoll(payload.d1, payload.d2, false);
      }),

      multiplayerService.on('quiz_open', (payload: any) => {
        const { question, title, targetTile, mode, turnPlayerId } = payload;
        if (turnPlayerId === multiplayerService.currentMemberId) {
          setActiveQuiz({ question, title, targetTile, mode });
        } else {
          const turnPlayer = gameState.players.find((p) => p.id === turnPlayerId);
          setRemotePlayerNotice(`⏳ ${turnPlayer?.name || 'ผู้เล่น'} กำลังตอบคำถามบาลี: ${title}`);
        }
      }),

      multiplayerService.on('quiz_answer_result', (payload: any) => {
        setRemotePlayerNotice(null);
        handleAnswerQuiz(payload.isCorrect, payload.speedBonus, payload.timeTaken, false);
      }),

      multiplayerService.on('tile_inspection', (payload: any) => {
        if (payload?.tileName && payload?.playerName) {
          setRemotePlayerNotice(`📖 ${payload.playerName} กำลังพิจารณาซื้อ/อัปเกรดวิชา "${payload.tileName}"...`);
        } else {
          setRemotePlayerNotice(null);
        }
      }),

      multiplayerService.on('event_card_trigger', (payload: any) => {
        const targetPlayer = gameState.players.find((p) => p.id === payload.playerId);
        if (targetPlayer && payload.card) {
          applyCardEffect(payload.card, targetPlayer, false);
        }
      }),

      multiplayerService.on('tile_detail_action', (payload: any) => {
        const { action, tileId } = payload;
        const tile = gameState.tiles.find((t) => t.id === tileId);
        if (tile) {
          if (action === 'buy') {
            triggerQuestion(tile, 'buy', `ตอบคำถามบาลีเพื่อซื้อวิชา "${tile.name}"`, false);
          } else if (action === 'upgrade') {
            triggerQuestion(tile, 'upgrade', `ตอบคำถามบาลีเพื่ออัปเกรดสำนักเรียน "${tile.name}"`, false);
          }
        }
      }),

      multiplayerService.on('turn_change', (payload: any) => {
        setActiveQuiz(null);
        setActiveTileDetail(null);
        setActiveEventCard(null);
        setRolledDoubles(false);
        setRemotePlayerNotice(null);

        if (payload && payload.nextIndex !== undefined) {
          setGameState((prev) => {
            const isGameOver = payload.isGameOver || false;
            const winner = payload.winner || null;
            return {
              ...prev,
              players: payload.players || prev.players,
              tiles: payload.tiles || prev.tiles,
              currentTurnPlayerIndex: payload.nextIndex,
              currentRound: payload.nextRound || prev.currentRound,
              isDiceRolled: false,
              gameStatus: isGameOver ? 'game_over' : prev.gameStatus,
              winner: winner || prev.winner,
            };
          });

          const nextP = (payload.players || gameState.players)[payload.nextIndex];
          if (nextP?.id === myOnlineMemberId) {
            audioManager.playSathuChime();
          }
        } else {
          nextTurn(false);
        }
      }),

      multiplayerService.on('full_state_sync', (payload: any) => {
        if (payload?.gameState) {
          setGameState(payload.gameState);
        }
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [isOnlineMatch, gameState.players, gameState.tiles, gameState.currentTurnPlayerIndex, myOnlineMemberId]);

  // Check Game Over and Record Results to User Profile
  useEffect(() => {
    if (gameState.gameStatus === 'game_over' && gameState.winner && currentUser && !matchRecorded) {
      setMatchRecorded(true);
      const userPlayer = isOnlineMatch
        ? gameState.players.find((p) => p.id === myOnlineMemberId)
        : gameState.players.find((p) => !p.isAi) || gameState.players[0];

      if (userPlayer) {
        const isWinner = gameState.winner.id === userPlayer.id;
        const recordRes = recordMatchResult(currentUser.id, {
          isWinner,
          wisdomEarned: userPlayer.wisdomPoints,
          correctAnswers: userPlayer.stats.correctAnswers,
          totalAnswers: userPlayer.stats.totalAnswers,
          propertiesBought: userPlayer.stats.propertiesBought,
          examsPassed: userPlayer.stats.examsPassed,
        });

        if (recordRes) {
          setCurrentUser(recordRes.user);

          if (recordRes.streakGained > 1) {
            addLog(`🔥 ยอดเยี่ยม! ${recordRes.user.displayName} ชนะการแข่งขันต่อเนื่อง ${recordRes.streakGained} เกมติดต่อกัน!`, 'success');
          }

          if (recordRes.leveledUp) {
            addLog(`🎉 ยินดีด้วย! ${recordRes.user.displayName} เลื่อนระดับสู่ Lv.${recordRes.newLevel} (${recordRes.user.rankTitle})!`, 'success');
          }

          if (recordRes.newAchievements.length > 0) {
            recordRes.newAchievements.forEach((ach) => {
              addLog(`🏆 ปปลดล็อกเหรียญตรา: "${ach.title}" - ${ach.description}`, 'success');
            });
          }
        }
      }
    }
  }, [gameState.gameStatus, gameState.winner, gameState.players, currentUser, matchRecorded, isOnlineMatch, myOnlineMemberId]);

  // -------------------------------------------------------------
  // DICE ROLL & MOVEMENT
  // -------------------------------------------------------------

  const handleRollDice = () => {
    if (gameState.isDiceRolled || gameState.gameStatus !== 'playing' || movingPlayerId) return;

    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
    if (isOnlineMatch && currentPlayer.id !== myOnlineMemberId && !(currentPlayer.isAi && multiplayerService.isHost)) {
      return;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    executeDiceRoll(d1, d2, true);
  };

  const executeDiceRoll = (d1: number, d2: number, broadcast: boolean = true) => {
    audioManager.playDiceRoll();
    const isDoubles = d1 === d2;
    const totalStep = d1 + d2;
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

    if (isOnlineMatch && broadcast) {
      multiplayerService.broadcastGameAction('DICE_ROLL', { d1, d2 });
    }

    if (currentPlayer.isBankrupt) {
      nextTurn();
      return;
    }

    if (currentPlayer.isSkipTurn) {
      addLog(`🏛️ ${currentPlayer.name} ติดภารกิจทำข้อสอบในสนามสอบสนามหลวง ข้ามการเล่น 1 ตา`, 'warning');
      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        updatedPlayers[prev.currentTurnPlayerIndex].isSkipTurn = false;
        updatedPlayers[prev.currentTurnPlayerIndex].doublesStreak = 0;
        return { ...prev, players: updatedPlayers };
      });
      setTimeout(() => nextTurn(broadcast), 1000);
      return;
    }

    const currentDoubles = isDoubles ? currentPlayer.doublesStreak + 1 : 0;

    if (currentDoubles >= 3) {
      audioManager.playJailSound();
      addLog(`🚨 ${currentPlayer.name} ทอยลูกเต๋าออกคู่ 3 ครั้งติดต่อกัน (${d1}-${d2})! ถูกส่งเข้าสนามสอบสนามหลวง ทันที และหยุดพัก 1 ตา!`, 'danger');
      setRolledDoubles(false);
      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        const p = updatedPlayers[prev.currentTurnPlayerIndex];
        p.position = 10;
        p.isSkipTurn = true;
        p.doublesStreak = 0;
        return {
          ...prev,
          dice: [d1, d2],
          isDiceRolled: true,
          players: updatedPlayers,
        };
      });
      setTimeout(() => nextTurn(broadcast), 1500);
      return;
    }

    setRolledDoubles(isDoubles && currentDoubles < 3);

    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      updatedPlayers[prev.currentTurnPlayerIndex].doublesStreak = currentDoubles;
      return {
        ...prev,
        dice: [d1, d2],
        isDiceRolled: true,
        players: updatedPlayers,
      };
    });

    if (isDoubles) {
      addLog(`🎲 ${currentPlayer.name} ทอยลูกเต๋าได้ ${d1} + ${d2} = ${totalStep} แต้ม ✨ ลูกเต๋าออกคู่ (${d1}-${d2}) ครั้งที่ ${currentDoubles}/3! ได้สิทธิ์เล่นต่อ`, 'info');
    } else {
      addLog(`${currentPlayer.name} ทอยลูกเต๋าได้ ${d1} + ${d2} = ${totalStep} แต้ม`, 'info');
    }

    const oldPos = currentPlayer.position;
    const newPos = (oldPos + totalStep) % 40;
    const passedStart = newPos < oldPos;

    setMovingPlayerId(currentPlayer.id);

    let currentStep = 0;
    let stepPos = oldPos;

    const stepInterval = setInterval(() => {
      currentStep += 1;
      stepPos = (stepPos + 1) % 40;

      audioManager.playDiceRoll();

      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        const p = updatedPlayers[prev.currentTurnPlayerIndex];
        p.position = stepPos;
        return { ...prev, players: updatedPlayers };
      });

      if (currentStep >= totalStep) {
        clearInterval(stepInterval);
        setMovingPlayerId(null);

        setGameState((prev) => {
          const updatedPlayers = [...prev.players];
          const p = updatedPlayers[prev.currentTurnPlayerIndex];

          if (passedStart) {
            const passBonus = Math.round(500 * p.character.expMultiplier);
            p.wisdomPoints += passBonus;
            audioManager.playSathuChime();

            if (!p.hasCompletedFirstLap) {
              p.hasCompletedFirstLap = true;
              addLog(`🚩 ${p.name} วิ่งครบรอบแรกแล้ว! รับโบนัสฟรี +${passBonus} แต้มปัญญา และปลดล็อกสิทธิ์ซื้อวิชาบนกระดาน`, 'success');
            } else {
              addLog(`✨ ${p.name} เดินผ่านจุดเริ่มต้น รับโบนัสฟรี +${passBonus} แต้มปัญญา!`, 'success');
            }
          }

          return { ...prev, players: updatedPlayers };
        });

        handleLandOnTile(newPos);
      }
    }, 180);
  };

  const handleLandOnTile = (tileId: number) => {
    const tile = gameState.tiles[tileId];
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
    const isMyTurn = !isOnlineMatch || currentPlayer.id === myOnlineMemberId || (currentPlayer.isAi && multiplayerService.isHost);

    if (tile.type === 'subject') {
      const owner = gameState.players.find((p) => p.id === tile.ownerId);

      if (!owner) {
        if (!currentPlayer.hasCompletedFirstLap) {
          addLog(`🚫 ${currentPlayer.name} ยังวิ่งไม่ครบ 1 รอบแรก! ไม่สามารถซื้อวิชา "${tile.name}" ได้`, 'warning');
          finishTurnCheck();
        } else if (currentPlayer.wisdomPoints < (tile.price || 0)) {
          addLog(`💸 ${currentPlayer.name} มีแต้มปัญญาไม่พอซื้อวิชา "${tile.name}" (ต้องการ ${tile.price} แต้ม)`, 'warning');
          finishTurnCheck();
        } else {
          if (currentPlayer.isAi) {
            if (currentPlayer.wisdomPoints >= (tile.price || 0) + 200) {
              addLog(`🤖 ${currentPlayer.name} ตัดสินใจตอบคำถามเพื่อซื้อวิชา "${tile.name}"`, 'info');
              triggerQuestion(tile, 'buy', `ตอบคำถามบาลีเพื่อซื้อวิชา "${tile.name}" (ราคา ${tile.price} แต้ม)`);
            } else {
              addLog(`🤖 ${currentPlayer.name} เลือกไม่ซื้อวิชา "${tile.name}" เพื่อเก็บแต้มปัญญาไว้`, 'info');
              finishTurnCheck();
            }
          } else {
            addLog(`📖 ${currentPlayer.name} ตกช่องวิชา "${tile.name}"`, 'info');
            if (isMyTurn) {
              setActiveTileDetail(tile);
            }
          }
        }
      } else if (owner.id === currentPlayer.id) {
        addLog(`${currentPlayer.name} ตกเมืองวิชาของตนเอง (${tile.name})`, 'info');
        if (currentPlayer.isAi) {
          const canUpgrade = tile.upgradeLevel !== undefined && tile.upgradeLevel < 4 && tile.upgradeCost && currentPlayer.wisdomPoints >= tile.upgradeCost + 200;
          if (canUpgrade) {
            addLog(`🤖 ${currentPlayer.name} ตัดสินใจตอบคำถามเพื่ออัปเกรดวิชา "${tile.name}"`, 'info');
            triggerQuestion(tile, 'upgrade', `ตอบคำถามบาลีเพื่ออัปเกรดสำนักเรียน "${tile.name}"`);
          } else {
            finishTurnCheck();
          }
        } else {
          if (isMyTurn) {
            setActiveTileDetail(tile);
          }
        }
      } else {
        const combo = checkPropertyCombo(gameState.tiles, tile, owner.id);
        const comboTag = combo.hasCombo ? ` 🔥(คอมโบ x${combo.multiplier}!)` : '';
        triggerQuestion(tile, 'rent', `ตกเมืองของ ${owner.name}!${comboTag} ตอบคำถามเพื่อลดค่าผ่านทาง`);
      }
    } else if (tile.type === 'boon') {
      const card = BOON_CARDS[Math.floor(Math.random() * BOON_CARDS.length)];
      applyCardEffect(card, currentPlayer);
    } else if (tile.type === 'karma') {
      const card = KARMA_CARDS[Math.floor(Math.random() * KARMA_CARDS.length)];
      applyCardEffect(card, currentPlayer);
    } else if (tile.type === 'quiz') {
      const wrongCount = currentPlayer.tutoringWrongCount || 0;
      addLog(`👨‍🏫 ${currentPlayer.name} เข้าห้องติวบาลีเพิ่มเติม: "${tile.name}" (ตอบผิดสะสม: ${wrongCount}/3 ข้อ)`, 'info');
      triggerQuestion(tile, 'quiz', `ห้องติวเพิ่มเติม: "${tile.name}" (ตอบผิดสะสม ${wrongCount}/3 ข้อ)`);
    } else if (tile.type === 'exam') {
      triggerQuestion(tile, 'exam', 'สนามสอบเปรียญ! ตอบถูกรับโบนัสใหญ่ +300 แต้ม');
    } else if (tile.type === 'goto_jail') {
      audioManager.playJailSound();
      addLog(`🚨 ${currentPlayer.name} ตกช่อง "${tile.name}"! ถูกส่งตัวไปยังช่อง 10 และติดภารกิจทำข้อสอบหยุดพัก 1 ตา!`, 'danger');
      setRolledDoubles(false);
      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        const p = updatedPlayers[prev.currentTurnPlayerIndex];
        p.position = 10;
        p.isSkipTurn = true;
        p.doublesStreak = 0;
        return { ...prev, players: updatedPlayers };
      });
      setTimeout(nextTurn, 1500);
      return;
    } else if (tile.type === 'rest') {
      addLog(`🏛️ ${currentPlayer.name} เดินมาแวะชม ณ ${tile.name} (แวะเยี่ยมเฉยๆ ไม่เสียตาเล่น)`, 'info');
      finishTurnCheck();
    } else {
      addLog(`${currentPlayer.name} พักผ่อน ณ ${tile.name}`, 'info');
      finishTurnCheck();
    }
  };

  const triggerQuestion = (
    tile: BoardTile,
    mode: 'buy' | 'rent' | 'quiz' | 'exam' | 'upgrade',
    title: string,
    broadcast: boolean = true
  ) => {
    const categoryQuestions = QUESTION_BANK.filter(
      (q) => !tile.category || q.category === tile.category
    );
    const pool = categoryQuestions.length > 0 ? categoryQuestions : QUESTION_BANK;

    let unaskedPool = pool.filter((q) => !gameState.askedQuestionIds.includes(q.id));
    if (unaskedPool.length === 0) {
      unaskedPool = pool;
    }

    const rawQ = unaskedPool[Math.floor(Math.random() * unaskedPool.length)];
    const shuffledQ = shuffleQuestionOptions(rawQ);

    setGameState((prev) => ({
      ...prev,
      askedQuestionIds: prev.askedQuestionIds.includes(rawQ.id)
        ? prev.askedQuestionIds
        : [...prev.askedQuestionIds, rawQ.id],
    }));

    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
    const isMyTurn = !isOnlineMatch || currentPlayer?.id === myOnlineMemberId || (currentPlayer?.isAi && multiplayerService.isHost);

    if (isOnlineMatch && broadcast) {
      multiplayerService.broadcastGameAction('QUIZ_OPEN', {
        question: shuffledQ,
        title,
        targetTile: tile,
        mode,
        turnPlayerId: currentPlayer.id,
      });
    }

    if (isMyTurn) {
      setActiveQuiz({
        question: shuffledQ,
        title,
        targetTile: tile,
        mode,
      });
    } else {
      setRemotePlayerNotice(`⏳ ${currentPlayer?.name || 'ผู้เล่น'} กำลังตอบคำถามบาลี: ${title}`);
    }
  };

  const applyCardEffect = (card: CardEffect, player: Player, broadcast: boolean = true) => {
    setActiveEventCard({ card, player });
    addLog(`${player.name} สุ่มได้: ${card.title}`, card.type === 'boon' ? 'success' : 'danger');

    if (isOnlineMatch && broadcast) {
      multiplayerService.broadcastGameAction('EVENT_CARD_TRIGGER', { card, playerId: player.id });
    }

    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      const p = updatedPlayers.find((item) => item.id === player.id);
      if (!p) return prev;

      if (card.wisdomDelta) p.wisdomPoints = Math.max(0, p.wisdomPoints + card.wisdomDelta);
      if (card.giveFreeAnswerCard) p.freeAnswerCards += 1;
      if (card.skipNextTurn) p.isSkipTurn = true;
      if (card.moveDelta) p.position = (p.position + card.moveDelta + 40) % 40;

      return { ...prev, players: updatedPlayers };
    });
  };

  const handleAnswerQuiz = (
    isCorrect: boolean,
    speedBonus: number = 0,
    timeTaken: number = 0,
    broadcast: boolean = true
  ) => {
    if (isOnlineMatch && broadcast) {
      multiplayerService.broadcastGameAction('QUIZ_ANSWER_RESULT', {
        isCorrect,
        speedBonus,
        timeTaken,
      });
    }

    const currentQuiz = activeQuiz;
    setRemotePlayerNotice(null);

    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      const p = updatedPlayers[prev.currentTurnPlayerIndex];
      if (!p) return prev;

      p.stats.totalAnswers += 1;
      let newReviewItems = prev.reviewItems;

      if (isCorrect) {
        p.stats.correctAnswers += 1;

        if (currentUser && (!isOnlineMatch || p.id === myOnlineMemberId)) {
          if (currentQuiz?.mode === 'buy') {
            liveRecordStatChange(currentUser.id, { correctDelta: 1, totalAnswersDelta: 1, propertyBoughtDelta: 1 });
          } else if (currentQuiz?.mode === 'exam') {
            liveRecordStatChange(currentUser.id, { correctDelta: 1, totalAnswersDelta: 1, examDelta: 1, wisdomGained: 300 + speedBonus });
          } else if (currentQuiz?.mode === 'quiz') {
            liveRecordStatChange(currentUser.id, { correctDelta: 1, totalAnswersDelta: 1, wisdomGained: 150 + speedBonus });
          } else {
            liveRecordStatChange(currentUser.id, { correctDelta: 1, totalAnswersDelta: 1 });
          }
        }

        if (currentQuiz?.mode === 'buy' && currentQuiz.targetTile && currentQuiz.targetTile.price && p.wisdomPoints >= currentQuiz.targetTile.price) {
          p.wisdomPoints = p.wisdomPoints - currentQuiz.targetTile.price;
          p.ownedProperties.push(currentQuiz.targetTile.id);
          p.stats.propertiesBought += 1;

          const updatedTiles = prev.tiles.map((t) =>
            t.id === currentQuiz.targetTile?.id ? { ...t, ownerId: p.id, upgradeLevel: 0 as const } : t
          );

          audioManager.playUpgradeSound();
          addLog(`✨ ${p.name} ตอบคำถามบาลีถูกต้อง! ได้รับกรรมสิทธิ์ครอบครองวิชา "${currentQuiz.targetTile.name}" สำเร็จ!`, 'success');
          return { ...prev, players: updatedPlayers, tiles: updatedTiles };
        } else if (currentQuiz?.mode === 'upgrade' && currentQuiz.targetTile) {
          const cost = currentQuiz.targetTile.upgradeCost || 0;
          p.wisdomPoints = Math.max(0, p.wisdomPoints - cost);
          const nextLevel = Math.min(4, ((currentQuiz.targetTile.upgradeLevel ?? 0) + 1)) as any;

          const updatedTiles = prev.tiles.map((t) =>
            t.id === currentQuiz.targetTile?.id ? { ...t, upgradeLevel: nextLevel } : t
          );

          audioManager.playUpgradeSound();
          addLog(`✨ ${p.name} ตอบคำถามบาลีถูกต้อง! อัปเกรดวิชา "${currentQuiz.targetTile.name}" เป็น "${UPGRADE_NAMES[nextLevel]}" สำเร็จ!`, 'success');
          return { ...prev, players: updatedPlayers, tiles: updatedTiles };
        } else if (currentQuiz?.mode === 'rent' && currentQuiz.targetTile) {
          const owner = prev.players.find((item) => item.id === currentQuiz.targetTile?.ownerId);
          if (owner) {
            const combo = checkPropertyCombo(prev.tiles, currentQuiz.targetTile, owner.id);
            let baseRent = currentQuiz.targetTile.rents ? currentQuiz.targetTile.rents[currentQuiz.targetTile.upgradeLevel || 0] : 50;

            if (combo.hasCombo) {
              baseRent = Math.floor(baseRent * combo.multiplier);
              addLog(`🔥 COMBO x${combo.multiplier}! ${owner.name} ${combo.reasons.join(' และ ')}! ค่าผ่านทางเพิ่มเป็น 2 เท่า (${baseRent} แต้ม)`, 'warning');
            }

            const discountedRent = Math.floor(baseRent * 0.5);
            p.wisdomPoints = p.wisdomPoints - discountedRent;
            owner.wisdomPoints += discountedRent;

            addLog(`✨ ${p.name} ตอบคำถามบาลีถูกต้อง! ได้รับส่วนลดจ่ายค่าผ่านทางเพียงครึ่งเดียว (${discountedRent} แต้ม)`, 'info');
          }
        } else if (currentQuiz?.mode === 'quiz') {
          const totalReward = 150 + speedBonus;
          p.wisdomPoints += totalReward;
          audioManager.playSathuChime();
          addLog(`✨ ${p.name} ตอบถูกในห้องติวเพิ่มเติม! รับโบนัสแต้มปัญญา +${totalReward} แต้ม!`, 'success');
        } else if (currentQuiz?.mode === 'exam') {
          const totalReward = 300 + speedBonus;
          p.wisdomPoints += totalReward;
          p.stats.examsPassed += 1;
          audioManager.playSathuChime();
          addLog(`✨ ${p.name} ผ่านสนามสอบเปรียญ! รับโบนัสแต้มปัญญา +${totalReward} แต้ม!`, 'success');
        }
      } else {
        if (currentUser && (!isOnlineMatch || p.id === myOnlineMemberId)) {
          liveRecordStatChange(currentUser.id, { totalAnswersDelta: 1 });
        }
        const penalty = currentQuiz?.mode === 'exam' ? 150 : 100;
        const isFirstWrongExempt = p.character.firstWrongFree && (p.stats.totalAnswers - p.stats.correctAnswers === 1);

        if (currentQuiz?.mode === 'buy' && currentQuiz.targetTile) {
          if (isFirstWrongExempt) {
            addLog(`✨ สกิล [เมตตาธรรม]: ${p.name} ได้รับการยกเว้นการหักแต้มจากการตอบผิดครั้งแรก! (ไม่ได้รับสิทธิ์ซื้อวิชา "${currentQuiz.targetTile.name}")`, 'info');
          } else {
            p.wisdomPoints = Math.max(0, p.wisdomPoints - penalty);
            addLog(`❌ ${p.name} ตอบคำถามบาลีไม่ถูกต้อง! ถูกหักแต้มปัญญา -${penalty} แต้ม และไม่ได้รับสิทธิ์ครอบครองวิชา "${currentQuiz.targetTile.name}"`, 'danger');
          }
        } else if (currentQuiz?.mode === 'upgrade' && currentQuiz.targetTile) {
          if (isFirstWrongExempt) {
            addLog(`✨ สกิล [เมตตาธรรม]: ${p.name} ได้รับการยกเว้นการหักแต้มจากการตอบผิดครั้งแรก!`, 'info');
          } else {
            p.wisdomPoints = Math.max(0, p.wisdomPoints - penalty);
            addLog(`❌ ${p.name} ตอบคำถามบาลีไม่ถูกต้อง! ถูกหักแต้มปัญญา -${penalty} แต้ม และไม่สามารถอัปเกรดวิชา "${currentQuiz.targetTile.name}" ได้`, 'danger');
          }
        } else if (currentQuiz?.mode === 'rent' && currentQuiz.targetTile) {
          const owner = prev.players.find((item) => item.id === currentQuiz.targetTile?.ownerId);
          if (owner) {
            const combo = checkPropertyCombo(prev.tiles, currentQuiz.targetTile, owner.id);
            let baseRent = currentQuiz.targetTile.rents ? currentQuiz.targetTile.rents[currentQuiz.targetTile.upgradeLevel || 0] : 50;

            if (combo.hasCombo) {
              baseRent = Math.floor(baseRent * combo.multiplier);
            }

            p.wisdomPoints = Math.max(0, p.wisdomPoints - baseRent);
            owner.wisdomPoints += baseRent;
            addLog(`${p.name} ตอบผิด! จ่ายค่าผ่านทางเต็มจำนวน (${baseRent} แต้ม)`, 'danger');
          }
        } else if (currentQuiz?.mode === 'exam') {
          if (isFirstWrongExempt) {
            addLog(`✨ สกิล [เมตตาธรรม]: ${p.name} ได้รับการยกเว้นการหักแต้มจากการตอบผิดครั้งแรกในสนามสอบ!`, 'info');
          } else {
            p.wisdomPoints = Math.max(0, p.wisdomPoints - penalty);
            addLog(`❌ ${p.name} ตอบคำถามในสนามสอบเปรียญไม่ถูกต้อง! ถูกหักแต้มปัญญา -${penalty} แต้ม`, 'danger');
          }
        } else {
          if (isFirstWrongExempt) {
            addLog(`✨ สกิล [เมตตาธรรม]: ${p.name} ได้รับการยกเว้นการหักแต้มจากการตอบผิดครั้งแรก!`, 'info');
          } else {
            p.wisdomPoints = Math.max(0, p.wisdomPoints - penalty);
            addLog(`❌ ${p.name} ตอบคำถามบาลีไม่ถูกต้อง หรือหมดเวลา! ถูกหักแต้มปัญญา -${penalty} แต้ม`, 'danger');
          }
        }

        p.tutoringWrongCount = (p.tutoringWrongCount || 0) + 1;
        if (p.tutoringWrongCount >= 3) {
          p.position = 20;
          p.isSkipTurn = true;
          p.tutoringWrongCount = 0;
          p.doublesStreak = 0;
          setRolledDoubles(false);
          audioManager.playJailSound();
          addLog(`🚨 ${p.name} ตอบคำถามผิดสะสมครบ 3 ข้อ! ถูกส่งตัวเข้า "สนามติวเข้มพิเศษ" และหยุดเดิน 1 ตา!`, 'danger');
        }

        if (currentQuiz?.question) {
          newReviewItems = addWrongQuestionToSRS(prev.reviewItems, currentQuiz.question);
          if (currentUser) {
            syncUserReviewDeck(currentUser.id, newReviewItems);
          }
        }
      }

      if (p.wisdomPoints <= 0) {
        if (p.ownedProperties.length === 0) {
          p.isBankrupt = true;
          addLog(`💥 ${p.name} แต้มปัญญาหมดและไม่มีวิชาเหลือ! ล้มละลายออกจากการแข่งขัน`, 'danger');
        }
      }

      return { ...prev, players: updatedPlayers, reviewItems: newReviewItems };
    });

    setActiveQuiz(null);
    finishTurnCheck();
  };

  const handleSellProperty = (tile: BoardTile) => {
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
    if (tile.ownerId !== currentPlayer.id || !tile.price) return;

    const sellPrice = Math.floor(tile.price * 0.5 + (tile.upgradeLevel || 0) * (tile.upgradeCost || 0) * 0.5);

    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      const p = updatedPlayers.find((item) => item.id === currentPlayer.id);
      if (!p) return prev;

      p.wisdomPoints += sellPrice;
      p.ownedProperties = p.ownedProperties.filter((id) => id !== tile.id);

      const updatedTiles = prev.tiles.map((t) =>
        t.id === tile.id ? { ...t, ownerId: null, upgradeLevel: 0 as const } : t
      );

      addLog(`${p.name} ขายวิชา "${tile.name}" คืนให้สำนักเรียน รับ +${sellPrice} แต้มปัญญา`, 'info');
      return { ...prev, players: updatedPlayers, tiles: updatedTiles };
    });
  };

  const handleTakeoverProperty = (tile: BoardTile) => {
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
    const takeoverCost = tile.price ? Math.floor(tile.price * 1.5) : 0;

    if (!tile.ownerId || currentPlayer.wisdomPoints < takeoverCost) return;

    const previousOwnerId = tile.ownerId;

    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      const buyer = updatedPlayers.find((p) => p.id === currentPlayer.id);
      const seller = updatedPlayers.find((p) => p.id === previousOwnerId);

      if (!buyer || !seller) return prev;

      buyer.wisdomPoints -= takeoverCost;
      seller.wisdomPoints += takeoverCost;

      seller.ownedProperties = seller.ownedProperties.filter((id) => id !== tile.id);
      buyer.ownedProperties.push(tile.id);

      const updatedTiles = prev.tiles.map((t) =>
        t.id === tile.id ? { ...t, ownerId: buyer.id } : t
      );

      addLog(`⚡ ${buyer.name} เทคโอเวอร์วิชา "${tile.name}" จาก ${seller.name} (${takeoverCost} แต้ม)!`, 'success');
      return { ...prev, players: updatedPlayers, tiles: updatedTiles };
    });
  };

  const finishTurnCheck = () => {
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
    if (!currentPlayer) return;

    if (rolledDoubles && !currentPlayer.isBankrupt && !currentPlayer.isSkipTurn) {
      addLog(`🎲✨ ${currentPlayer.name} ได้สิทธิ์ทอยลูกเต๋าต่อทันที! (โบนัสลูกเต๋าออกคู่ ครั้งที่ ${currentPlayer.doublesStreak}/3)`, 'success');
      audioManager.playSathuChime();
      setGameState((prev) => ({ ...prev, isDiceRolled: false }));
    } else {
      setTimeout(() => nextTurn(true), currentPlayer.isAi ? 1000 : 800);
    }
  };

  const nextTurn = (broadcast: boolean = true) => {
    setActiveQuiz(null);
    setActiveTileDetail(null);
    setActiveEventCard(null);
    setRolledDoubles(false);
    setRemotePlayerNotice(null);

    setGameState((prev) => {
      let activePlayers = prev.players.filter((p) => !p.isBankrupt);
      if (activePlayers.length <= 1 && prev.players.length > 1) {
        const overWinner = activePlayers[0] || prev.players[0];
        if (isOnlineMatch && broadcast) {
          multiplayerService.broadcastGameAction('TURN_CHANGE', {
            nextIndex: prev.currentTurnPlayerIndex,
            nextRound: prev.currentRound,
            players: prev.players,
            tiles: prev.tiles,
            isGameOver: true,
            winner: overWinner,
          });
        }
        return {
          ...prev,
          gameStatus: 'game_over',
          winner: overWinner,
        };
      }

      const updatedPlayers = prev.players.map((p, idx) =>
        idx === prev.currentTurnPlayerIndex ? { ...p, doublesStreak: 0 } : p
      );

      let nextIndex = (prev.currentTurnPlayerIndex + 1) % updatedPlayers.length;
      while (updatedPlayers[nextIndex]?.isBankrupt) {
        nextIndex = (nextIndex + 1) % updatedPlayers.length;
      }

      let nextRound = prev.currentRound;
      if (nextIndex === 0) {
        nextRound += 1;
        addLog(`--- เริ่มรอบที่ ${nextRound} ---`, 'info');
      }

      const isGameOver = nextRound > prev.maxRounds;
      let winner: Player | null = null;

      if (isGameOver) {
        const sorted = [...activePlayers].sort((a, b) => b.wisdomPoints - a.wisdomPoints);
        winner = sorted[0];
      }

      if (isOnlineMatch && broadcast) {
        multiplayerService.broadcastGameAction('TURN_CHANGE', {
          nextIndex,
          nextRound,
          players: updatedPlayers,
          tiles: prev.tiles,
          isGameOver,
          winner,
        });
      }

      return {
        ...prev,
        players: updatedPlayers,
        currentTurnPlayerIndex: nextIndex,
        currentRound: nextRound,
        isDiceRolled: false,
        gameStatus: isGameOver ? 'game_over' : 'playing',
        winner,
      };
    });
  };

  // AI Effects
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

    // In online matches, only host runs AI logic
    if (isOnlineMatch && !multiplayerService.isHost) return;

    if (currentPlayer && currentPlayer.isAi && !currentPlayer.isBankrupt && !gameState.isDiceRolled && !movingPlayerId && !activeQuiz && !activeEventCard && !activeTileDetail) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurnPlayerIndex, gameState.isDiceRolled, gameState.gameStatus, movingPlayerId, activeQuiz, activeEventCard, activeTileDetail, isOnlineMatch]);

  useEffect(() => {
    if (activeQuiz && gameState.players[gameState.currentTurnPlayerIndex]?.isAi) {
      if (isOnlineMatch && !multiplayerService.isHost) return;

      const randomSeconds = +(Math.random() * 4 + 2.5).toFixed(1);
      const isCorrect = Math.random() < 0.75;
      const speedBonus = isCorrect ? Math.max(10, Math.round((15 - randomSeconds) * 10)) : 0;

      const timer = setTimeout(() => {
        handleAnswerQuiz(isCorrect, speedBonus, randomSeconds);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeQuiz, isOnlineMatch]);

  useEffect(() => {
    if (activeEventCard && activeEventCard.player.isAi) {
      if (isOnlineMatch && !multiplayerService.isHost) return;

      const timer = setTimeout(() => {
        setActiveEventCard(null);
        finishTurnCheck();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeEventCard, isOnlineMatch]);

  const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
  const isMyTurn = !isOnlineMatch || currentPlayer?.id === myOnlineMemberId || (currentPlayer?.isAi && multiplayerService.isHost);
  const friendReqCount = currentUser?.incomingFriendRequests?.length || 0;

  return (
    <div className="game-app-container">
      {/* Top Floating Game Invite Banner */}
      {activeInviteBanner && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            right: '20px',
            zIndex: 1300,
            animation: 'fadeIn 0.3s ease',
            maxWidth: '380px',
            width: '92%',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '12px 16px',
              border: '1.5px solid var(--primary-gold)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px var(--gold-glow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>{activeInviteBanner.fromAvatar}</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-gold)' }}>
                    {activeInviteBanner.fromDisplayName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ชวนท่านเข้าร่วมห้องแข่งขัน: <strong style={{ color: '#fff' }}>{activeInviteBanner.roomCode}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  clearInvite(activeInviteBanner.id);
                  setActiveInviteBanner(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => {
                  setInitialRoomCode(activeInviteBanner.roomCode);
                  clearInvite(activeInviteBanner.id);
                  setActiveInviteBanner(null);
                  setShowOnlineLobbyModal(true);
                }}
                className="gold-button"
                style={{ flex: 1, padding: '6px 12px', fontSize: '0.78rem', justifyContent: 'center', borderRadius: '8px' }}
              >
                <Check size={14} /> เข้าร่วมห้อง
              </button>
              <button
                onClick={() => {
                  clearInvite(activeInviteBanner.id);
                  setActiveInviteBanner(null);
                }}
                className="secondary-button"
                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <GameHeader
        gameState={gameState}
        currentUser={currentUser}
        onOpenNotebook={() => setShowReviewNotebook(true)}
        onRestart={() => {
          if (isOnlineMatch) {
            multiplayerService.leaveRoom();
            setIsOnlineMatch(false);
          }
          setGameState((prev) => ({ ...prev, gameStatus: 'setup' }));
        }}
        onToggleMute={() => setIsMuted(audioManager.toggleMute())}
        isMuted={isMuted}
        onOpenAuthModal={() => {
          setAuthModalTab('login');
          setShowAuthModal(true);
        }}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onOpenFriends={() => setShowFriendsModal(true)}
        onOpenOnlineLobby={() => setShowOnlineLobbyModal(true)}
        isOnline={isOnlineMatch}
        onlineRoomCode={onlineRoomSettings?.roomCode}
        friendRequestCount={friendReqCount}
      />

      {/* Remote Turn Notice Overlay Banner */}
      {remotePlayerNotice && gameState.gameStatus === 'playing' && (
        <div
          style={{
            margin: '0 auto 12px auto',
            maxWidth: '600px',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(212, 175, 55, 0.2))',
            border: '1.5px solid #38bdf8',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            color: '#fff',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <Sparkles size={18} color="#38bdf8" />
          <span>{remotePlayerNotice}</span>
        </div>
      )}

      {gameState.gameStatus === 'playing' && (
        <div className="game-layout">
          <div className="players-sidebar">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>👥 ผู้เข้าแข่งขัน (Players)</span>
              {isOnlineMatch && (
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
                  🌐 ออนไลน์
                </span>
              )}
            </h3>
            {gameState.players.map((p, idx) => (
              <PlayerCard
                key={p.id}
                player={p}
                isCurrentTurn={idx === gameState.currentTurnPlayerIndex}
              />
            ))}
          </div>

          <div>
            <Board
              tiles={gameState.tiles}
              players={gameState.players}
              currentTurnPlayer={currentPlayer}
              movingPlayerId={movingPlayerId}
              onTileClick={(tile) => {
                if (!isOnlineMatch || isMyTurn) {
                  setActiveTileDetail(tile);
                }
              }}
              onRollDice={handleRollDice}
              isDiceRolled={gameState.isDiceRolled}
              dice={gameState.dice}
              logs={gameState.logs}
              canRollDice={isMyTurn}
            />
          </div>

          <div className="stats-sidebar glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', margin: '0 0 10px 0' }}>
              📚 คลังวิชา & สถิติ
            </h3>
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>วิชามีเจ้าของแล้ว: {gameState.tiles.filter((t) => t.ownerId).length} / 26 วิชา</div>
              <div>คำถามในคลัง: {QUESTION_BANK.length} ข้อ</div>
              <div>คำถามทบทวนสะสม: {gameState.reviewItems.length} ข้อ</div>
              <div>คำถามที่ถามแล้ว: {gameState.askedQuestionIds.length} / {QUESTION_BANK.length} ข้อ</div>
              {isOnlineMatch && onlineRoomSettings && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(56,189,248,0.3)' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700 }}>🌐 ห้อง: {onlineRoomSettings.roomCode}</div>
                  <div style={{ color: 'var(--text-muted)' }}>โหมด: {onlineRoomSettings.mode} ({onlineRoomSettings.maxRounds} รอบ)</div>
                </div>
              )}
              {currentUser && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                  <div style={{ color: 'var(--primary-gold)', fontWeight: 600 }}>🌟 บัญชี: {currentUser.displayName}</div>
                  <div style={{ color: 'var(--accent-gold)' }}>ยศ: {currentUser.rankTitle} (Lv.{currentUser.level})</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {gameState.gameStatus === 'setup' && (
        <CharacterSelectModal
          onStartGame={handleStartGame}
          currentUser={currentUser}
          onOpenAuthModal={() => {
            setAuthModalTab('login');
            setShowAuthModal(true);
          }}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenOnlineLobby={() => setShowOnlineLobbyModal(true)}
          onOpenFriends={() => setShowFriendsModal(true)}
        />
      )}

      {activeQuiz && currentPlayer && (
        <QuizModal
          question={activeQuiz.question}
          player={currentPlayer}
          title={activeQuiz.title}
          mode={activeQuiz.mode}
          onAnswer={(isCorrect, speedBonus, timeTaken) => handleAnswerQuiz(isCorrect, speedBonus, timeTaken, true)}
          canUseFreeCard={currentPlayer.freeAnswerCards > 0}
          onUseFreeCard={() => handleAnswerQuiz(true, 150, 0.5, true)}
        />
      )}

      {activeTileDetail && currentPlayer && (
        <TileDetailModal
          tile={activeTileDetail}
          owner={gameState.players.find((p) => p.id === activeTileDetail.ownerId)}
          currentPlayer={currentPlayer}
          allTiles={gameState.tiles}
          onClose={() => {
            setActiveTileDetail(null);
            if (currentPlayer.position === activeTileDetail.id) {
              finishTurnCheck();
            }
          }}
          isCurrentPlayerOnTile={currentPlayer.position === activeTileDetail.id}
          onBuy={(tile) => {
            setActiveTileDetail(null);
            triggerQuestion(tile, 'buy', `ตอบคำถามบาลีเพื่อซื้อวิชา "${tile.name}" (ราคา ${tile.price} แต้ม)`);
          }}
          onUpgrade={(tile) => {
            setActiveTileDetail(null);
            triggerQuestion(tile, 'upgrade', `ตอบคำถามบาลีเพื่ออัปเกรดสำนักเรียน "${tile.name}" (ราคา ${tile.upgradeCost} แต้ม)`);
          }}
          onSell={handleSellProperty}
          onTakeover={(tile) => {
            handleTakeoverProperty(tile);
            finishTurnCheck();
          }}
        />
      )}

      {activeEventCard && (
        <EventModal
          card={activeEventCard.card}
          player={activeEventCard.player}
          onClose={() => {
            setActiveEventCard(null);
            finishTurnCheck();
          }}
        />
      )}

      {showReviewNotebook && (
        <ReviewNotebook
          reviewItems={gameState.reviewItems}
          onClose={() => setShowReviewNotebook(false)}
          onMasterQuestion={(qId) => {
            const updated = markQuestionMastered(gameState.reviewItems, qId);
            setGameState((prev) => ({
              ...prev,
              reviewItems: updated,
            }));
            if (currentUser) {
              syncUserReviewDeck(currentUser.id, updated);
            }
          }}
        />
      )}

      {gameState.gameStatus === 'game_over' && gameState.winner && (
        <WinnerModal
          winner={gameState.winner}
          players={gameState.players}
          onRestart={() => {
            if (isOnlineMatch) {
              multiplayerService.leaveRoom();
              setIsOnlineMatch(false);
            }
            setGameState((prev) => ({ ...prev, gameStatus: 'setup' }));
          }}
        />
      )}

      {/* Friends Modal */}
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setShowFriendsModal(false);
          setAuthModalTab('login');
          setShowAuthModal(true);
        }}
        currentRoomCode={onlineRoomSettings?.roomCode}
        onOpenCreateRoom={() => {
          setShowFriendsModal(false);
          setShowOnlineLobbyModal(true);
        }}
      />

      {/* Online Lobby Modal */}
      <OnlineLobbyModal
        isOpen={showOnlineLobbyModal}
        onClose={() => setShowOnlineLobbyModal(false)}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setShowOnlineLobbyModal(false);
          setAuthModalTab('login');
          setShowAuthModal(true);
        }}
        onStartOnlineGame={handleStartOnlineGame}
        initialRoomCode={initialRoomCode}
        onOpenFriends={() => {
          setShowOnlineLobbyModal(false);
          setShowFriendsModal(true);
        }}
      />

      {/* In-Game Live Online Chat Drawer */}
      <InGameOnlineChat
        isOnline={isOnlineMatch}
        currentRoomCode={onlineRoomSettings?.roomCode}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialTab={authModalTab}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          addLog(`เข้าสู่ระบบในชื่อ ${user.displayName} เรียบร้อย!`, 'success');
        }}
      />

      {/* User Profile Modal */}
      {currentUser && (
        <UserProfileModal
          user={currentUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            addLog('อัปเดตข้อมูลโปรไฟล์เรียบร้อย', 'success');
          }}
          onLogout={() => {
            setCurrentUser(null);
            addLog('ออกจากระบบเรียบร้อย', 'info');
          }}
          onSwitchAccount={() => {
            setShowProfileModal(false);
            setAuthModalTab('saved');
            setShowAuthModal(true);
          }}
          onOpenLeaderboard={() => {
            setShowProfileModal(false);
            setShowLeaderboardModal(true);
          }}
          onOpenFriends={() => {
            setShowProfileModal(false);
            setShowFriendsModal(true);
          }}
        />
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUser={currentUser}
        currentRoomCode={onlineRoomSettings?.roomCode}
        onOpenCreateRoom={() => {
          setShowLeaderboardModal(false);
          setShowOnlineLobbyModal(true);
        }}
      />

      <ChatWidget />
    </div>
  );
};

export default App;
