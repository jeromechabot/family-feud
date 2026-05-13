import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playBellSound, playBuzzerSound, playDuplicateSound } from './audio';
import { useGame } from './GameContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LightningCell {
  state: 'hidden' | 'correct' | 'miss';
  text: string;
  points: number;
}

interface ParticipantState {
  name: string;
  cells: LightningCell[];
  activeRow: number; // 0-4, which row is currently active
}

const ROWS = 5;

function makeParticipant(name: string): ParticipantState {
  return {
    name,
    cells: Array.from({ length: ROWS }, () => ({ state: 'hidden', text: '', points: 0 })),
    activeRow: 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const LightningBoard: React.FC = () => {
  const { allQuestions } = useGame();
  const navigate = useNavigate();
  const boardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lightning round covers questions 6-10 (row 0 = Q6 … row 4 = Q10)
  const LIGHTNING_START = 6;
  const TIMER_DURATIONS: [number, number] = [20, 25];

  // Which column is being controlled: 0 = left, 1 = right
  const [activeCol, setActiveCol] = useState<0 | 1>(0);

  const [participants, setParticipants] = useState<[ParticipantState, ParticipantState]>([
    makeParticipant('Joueur 1'),
    makeParticipant('Joueur 2'),
  ]);

  // timers[col] = { timeLeft, running }
  const [timers, setTimers] = useState([
    { timeLeft: TIMER_DURATIONS[0], running: false },
    { timeLeft: TIMER_DURATIONS[1], running: false },
  ]);
  // Absolute wall-clock end timestamps (null = not running)
  const endTimeRef = useRef<[number | null, number | null]>([null, null]);
  // Track whether the buzzer has already fired for each timer (avoid double-trigger)
  const buzzedRef = useRef<[boolean, boolean]>([false, false]);
  // Confetti guard
  const hasCelebrated = useRef(false);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Countdown tick — polls every 100ms against wall-clock end timestamp
  // so the buzzer fires within ~100ms of the real end, not up to 1000ms late.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setTimers(prev => {
        let needsUpdate = false;
        const next = prev.map((t, col) => {
          if (!t.running || endTimeRef.current[col] === null) return t;
          const msLeft = endTimeRef.current[col]! - now;
          const secsLeft = Math.max(0, Math.ceil(msLeft / 1000));
          if (secsLeft === t.timeLeft) return t; // no visual change yet
          needsUpdate = true;
          if (secsLeft === 0) {
            endTimeRef.current[col] = null;
            if (!buzzedRef.current[col]) {
              buzzedRef.current[col] = true;
              playBuzzerSound();
            }
            return { ...t, timeLeft: 0, running: false };
          }
          return { ...t, timeLeft: secsLeft };
        });
        return needsUpdate ? (next as typeof prev) : prev;
      });
    }, 100);
    return () => clearInterval(id);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) boardRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  // Keyboard handler: 1-5 = reveal answer, x/X = miss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 5) {
        revealCorrect(num);
      } else if (e.key === 'x' || e.key === 'X') {
        revealMiss();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActiveCol(prev => (prev === 0 ? 1 : 0));
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 'd' || e.key === 'D') {
        playDuplicateSound();
      } else if (e.key === 't' || e.key === 'T') {
        const col = activeCol;
        setTimers(prev => {
          const next = [...prev] as typeof prev;
          if (next[col].running) {
            // Pause: clear end timestamp, keep remaining seconds
            endTimeRef.current[col] = null;
            next[col] = { ...next[col], running: false };
          } else if (next[col].timeLeft === 0) {
            // Restart from full duration
            buzzedRef.current[col] = false;
            endTimeRef.current[col] = Date.now() + TIMER_DURATIONS[col] * 1000;
            next[col] = { timeLeft: TIMER_DURATIONS[col], running: true };
          } else {
            // Resume from remaining seconds
            endTimeRef.current[col] = Date.now() + next[col].timeLeft * 1000;
            next[col] = { ...next[col], running: true };
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [participants, activeCol, allQuestions]);

  // Reveal a correct answer: rank 1-5 picks the answer from the question mapped to the current active row
  const revealCorrect = (rank: number) => {
    const col = activeCol;
    const participant = participants[col];
    const row = participant.activeRow;
    if (row >= ROWS) return; // column is full

    const questionAnswers = allQuestions[LIGHTNING_START + row] || [];
    const answer = questionAnswers[rank - 1];
    if (!answer) return;

    playBellSound();

    setParticipants(prev => {
      const next = prev.map(p => ({ ...p, cells: [...p.cells] })) as [ParticipantState, ParticipantState];
      next[col].cells[row] = { state: 'correct', text: answer.text, points: answer.points };
      if (row + 1 < ROWS) {
        next[col].activeRow = row + 1;
      } else {
        next[col].activeRow = ROWS; // done
      }
      return next;
    });
  };

  // Reveal a miss (X)
  const revealMiss = () => {
    playBuzzerSound()
    const col = activeCol;
    const participant = participants[col];
    const row = participant.activeRow;
    if (row >= ROWS) return;

    setParticipants(prev => {
      const next = prev.map(p => ({ ...p, cells: [...p.cells] })) as [ParticipantState, ParticipantState];
      next[col].cells[row] = { state: 'miss', text: '---', points: 0 };
      if (row + 1 < ROWS) {
        next[col].activeRow = row + 1;
      } else {
        next[col].activeRow = ROWS;
      }
      return next;
    });
  };

  const handleReset = () => {
    setParticipants([makeParticipant('Joueur 1'), makeParticipant('Joueur 2')]);
    setActiveCol(0);
    endTimeRef.current = [null, null];
    buzzedRef.current = [false, false];
    hasCelebrated.current = false;
    setTimers([
      { timeLeft: TIMER_DURATIONS[0], running: false },
      { timeLeft: TIMER_DURATIONS[1], running: false },
    ]);
  };

  const totalFor = (col: 0 | 1) =>
    participants[col].cells.reduce((sum, c) => sum + c.points, 0);

  // Confetti when combined total reaches 200
  useEffect(() => {
    const combined = totalFor(0) + totalFor(1);
    if (combined >= 200 && !hasCelebrated.current) {
      hasCelebrated.current = true;
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10000';
      document.body.appendChild(canvas);
      const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
      const duration = 3000;
      const end = Date.now() + duration;
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
          return;
        }
        const timeLeft = end - Date.now();
        myConfetti({
          particleCount: 50 * (timeLeft / duration),
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
          colors: ['#e5b253', '#e94560', '#ffffff', '#1098f7'],
        });
      }, 250);
    }
  }, [participants]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={boardRef} style={boardBgStyle}>
      {/* Controls bar */}
      {!isFullscreen && (
        <div style={controlsBarStyle}>
          <button onClick={() => navigate('/')} style={ctrlBtnStyle}>← Retour</button>
          <button onClick={handleReset} style={ctrlBtnStyle}>Réinitialiser</button>
          <button onClick={toggleFullscreen} style={ctrlBtnStyle}>Plein Écran</button>
        </div>
      )}

      <div style={pageStyle}>
        {/* Oval timer */}
        {(() => {
          const t = timers[activeCol];
          const isLow = t.timeLeft <= 5 && t.timeLeft > 0;
          const isDone = t.timeLeft === 0;
          const accent = isDone ? '#e94560' : isLow ? '#ff8c42' : '#e5e5e5';
          const borderColor = isDone ? '#e94560' : isLow ? '#ff8c42' : '#e5b253';
          return (
            <div style={bigTimerWrapStyle}>
              <div style={{
                ...timerOvalStyle,
                border: `3px solid ${borderColor}`,
                boxShadow: isDone
                  ? '0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.8), 0 0 20px rgba(233,69,96,0.4)'
                  : isLow
                    ? '0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.8), 0 0 20px rgba(255,140,66,0.3)'
                    : '0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.8)',
              }}>
                <span style={{ color: accent, fontSize: '4.5rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>
                  {t.timeLeft}
                </span>
              </div>
              <div style={bigTimerLabelStyle}>
                {participants[activeCol].name}
                <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                  {isDone ? '— TERMINÉ' : t.running ? '▶' : '⏸'}
                </span>
              </div>
              <div style={titleStyle}>RONDE FINALE</div>
            </div>
          );
        })()}

        {/* Column selector tabs */}
        <div style={tabRowStyle}>
          {(['Joueur 1', 'Joueur 2'] as const).map((label, i) => (
            <button
              key={i}
              onClick={() => setActiveCol(i as 0 | 1)}
              style={{
                ...tabBtnStyle,
                background: activeCol === i
                  ? 'linear-gradient(135deg, #e5b253 0%, #c98a1a 100%)'
                  : 'rgba(255,255,255,0.07)',
                color: activeCol === i ? '#111a30' : 'rgba(255,255,255,0.6)',
                boxShadow: activeCol === i ? '0 4px 20px rgba(229,178,83,0.4)' : 'none',
                fontWeight: activeCol === i ? 900 : 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Keyboard hint */}
        <div style={kbdHintStyle}>
          <span style={kbdKeyStyle}>1</span>
          <span style={kbdSepStyle}>–</span>
          <span style={kbdKeyStyle}>5</span>
          <span style={kbdLabelStyle}>Révéler</span>
          <span style={kbdDivStyle}>·</span>
          <span style={kbdKeyStyle}>X</span>
          <span style={kbdLabelStyle}>Erreur</span>
          <span style={kbdDivStyle}>·</span>
          <span style={kbdKeyStyle}>Tab</span>
          <span style={kbdLabelStyle}>Changer joueur</span>
          <span style={kbdDivStyle}>·</span>
          <span style={kbdKeyStyle}>T</span>
          <span style={kbdLabelStyle}>Chrono</span>
          <span style={kbdDivStyle}>·</span>
          <span style={kbdKeyStyle}>R</span>
          <span style={kbdLabelStyle}>Réinitialiser</span>
          <span style={kbdDivStyle}>·</span>
          <span style={kbdKeyStyle}>D</span>
          <span style={kbdLabelStyle}>Doublon</span>
        </div>

        {/* Two-column board */}
        <div style={gridStyle}>
          {([0, 1] as const).map(col => {
            const p = participants[col];
            const isActive = activeCol === col;

            return (
              <div
                key={col}
                style={{
                  ...columnWrapStyle,
                  borderColor: isActive ? '#e5b253' : 'rgba(255,255,255,0.1)',
                  boxShadow: isActive
                    ? '0 0 30px rgba(229,178,83,0.25), 0 8px 30px rgba(0,0,0,0.5)'
                    : '0 8px 30px rgba(0,0,0,0.4)',
                }}
              >

                {/* Column header */}
                <div style={{
                  ...colHeaderStyle,
                  background: isActive
                    ? 'linear-gradient(135deg, #e5b253 0%, #c98a1a 100%)'
                    : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#111a30' : 'rgba(255,255,255,0.6)',
                }}>
                  {p.name}
                  {isActive && <span style={activeTagStyle}>ACTIF</span>}
                </div>

                {/* Rows */}
                <div style={cellsContainerStyle}>
                  {p.cells.map((cell, rowIdx) => {
                    const isActiveRow = isActive && rowIdx === p.activeRow;
                    const isRevealed = cell.state !== 'hidden';
                    const isMiss = cell.state === 'miss';

                    return (
                      <div
                        key={rowIdx}
                        style={{
                          ...cellRowStyle,
                          background: isActiveRow
                            ? 'rgba(229,178,83,0.15)'
                            : isRevealed
                              ? isMiss
                                ? 'rgba(233,69,96,0.12)'
                                : 'rgba(16,152,247,0.1)'
                              : 'transparent',
                          borderColor: isActiveRow
                            ? 'rgba(229,178,83,0.6)'
                            : 'rgba(255,255,255,0.06)',
                          boxShadow: isActiveRow
                            ? 'inset 0 0 12px rgba(229,178,83,0.08)'
                            : 'none',
                        }}
                      >
                        {/* Row number badge */}
                        <div style={{
                          ...rowNumStyle,
                          background: isActiveRow
                            ? '#e5b253'
                            : isMiss
                              ? '#e94560'
                              : isRevealed
                                ? '#1098f7'
                                : 'rgba(255,255,255,0.1)',
                          color: isActiveRow || isMiss || isRevealed ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}>
                          {rowIdx + 1}
                        </div>

                        {/* Answer text */}
                        <div style={cellTextAreaStyle}>
                          <AnimatePresence mode="wait">
                            {isRevealed ? (
                              <motion.span
                                key="revealed"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35 }}
                                style={{
                                  ...cellAnswerTextStyle,
                                  color: isMiss ? '#e94560' : '#ffffff',
                                  fontStyle: isMiss ? 'italic' : 'normal',
                                }}
                              >
                                {cell.text}
                              </motion.span>
                            ) : (
                              <motion.span
                                key="hidden"
                                style={cellHiddenTextStyle}
                              >
                                {isActiveRow ? '▶ En attente…' : ''}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Points badge */}
                        <div style={{
                          ...pointsBadgeStyle,
                          background: isMiss
                            ? 'rgba(233,69,96,0.25)'
                            : isRevealed
                              ? 'linear-gradient(135deg, #d49f48, #c68532)'
                              : 'rgba(255,255,255,0.04)',
                          color: isMiss ? '#e94560' : isRevealed ? '#000' : 'transparent',
                          boxShadow: isRevealed && !isMiss
                            ? '0 2px 8px rgba(0,0,0,0.4)'
                            : 'none',
                        }}>
                          {isRevealed ? cell.points : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Combined total */}
        {(() => {
          const combined = totalFor(0) + totalFor(1);
          return (
            <div style={combinedTotalStyle}>
              <span style={combinedTotalLabelStyle}>TOTAL</span>
              <motion.span
                key={combined}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                style={combinedTotalValueStyle}
              >
                {combined}
              </motion.span>
            </div>
          );
        })()}

      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const boardBgStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  background: 'repeating-linear-gradient(to bottom, #111a30, #111a30 4px, #182442 4px, #182442 8px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontFamily: 'sans-serif',
  position: 'relative',
};

const controlsBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  display: 'flex',
  gap: '0.75rem',
  zIndex: 10,
};

const ctrlBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.9rem',
  background: 'rgba(0,0,0,0.5)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '1100px',
  padding: '4rem 2rem 2rem',
  gap: '1.5rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 900,
  color: '#e5b253',
  letterSpacing: '6px',
  textTransform: 'uppercase',
  textShadow: '0 0 30px rgba(229,178,83,0.5)',
};


const tabRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const tabBtnStyle: React.CSSProperties = {
  padding: '0.6rem 2.5rem',
  border: '2px solid #e5b253',
  borderRadius: '50px',
  fontSize: '0.9rem',
  letterSpacing: '2px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textTransform: 'uppercase',
};

const kbdHintStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  opacity: 0.6,
};

const kbdKeyStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '5px',
  padding: '2px 8px',
  fontSize: '0.8rem',
  color: '#fff',
  fontFamily: 'monospace',
};

const kbdLabelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'rgba(255,255,255,0.55)',
};

const kbdSepStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'rgba(255,255,255,0.4)',
};

const kbdDivStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'rgba(255,255,255,0.25)',
  margin: '0 0.2rem',
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  width: '100%',
};

const columnWrapStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: '16px',
  border: '2px solid',
  overflow: 'hidden',
  background: 'rgba(10,29,61,0.75)',
  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
};

const colHeaderStyle: React.CSSProperties = {
  padding: '0.85rem 1.25rem',
  fontWeight: 900,
  fontSize: '1rem',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  transition: 'background 0.25s ease, color 0.25s ease',
};

const activeTagStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  padding: '2px 8px',
  background: 'rgba(0,0,0,0.25)',
  borderRadius: '50px',
  letterSpacing: '1px',
};

const cellsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
};

const cellRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '64px',
  borderBottom: '1px solid',
  transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  position: 'relative',
};

const rowNumStyle: React.CSSProperties = {
  width: '40px',
  minWidth: '40px',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '1.1rem',
  transition: 'background 0.2s ease, color 0.2s ease',
};

const cellTextAreaStyle: React.CSSProperties = {
  flex: 1,
  padding: '0 1rem',
  overflow: 'hidden',
};

const cellAnswerTextStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block',
};

const cellHiddenTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'rgba(229,178,83,0.5)',
  letterSpacing: '1px',
  fontStyle: 'italic',
};

const pointsBadgeStyle: React.CSSProperties = {
  width: '60px',
  minWidth: '60px',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '1.4rem',
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  transition: 'background 0.25s ease, color 0.25s ease',
};

const combinedTotalStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
  width: '100%',
  padding: '1rem 2rem',
  background: 'rgba(0,0,0,0.45)',
  borderRadius: '12px',
  border: '2px solid rgba(229,178,83,0.35)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
};

const combinedTotalLabelStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '5px',
  color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase',
};

const combinedTotalValueStyle: React.CSSProperties = {
  fontSize: '3rem',
  fontWeight: 900,
  color: '#e5b253',
  textShadow: '0 0 30px rgba(229,178,83,0.5)',
  display: 'inline-block',
};


const timerOvalStyle: React.CSSProperties = {
  width: '220px',
  height: '120px',
  borderRadius: '50%',
  border: '3px solid #e5b253',
  background: 'radial-gradient(ellipse at center, #2b4b7c 0%, #132446 100%)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.8)',
};

const bigTimerWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
};

const bigTimerLabelStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '3px',
  color: 'rgba(255,255,255,0.7)',
  textTransform: 'uppercase',
};

export default LightningBoard;


