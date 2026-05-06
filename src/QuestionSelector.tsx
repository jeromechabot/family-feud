import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from './GameContext';

const QuestionSelector = () => {
  const { allQuestions, currentQuestionNum, goToQuestion, totalQuestions, setGameData } =
    useGame();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<'next' | 'prev' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 1500);
  };

  const handleNext = () => {
    if (currentQuestionNum >= totalQuestions) {
      showError('Déjà à la dernière question (10)');
      return;
    }
    goToQuestion(currentQuestionNum + 1);
    setFlash('next');
    setTimeout(() => setFlash(null), 300);
  };

  const handlePrev = () => {
    if (currentQuestionNum <= 1) {
      showError('Déjà à la première question (1)');
      return;
    }
    goToQuestion(currentQuestionNum - 1);
    setFlash('prev');
    setTimeout(() => setFlash(null), 300);
  };

  // Keyboard handler: n = next, p = prev, Enter = play
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') handleNext();
      else if (e.key === 'p' || e.key === 'P') handlePrev();
      else if (e.key === 'Enter') handlePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handlePlay = () => {
    const answers = allQuestions[currentQuestionNum];
    if (!answers || answers.length === 0) return;

    // Always start fresh (revealed = false)
    setGameData({
      question: `Question ${currentQuestionNum}`,
      answers: answers.map(a => ({ ...a, revealed: false })),
    });
    navigate('/play');
  };

  const answers = allQuestions[currentQuestionNum] || [];
  const isLoading = Object.keys(allQuestions).length === 0;

  return (
    <div style={containerStyle}>
      {/* Background grid lines decoration */}
      <div style={gridDecoStyle} />

      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>LA GUERRE DES CLANS</div>

        {/* Question number display */}
        <div style={questionNumWrapperStyle}>
          <button
            id="btn-prev"
            onClick={handlePrev}
            style={{
              ...arrowBtnStyle,
              opacity: currentQuestionNum <= 1 ? 0.3 : 1,
              transform: flash === 'prev' ? 'scale(0.85)' : 'scale(1)',
            }}
            title="Question précédente (P)"
          >
            ◀
          </button>

          <div style={questionNumStyle}>
            <span style={labelStyle}>QUESTION</span>
            <span
              style={{
                ...numberStyle,
                transform: flash ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              {currentQuestionNum}
            </span>
            <span style={ofTotalStyle}>/ {totalQuestions}</span>
          </div>

          <button
            id="btn-next"
            onClick={handleNext}
            style={{
              ...arrowBtnStyle,
              opacity: currentQuestionNum >= totalQuestions ? 0.3 : 1,
              transform: flash === 'next' ? 'scale(0.85)' : 'scale(1)',
            }}
            title="Question suivante (N)"
          >
            ▶
          </button>
        </div>

        {/* Error toast */}
        {error && <div style={errorStyle}>{error}</div>}

        {/* Answer preview count */}
        {!isLoading && (
          <div style={previewStyle}>
            {answers.length} réponse{answers.length !== 1 ? 's' : ''} chargée
            {answers.length !== 1 ? 's' : ''}
          </div>
        )}
        {isLoading && <div style={previewStyle}>Chargement des questions…</div>}

        {/* Keyboard hint */}
        <div style={hintStyle}>
          <kbd style={kbdStyle}>P</kbd> précédente &nbsp;·&nbsp;
          <kbd style={kbdStyle}>N</kbd> suivante &nbsp;·&nbsp;
          <kbd style={kbdStyle}>Entrée</kbd> jouer
        </div>

        {/* Play button */}
        <button
          id="btn-play"
          onClick={handlePlay}
          disabled={isLoading || answers.length === 0}
          style={{
            ...playBtnStyle,
            opacity: isLoading || answers.length === 0 ? 0.5 : 1,
            cursor: isLoading || answers.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ▶ &nbsp; JOUER
        </button>
      </div>

      {/* Dot progress indicator */}
      <div style={dotsWrapperStyle}>
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            id={`dot-q${n}`}
            onClick={() => goToQuestion(n)}
            title={`Question ${n}`}
            style={{
              ...dotStyle,
              background: n === currentQuestionNum ? '#e5b253' : 'rgba(255,255,255,0.2)',
              transform: n === currentQuestionNum ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'repeating-linear-gradient(to bottom, #111a30, #111a30 4px, #182442 4px, #182442 8px)',
  position: 'relative',
  overflow: 'hidden',
};

const gridDecoStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '60px 60px',
  pointerEvents: 'none',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(11, 28, 61, 0.85)',
  border: '2px solid #e5b253',
  borderRadius: '20px',
  boxShadow: '0 0 60px rgba(229,178,83,0.2), 0 30px 60px rgba(0,0,0,0.6)',
  padding: '3rem 4rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
  zIndex: 2,
  minWidth: '420px',
};

const headerStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 900,
  letterSpacing: '6px',
  color: '#e5b253',
  textTransform: 'uppercase',
  fontFamily: 'sans-serif',
};

const questionNumWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
};

const questionNumStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  letterSpacing: '4px',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: 'sans-serif',
};

const numberStyle: React.CSSProperties = {
  fontSize: '8rem',
  fontWeight: 900,
  lineHeight: 1,
  color: '#ffffff',
  fontFamily: 'sans-serif',
  textShadow: '0 0 40px rgba(229,178,83,0.5)',
  transition: 'transform 0.2s ease',
  display: 'block',
};

const ofTotalStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  color: 'rgba(255,255,255,0.4)',
  fontFamily: 'sans-serif',
};

const arrowBtnStyle: React.CSSProperties = {
  background: 'rgba(229,178,83,0.15)',
  border: '2px solid #e5b253',
  borderRadius: '50%',
  width: '56px',
  height: '56px',
  fontSize: '1.4rem',
  color: '#e5b253',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, background 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const errorStyle: React.CSSProperties = {
  background: 'rgba(233,69,96,0.2)',
  border: '1px solid #e94560',
  borderRadius: '8px',
  padding: '0.5rem 1.2rem',
  color: '#e94560',
  fontSize: '0.85rem',
  fontFamily: 'sans-serif',
};

const previewStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '0.85rem',
  fontFamily: 'sans-serif',
};

const hintStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.35)',
  fontSize: '0.8rem',
  fontFamily: 'sans-serif',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const kbdStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  padding: '1px 6px',
  fontSize: '0.78rem',
  color: '#fff',
};

const playBtnStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  padding: '0.85rem 3rem',
  fontSize: '1.1rem',
  fontWeight: 900,
  letterSpacing: '3px',
  background: 'linear-gradient(135deg, #e5b253 0%, #c98a1a 100%)',
  color: '#111a30',
  border: 'none',
  borderRadius: '50px',
  transition: 'transform 0.15s ease, box-shadow 0.2s',
  boxShadow: '0 8px 25px rgba(229,178,83,0.4)',
  fontFamily: 'sans-serif',
};

const dotsWrapperStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.6rem',
  marginTop: '2rem',
  zIndex: 2,
};

const dotStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 0.2s, background 0.2s',
  padding: 0,
};

export default QuestionSelector;
