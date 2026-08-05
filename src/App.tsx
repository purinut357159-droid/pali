import React, { useState, useEffect } from 'react';
import type { GameState, Player, BoardTile, Question, CardEffect, GameMode } from './types/game';
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
import { addWrongQuestionToSRS, markQuestionMastered } from './utils/srsEngine';
import { audioManager } from './utils/audioManager';

export const App: React.FC = () => {
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
    reviewItems: [],
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

    const newPlayers: Player[] = configs.map((cfg, idx) => ({
      id: `p_${idx + 1}`,
      name: cfg.name,
      character: cfg.character,
      wisdomPoints: 2000 + cfg.character.initialWisdomBonus,
      position: 0,
      isAi: cfg.isAi,
      aiDifficulty: 'medium',
      color: playerColors[idx % playerColors.length],
      isSkipTurn: false,
      freeAnswerCards: 0,
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
      reviewItems: [],
    });

    addLog(`🎲 เริ่มเกมบาลีเศรษฐี (${configs.length} ผู้เล่น)!`, 'success');
  };

  const handleRollDice = () => {
    if (gameState.isDiceRolled || gameState.gameStatus !== 'playing') return;

    audioManager.playDiceRoll();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalStep = d1 + d2;

    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

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
    addLog(`${currentPlayer.name} ทอยลูกเต๋าได้ ${d1} + ${d2} = ${totalStep} แต้ม`, 'info');

    const oldPos = currentPlayer.position;
    const newPos = (oldPos + totalStep) % 40;
    const passedStart = newPos < oldPos;

    setTimeout(() => {
      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        const p = updatedPlayers[prev.currentTurnPlayerIndex];
        p.position = newPos;

        if (passedStart) {
          const passBonus = Math.round(200 * p.character.expMultiplier);
          p.wisdomPoints += passBonus;
          addLog(`${p.name} เดินผ่านจุดเริ่มต้น รับโบนัสแต้มปัญญา +${passBonus} แต้ม!`, 'success');
        }

        return { ...prev, players: updatedPlayers };
      });

      handleLandOnTile(newPos);
    }, 600);
  };

  const handleLandOnTile = (tileId: number) => {
    const tile = gameState.tiles[tileId];
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

    if (tile.type === 'subject') {
      const owner = gameState.players.find((p) => p.id === tile.ownerId);

      if (!owner) {
        triggerQuestion(tile, 'buy', `ทดสอบความรู้เพื่อซื้อวิชา "${tile.name}"`);
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
      if (currentPlayer.isAi) {
        setTimeout(nextTurn, 1000);
      }
    }
  };

  const triggerQuestion = (tile: BoardTile, mode: 'buy' | 'rent' | 'quiz' | 'exam', title: string) => {
    const categoryQuestions = QUESTION_BANK.filter(
      (q) => !tile.category || q.category === tile.category
    );
    const pool = categoryQuestions.length > 0 ? categoryQuestions : QUESTION_BANK;
    const selectedQ = pool[Math.floor(Math.random() * pool.length)];

    setActiveQuiz({
      question: selectedQ,
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
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

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
            const fullRent = targetTile.rents ? targetTile.rents[targetTile.upgradeLevel || 0] : 50;
            const discountedRent = Math.floor(fullRent * 0.5);
            p.wisdomPoints = Math.max(0, p.wisdomPoints - discountedRent);
            owner.wisdomPoints += discountedRent;
            addLog(`${p.name} ตอบถูก! จ่ายค่าผ่านทางเพียงครึ่งเดียว (${discountedRent} แต้ม)`, 'info');
          }
        } else if (mode === 'quiz' || mode === 'exam') {
          const reward = mode === 'exam' ? 300 : 150;
          p.wisdomPoints += reward;
          addLog(`${p.name} ผ่านการสอบ รับโบนัสแต้มปัญญา +${reward} แต้ม!`, 'success');
        }
      } else {
        addLog(`${p.name} ตอบคำถามบาลีไม่ถูกต้อง`, 'danger');
        newReviewItems = addWrongQuestionToSRS(prev.reviewItems, question);

        if (mode === 'rent' && targetTile) {
          const owner = prev.players.find((item) => item.id === targetTile.ownerId);
          if (owner) {
            const fullRent = targetTile.rents ? targetTile.rents[targetTile.upgradeLevel || 0] : 50;
            p.wisdomPoints = Math.max(0, p.wisdomPoints - fullRent);
            owner.wisdomPoints += fullRent;
            addLog(`${p.name} ตอบผิด! จ่ายค่าผ่านทางเต็มจำนวน (${fullRent} แต้ม)`, 'danger');
          }
        }
      }

      return { ...prev, players: updatedPlayers, reviewItems: newReviewItems };
    });

    setActiveQuiz(null);
    if (currentPlayer.isAi) {
      setTimeout(nextTurn, 1000);
    }
  };

  const nextTurn = () => {
    setActiveQuiz(null);
    setActiveTileDetail(null);
    setActiveEventCard(null);

    setGameState((prev) => {
      let nextIndex = (prev.currentTurnPlayerIndex + 1) % prev.players.length;
      let nextRound = prev.currentRound;

      if (nextIndex === 0) {
        nextRound += 1;
        addLog(`--- เริ่มรอบที่ ${nextRound} ---`, 'info');
      }

      const isGameOver = nextRound > prev.maxRounds;
      let winner: Player | null = null;

      if (isGameOver) {
        const sorted = [...prev.players].sort((a, b) => b.wisdomPoints - a.wisdomPoints);
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

  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;
    const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

    if (currentPlayer && currentPlayer.isAi && !gameState.isDiceRolled && !activeQuiz && !activeEventCard && !activeTileDetail) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurnPlayerIndex, gameState.isDiceRolled, gameState.gameStatus, activeQuiz, activeEventCard, activeTileDetail]);

  useEffect(() => {
    if (activeQuiz && gameState.players[gameState.currentTurnPlayerIndex]?.isAi) {
      const timer = setTimeout(() => {
        const isCorrect = Math.random() < 0.7;
        handleAnswerQuiz(isCorrect);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeQuiz]);

  const currentPlayer = gameState.players[gameState.currentTurnPlayerIndex];

  return (
    <div style={{ minHeight: '100vh', padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <GameHeader
        gameState={gameState}
        onOpenNotebook={() => setShowReviewNotebook(true)}
        onRestart={() => setGameState((prev) => ({ ...prev, gameStatus: 'setup' }))}
        onToggleMute={() => setIsMuted(audioManager.toggleMute())}
        isMuted={isMuted}
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
            </div>
          </div>
        </div>
      )}

      {gameState.gameStatus === 'setup' && (
        <CharacterSelectModal onStartGame={handleStartGame} />
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
          onClose={() => setActiveTileDetail(null)}
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
            if (currentPlayer.isAi) setTimeout(nextTurn, 1000);
          }}
        />
      )}

      {activeEventCard && (
        <EventModal
          card={activeEventCard.card}
          player={activeEventCard.player}
          onClose={() => {
            setActiveEventCard(null);
            if (currentPlayer.isAi) setTimeout(nextTurn, 1000);
          }}
        />
      )}

      {showReviewNotebook && (
        <ReviewNotebook
          reviewItems={gameState.reviewItems}
          onClose={() => setShowReviewNotebook(false)}
          onMasterQuestion={(qId) => {
            setGameState((prev) => ({
              ...prev,
              reviewItems: markQuestionMastered(prev.reviewItems, qId),
            }));
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
    </div>
  );
};

export default App;
