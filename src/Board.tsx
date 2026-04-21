import React, { useEffect, useState, useRef } from 'react';
import { useGame } from './GameContext';
import { useNavigate } from 'react-router-dom';
import AnswerBox from './AnswerBox';
import { playBellSound, playBuzzerSound } from './audio';
import confetti from 'canvas-confetti';

const Board = () => {
  const { gameData, setGameData } = useGame();
  const navigate = useNavigate();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftStrikes, setLeftStrikes] = useState(0);
  const [rightStrikes, setRightStrikes] = useState(0);
  
  const boardRef = useRef<HTMLDivElement>(null);
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (!gameData) {
      navigate('/');
    }
  }, [gameData, navigate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!gameData) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 8) {
        const ans = gameData.answers[num - 1];
        if (ans && !ans.revealed) {
          playBellSound();
          setGameData({
            ...gameData,
            answers: gameData.answers.map(a => 
              a.id === ans.id ? { ...a, revealed: true } : a
            )
          });
        }
      } else if (e.key === 'ArrowLeft') {
        setLeftStrikes(prev => {
          if (prev < 3) playBuzzerSound();
          return prev === 3 ? 0 : prev + 1;
        });
      } else if (e.key === 'ArrowRight') {
        setRightStrikes(prev => {
          if (prev < 3) playBuzzerSound();
          return prev === 3 ? 0 : prev + 1;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameData, setGameData]);

  useEffect(() => {
    if (gameData && gameData.answers.length > 0) {
      const allRevealed = gameData.answers.every(a => a.revealed);
      if (allRevealed && !hasCelebrated.current) {
        hasCelebrated.current = true;
        
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10000';
        
        if (boardRef.current) {
          boardRef.current.appendChild(canvas);
        } else {
          document.body.appendChild(canvas);
        }
        
        const myConfetti = confetti.create(canvas, {
          resize: true,
          useWorker: true
        });

        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          myConfetti({
            particleCount,
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
            colors: ['#e5b253', '#e94560', '#ffffff', '#1098f7']
          });
        }, 250);

      } else if (!allRevealed) {
        hasCelebrated.current = false;
      }
    }
  }, [gameData]);

  if (!gameData) return null;

  const handleReveal = (id: string) => {
    setGameData({
      ...gameData,
      answers: gameData.answers.map(ans => 
        ans.id === id ? { ...ans, revealed: true } : ans
      )
    });
  };

  const handleReset = () => {
    setGameData({
      ...gameData,
      answers: gameData.answers.map(ans => ({ ...ans, revealed: false }))
    });
    setLeftStrikes(0);
    setRightStrikes(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      boardRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const paddedAnswers = Array.from({ length: 8 }).map((_, i) => gameData.answers[i] || null);
  const leftColumn = paddedAnswers.slice(0, 4);
  const rightColumn = paddedAnswers.slice(4, 8);

  const totalPoints = gameData.answers
    .filter(a => a.revealed)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  return (
    <div ref={boardRef} style={boardContainerStyle}>
      {!isFullscreen && (
        <div style={topControlsStyle}>
          <button onClick={toggleFullscreen} style={btnStyle}>Plein Écran</button>
          <button onClick={handleReset} style={btnStyle}>Réinitialiser</button>
          <button onClick={() => navigate('/')} style={{ ...btnStyle, background: '#e94560', border: 'none' }}>Modifier le jeu</button>
        </div>
      )}

      {/* Strikes layer */}
      <div style={strikesOverlayStyle}>
        <div style={{ ...strikeContainerStyle, justifyContent: 'flex-start' }}>
          {Array.from({ length: leftStrikes }).map((_, i) => <span key={`l-${i}`} style={xStyle}>X</span>)}
        </div>
        <div style={{ ...strikeContainerStyle, justifyContent: 'flex-end' }}>
          {Array.from({ length: rightStrikes }).map((_, i) => <span key={`r-${i}`} style={xStyle}>X</span>)}
        </div>
      </div>

      <div style={gameAreaStyle}>
        {/* Total Points */}
        <div style={totalOvalStyle}>
          {totalPoints}
        </div>

        {/* Board Grid */}
        <div style={gridStyle}>
          <div style={columnStyle}>
            {leftColumn.map((ans, idx) => (
              <AnswerBox 
                key={ans ? ans.id : `empty-l-${idx}`} 
                answer={ans} 
                index={idx} 
                onReveal={handleReveal} 
              />
            ))}
          </div>
          
          <div style={columnStyle}>
            {rightColumn.map((ans, idx) => (
              <AnswerBox 
                key={ans ? ans.id : `empty-r-${idx}`} 
                answer={ans} 
                index={idx + 4} 
                onReveal={handleReveal} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const boardContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center', 
  width: '100%',
  height: '100%',
  minHeight: '100vh',
  background: 'repeating-linear-gradient(to bottom, #111a30, #111a30 4px, #182442 4px, #182442 8px)',
  fontFamily: 'sans-serif',
  position: 'relative'
};

const topControlsStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  display: 'flex',
  gap: '1rem',
  zIndex: 10
};

const btnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(0,0,0,0.5)',
  color: '#fff',
  border: '1px solid #fff',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const strikesOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: '3rem',
  left: 0,
  right: 0,
  padding: '0 5rem',
  display: 'flex',
  justifyContent: 'space-between',
  pointerEvents: 'none', 
  zIndex: 5
};

const strikeContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  width: '300px', 
};

const xStyle: React.CSSProperties = {
  color: '#d60000',
  fontSize: '8rem',
  fontWeight: '900',
  fontFamily: 'sans-serif',
  lineHeight: 1,
  textShadow: '3px 3px 6px rgba(0,0,0,0.9), -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff'
};

const gameAreaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '1000px',
  padding: '2rem',
  zIndex: 2
};

const totalOvalStyle: React.CSSProperties = {
  width: '200px',
  height: '110px',
  borderRadius: '50%',
  border: '3px solid #e5b253',
  background: 'radial-gradient(ellipse at center, #2b4b7c 0%, #132446 100%)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '4.5rem',
  fontWeight: 'bold',
  color: '#e5e5e5',
  boxShadow: '0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.8)',
  position: 'relative',
  marginBottom: '4rem'
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  width: '100%',
};

const columnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

export default Board;
