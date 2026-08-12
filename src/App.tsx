import React, { useState, useEffect } from 'react';
import type { GameState, Player, BoardTile, Question, CardEffect, GameMode, SubjectCategory } from './types/game';
import type { UserAccount } from './types/auth';
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
import { addWrongQuestionToSRS, markQuestionMastered } from './utils/srsEngine';
import { audioManager } from './utils/audioManager';
import {
  getCurrentUser,
  recordMatchResult,
  syncUserReviewDeck,
} from './utils/authService';

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
  const [matchRecorded, setMatchRecorded] = useState<boolean>(false);

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
    mode: 'buy' | 'rent' | 'quiz' | 'exam';
  } | null>(null);

  const [activeTileDetail, setActiveTileDetail] = useState<BoardTile | null>(null);
  const [activeEventCard, setActiveEventCard] = useState<{ card: CardEffect; player: Player } | null>(null);
  const [showReviewNotebook, setShowReviewNotebook] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [rolledDoubles, setRolledDoubles] = useState<boolean>(false);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);

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

  const handleStartGame = (configs: PlayerSetupConfig[], mode: GameMode, rounds: number) => {
    const playerColors = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981'];
    setMatchRecorded(false);

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

  // Check Game Over and Record Results to User Profile
  useEffect(() => {
    if (gameState.gameStatus === 'game_over' && gameState.winner && currentUser && !matchRecorded) {
      setMatchRecorded(true);
      const userPlayer = gameState.players.find((p) => !p.isAi) || gameState.players[0];

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

          if (recordRes.leveledUp) {
            addLog(`🎉 ยินดีด้วย! ${recordRes.user.displayName} เลื่อนระดับสู่ Lv.${recordRes.newLevel} (${recordRes.user.rankTitle})!`, 'success');
          }

          if (recordRes.newAchievements.length > 0) {
            recordRes.newAchievements.forEach((ach) => {
              addLog(`🏆 ปลดล็อกเหรียญตรา: "${ach.title}" - ${ach.description}`, 'success');
            });
          }
        }
      }
    }
  }, [gameState.gameStatus, gameState.winner, gameState.players, currentUser, matchRecorded]);

  const hasColorGroupMonopoly = (tiles: BoardTile[], playerId: string, category?: SubjectCategory): boolean => {
    if (!category) return false;
    const categoryTiles = tiles.filter((t) => t.category === category);
    return categoryTiles.length > 0 && categoryTiles.every((t) => t.ownerId === playerId);
  };

  const handleRollDice = () => {
    if (gameState.isDiceRolled || gameState.gameStatus !== 'playing' || movingPlayerId) return;

    audioManager.playDiceRoll();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const isDoubles = d1 === d2;
    const totalStep = d1 + d2;

    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

    if (currentPlayer.isBankrupt) {
      nextTurn();
      return;
    }

    if (currentPlayer.isSkipTurn) {
      addLog(`${currentPlayer.name} ติดภารกิจทบทวนตำรา ข้ามการเล่น 1 ตา`, 'warning');
      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        updatedPlayers[prev.currentTurnPlayerIndex].isSkipTurn = false;
        return { ...prev, players: updatedPlayers };
      });
      nextTurn();
      return;
    }

    setGameState((prev) => ({ ...prev, dice: [d1, d2], isDiceRolled: true }));
    addLog(`${currentPlayer.name} ทอยลูกเต๋าได้ ${d1} + ${d2} = ${totalStep} แต้ม ${isDoubles ? '🎲 (ลูกเต๋าออกคู่!)' : ''}`, 'info');

    let currentDoubles = isDoubles ? currentPlayer.doublesStreak + 1 : 0;
    setRolledDoubles(isDoubles && currentDoubles < 3);

    if (currentDoubles >= 3) {
      addLog(`⚠️ ${currentPlayer.name} ทอยลูกเต๋าออกคู่ 3 ครั้งติดต่อกัน! ถูกส่งเข้าเรือนพักผ่อน`, 'danger');
      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        const p = updatedPlayers[prev.currentTurnPlayerIndex];
        p.position = 10;
        p.isSkipTurn = true;
        p.doublesStreak = 0;
        return { ...prev, players: updatedPlayers };
      });
      setTimeout(nextTurn, 1000);
      return;
    }

    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      updatedPlayers[prev.currentTurnPlayerIndex].doublesStreak = currentDoubles;
      return { ...prev, players: updatedPlayers };
    });

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

    if (tile.type === 'subject') {
      const owner = gameState.players.find((p) => p.id === tile.ownerId);

      if (!owner) {
        if (!currentPlayer.hasCompletedFirstLap) {
          addLog(`🚫 ${currentPlayer.name} ยังวิ่งไม่ครบ 1 รอบแรก! ไม่สามารถซื้อวิชา "${tile.name}" ได้`, 'warning');
          finishTurnCheck();
        } else {
          triggerQuestion(tile, 'buy', `ทดสอบความรู้เพื่อซื้อวิชา "${tile.name}"`);
        }
      } else if (owner.id === currentPlayer.id) {
        addLog(`${currentPlayer.name} ตกเมืองวิชาของตนเอง (${tile.name})`, 'info');
        setActiveTileDetail(tile);
      } else {
        triggerQuestion(tile, 'rent', `ตกเมืองของ ${owner.name}! ตอบคำถามเพื่อลดค่าผ่านทาง`);
      }
    } else if (tile.type === 'boon') {
      const card = BOON_CARDS[Math.floor(Math.random() * BOON_CARDS.length)];
      applyCardEffect(card, currentPlayer);
    } else if (tile.type === 'karma') {
      const card = KARMA_CARDS[Math.floor(Math.random() * KARMA_CARDS.length)];
      applyCardEffect(card, currentPlayer);
    } else if (tile.type === 'quiz') {
      triggerQuestion(tile, 'quiz', 'ช่องสอบย่อย! ตอบถูกรับแต้มปัญญา +150 แต้ม');
    } else if (tile.type === 'exam') {
      triggerQuestion(tile, 'exam', 'สนามสอบเปรียญ! ตอบถูกรับโบนัสใหญ่ +300 แต้ม');
    } else {
      addLog(`${currentPlayer.name} พักผ่อน ณ ${tile.name}`, 'info');
      finishTurnCheck();
    }
  };

  const triggerQuestion = (tile: BoardTile, mode: 'buy' | 'rent' | 'quiz' | 'exam', title: string) => {
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

    setActiveQuiz({
      question: shuffledQ,
      title,
      targetTile: tile,
      mode,
    });
  };

  const applyCardEffect = (card: CardEffect, player: Player) => {
    setActiveEventCard({ card, player });
    addLog(`${player.name} สุ่มได้: ${card.title}`, card.type === 'boon' ? 'success' : 'danger');

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

  const handleAnswerQuiz = (isCorrect: boolean) => {
    if (!activeQuiz) return;
    const { question, targetTile, mode } = activeQuiz;

    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      const p = updatedPlayers[prev.currentTurnPlayerIndex];
      p.stats.totalAnswers += 1;

      let newReviewItems = prev.reviewItems;

      if (isCorrect) {
        p.stats.correctAnswers += 1;
        addLog(`${p.name} ตอบคำถามบาลีถูกต้อง! (สาธุ)`, 'success');

        if (mode === 'buy' && targetTile && targetTile.price && p.wisdomPoints >= targetTile.price) {
          p.wisdomPoints -= targetTile.price;
          p.ownedProperties.push(targetTile.id);
          p.stats.propertiesBought += 1;

          const updatedTiles = prev.tiles.map((t) =>
            t.id === targetTile.id ? { ...t, ownerId: p.id, upgradeLevel: 0 as const } : t
          );
          addLog(`${p.name} ครอบครองวิชา "${targetTile.name}" สำเร็จ!`, 'success');
          return { ...prev, players: updatedPlayers, tiles: updatedTiles };
        } else if (mode === 'rent' && targetTile) {
          const owner = prev.players.find((item) => item.id === targetTile.ownerId);
          if (owner) {
            let baseRent = targetTile.rents ? targetTile.rents[targetTile.upgradeLevel || 0] : 50;
            if (targetTile.upgradeLevel === 0 && hasColorGroupMonopoly(prev.tiles, owner.id, targetTile.category)) {
              baseRent *= 2;
              addLog(`🏠 ${owner.name} ครอบครองวิชาหมวด ${targetTile.category} ครบเซ็ต! ค่าผ่านทาง x2`, 'warning');
            }
            const discountedRent = Math.floor(baseRent * 0.5);
            p.wisdomPoints -= discountedRent;
            owner.wisdomPoints += discountedRent;
            addLog(`${p.name} ตอบถูก! จ่ายค่าผ่านทางเพียงครึ่งเดียว (${discountedRent} แต้ม)`, 'info');
          }
        } else if (mode === 'quiz' || mode === 'exam') {
          const reward = mode === 'exam' ? 300 : 150;
          p.wisdomPoints += reward;
          if (mode === 'exam') p.stats.examsPassed += 1;
          addLog(`${p.name} ผ่านการสอบ รับโบนัสแต้มปัญญา +${reward} แต้ม!`, 'success');
        }
      } else {
        addLog(`${p.name} ตอบคำถามบาลีไม่ถูกต้อง`, 'danger');
        newReviewItems = addWrongQuestionToSRS(prev.reviewItems, question);

        if (currentUser) {
          syncUserReviewDeck(currentUser.id, newReviewItems);
        }

        if (mode === 'rent' && targetTile) {
          const owner = prev.players.find((item) => item.id === targetTile.ownerId);
          if (owner) {
            let baseRent = targetTile.rents ? targetTile.rents[targetTile.upgradeLevel || 0] : 50;
            if (targetTile.upgradeLevel === 0 && hasColorGroupMonopoly(prev.tiles, owner.id, targetTile.category)) {
              baseRent *= 2;
              addLog(`🏠 ${owner.name} ครอบครองวิชาหมวด ${targetTile.category} ครบเซ็ต! ค่าผ่านทาง x2`, 'warning');
            }
            p.wisdomPoints -= baseRent;
            owner.wisdomPoints += baseRent;
            addLog(`${p.name} ตอบผิด! จ่ายค่าผ่านทางเต็มจำนวน (${baseRent} แต้ม)`, 'danger');
          }
        }
      }

      if (p.wisdomPoints <= 0) {
        if (p.ownedProperties.length === 0) {
          p.isBankrupt = true;
          addLog(`💥 ${p.name} แต้มปัญญาหมดและไม่มีวิชาเหลือ! ล้มละลายออกจากการแข่งขัน`, 'danger');
        } else {
          addLog(`⚠️ ${p.name} แต้มปัญญาเหลือน้อยกว่า 0 สามารถขายวิชาคืนให้สำนักเรียนได้`, 'warning');
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
    if (rolledDoubles && !currentPlayer.isBankrupt && !currentPlayer.isSkipTurn) {
      addLog(`🎲 ${currentPlayer.name} ได้สิทธิ์ทอยลูกเต๋าอีกครั้ง (ลูกเต๋าออกคู่)`, 'info');
      setGameState((prev) => ({ ...prev, isDiceRolled: false }));
    } else {
      setTimeout(nextTurn, currentPlayer.isAi ? 1000 : 800);
    }
  };

  const nextTurn = () => {
    setActiveQuiz(null);
    setActiveTileDetail(null);
    setActiveEventCard(null);
    setRolledDoubles(false);

    setGameState((prev) => {
      let activePlayers = prev.players.filter((p) => !p.isBankrupt);
      if (activePlayers.length <= 1 && prev.players.length > 1) {
        return {
          ...prev,
          gameStatus: 'game_over',
          winner: activePlayers[0] || prev.players[0],
        };
      }

      let nextIndex = (prev.currentTurnPlayerIndex + 1) % prev.players.length;
      while (prev.players[nextIndex]?.isBankrupt) {
        nextIndex = (nextIndex + 1) % prev.players.length;
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

      return {
        ...prev,
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

    if (currentPlayer && currentPlayer.isAi && !currentPlayer.isBankrupt && !gameState.isDiceRolled && !movingPlayerId && !activeQuiz && !activeEventCard && !activeTileDetail) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurnPlayerIndex, gameState.isDiceRolled, gameState.gameStatus, movingPlayerId, activeQuiz, activeEventCard, activeTileDetail]);

  useEffect(() => {
    if (activeQuiz && gameState.players[gameState.currentTurnPlayerIndex]?.isAi) {
      const timer = setTimeout(() => {
        const isCorrect = Math.random() < 0.75;
        handleAnswerQuiz(isCorrect);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeQuiz]);

  useEffect(() => {
    if (activeEventCard && activeEventCard.player.isAi) {
      const timer = setTimeout(() => {
        setActiveEventCard(null);
        nextTurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeEventCard]);

  useEffect(() => {
    if (activeTileDetail && gameState.players[gameState.currentTurnPlayerIndex]?.isAi) {
      const timer = setTimeout(() => {
        const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];
        if (
          activeTileDetail.ownerId === currentPlayer.id &&
          activeTileDetail.upgradeLevel !== undefined &&
          activeTileDetail.upgradeLevel < 4 &&
          activeTileDetail.upgradeCost &&
          currentPlayer.wisdomPoints >= activeTileDetail.upgradeCost
        ) {
          const tile = activeTileDetail;
          setGameState((prev) => {
            const updatedTiles = prev.tiles.map((t) =>
              t.id === tile.id ? { ...t, upgradeLevel: Math.min(4, (t.upgradeLevel || 0) + 1) as any } : t
            );
            const updatedPlayers = [...prev.players];
            const p = updatedPlayers[prev.currentTurnPlayerIndex];
            if (tile.upgradeCost) p.wisdomPoints -= tile.upgradeCost;
            addLog(`${p.name} อัปเกรดวิชา "${tile.name}" สำเร็จ!`, 'success');
            return { ...prev, tiles: updatedTiles, players: updatedPlayers };
          });
        }
        setActiveTileDetail(null);
        nextTurn();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeTileDetail]);

  const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

  return (
    <div style={{ minHeight: '100vh', padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <GameHeader
        gameState={gameState}
        currentUser={currentUser}
        onOpenNotebook={() => setShowReviewNotebook(true)}
        onRestart={() => setGameState((prev) => ({ ...prev, gameStatus: 'setup' }))}
        onToggleMute={() => setIsMuted(audioManager.toggleMute())}
        isMuted={isMuted}
        onOpenAuthModal={() => {
          setAuthModalTab('login');
          setShowAuthModal(true);
        }}
        onOpenProfileModal={() => setShowProfileModal(true)}
      />

      {gameState.gameStatus === 'playing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', margin: '0 0 4px 0' }}>
              👥 ผู้เข้าแข่งขัน (Players)
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
              onTileClick={(tile) => setActiveTileDetail(tile)}
              onRollDice={handleRollDice}
              isDiceRolled={gameState.isDiceRolled}
              dice={gameState.dice}
              logs={gameState.logs}
            />
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', margin: '0 0 10px 0' }}>
              📚 คลังวิชา & สถิติ
            </h3>
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>วิชามีเจ้าของแล้ว: {gameState.tiles.filter((t) => t.ownerId).length} / 26 วิชา</div>
              <div>คำถามในคลัง: {QUESTION_BANK.length} ข้อ</div>
              <div>คำถามทบทวนสะสม: {gameState.reviewItems.length} ข้อ</div>
              <div>คำถามที่ถามแล้ว: {gameState.askedQuestionIds.length} / {QUESTION_BANK.length} ข้อ</div>
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
        />
      )}

      {activeQuiz && currentPlayer && (
        <QuizModal
          question={activeQuiz.question}
          player={currentPlayer}
          title={activeQuiz.title}
          onAnswer={handleAnswerQuiz}
          canUseFreeCard={currentPlayer.freeAnswerCards > 0}
          onUseFreeCard={() => handleAnswerQuiz(true)}
        />
      )}

      {activeTileDetail && currentPlayer && (
        <TileDetailModal
          tile={activeTileDetail}
          owner={gameState.players.find((p) => p.id === activeTileDetail.ownerId)}
          currentPlayer={currentPlayer}
          onClose={() => {
            setActiveTileDetail(null);
            if (currentPlayer.position === activeTileDetail.id) {
              finishTurnCheck();
            }
          }}
          isCurrentPlayerOnTile={currentPlayer.position === activeTileDetail.id}
          onUpgrade={(tile) => {
            setGameState((prev) => {
              const updatedTiles = prev.tiles.map((t) =>
                t.id === tile.id ? { ...t, upgradeLevel: Math.min(4, (t.upgradeLevel || 0) + 1) as any } : t
              );
              const updatedPlayers = [...prev.players];
              const p = updatedPlayers[prev.currentTurnPlayerIndex];
              if (tile.upgradeCost) p.wisdomPoints -= tile.upgradeCost;
              addLog(`${p.name} อัปเกรดวิชา "${tile.name}" สำเร็จ!`, 'success');
              return { ...prev, tiles: updatedTiles, players: updatedPlayers };
            });
            finishTurnCheck();
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
          onRestart={() => setGameState((prev) => ({ ...prev, gameStatus: 'setup' }))}
        />
      )}

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
        />
      )}

      <ChatWidget />
    </div>
  );
};

export default App;
