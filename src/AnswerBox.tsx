import React from 'react';
import { motion } from 'framer-motion';
import type { Answer } from './types';
import { playBellSound } from './audio';

interface AnswerBoxProps {
  answer: Answer | null;
  index: number;
  onReveal: (id: string) => void;
}

const AnswerBox: React.FC<AnswerBoxProps> = ({ answer, index, onReveal }) => {
  const handleClick = () => {
    if (answer && !answer.revealed) {
      onReveal(answer.id);
    }
  };

  const isEmpty = !answer;
  const isRevealed = answer?.revealed;

  return (
    <div style={containerStyle} onClick={handleClick}>
      <motion.div
        style={flipBoxStyle}
        initial={false}
        animate={{ rotateX: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 80, damping: 15 }}
      >
        {/* Front side (Hidden/Empty) */}
        <div style={{ ...faceStyle, ...frontFaceStyle }}>
          <div style={leftPartStyle}>
             {!isEmpty && <span style={numberStyle}>{index + 1}</span>}
          </div>
          <div style={rightPartStyle}></div>
        </div>

        {/* Back side (Revealed) */}
        <div style={{ ...faceStyle, ...backFaceStyle }}>
          <div style={leftPartStyleRevealed}>
             {!isEmpty && <span style={textStyle}>{answer.text}</span>}
          </div>
          <div style={revealedRightPartStyle}>
             {!isEmpty && <span style={pointsStyle}>{answer.points}</span>}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const goldBorderColor = '#e5b253';
const boxGradient = 'linear-gradient(to bottom, #1d3e70, #0a1d3d)';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '65px',
  perspective: '1200px',
  cursor: 'pointer',
};

const flipBoxStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  transformStyle: 'preserve-3d',
  boxShadow: '0 8px 15px rgba(0,0,0,0.6)',
  borderRadius: '4px'
};

const faceStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  backfaceVisibility: 'hidden',
  display: 'flex',
  borderRadius: '4px',
  border: `2px solid ${goldBorderColor}`,
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const frontFaceStyle: React.CSSProperties = {
  background: boxGradient,
};

const backFaceStyle: React.CSSProperties = {
  background: boxGradient,
  transform: 'rotateX(180deg)'
};

const leftPartStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 20px',
  position: 'relative',
};

const leftPartStyleRevealed: React.CSSProperties = {
  ...leftPartStyle,
  justifyContent: 'flex-start',
};

const numberStyle: React.CSSProperties = {
  fontSize: '2.2rem',
  fontWeight: 'bold',
  color: '#e5e5e5',
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
};

const textStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 'bold',
  color: 'white',
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const rightPartStyle: React.CSSProperties = {
  width: '65px',
  borderLeft: `2px solid ${goldBorderColor}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.2)',
};

const revealedRightPartStyle: React.CSSProperties = {
  ...rightPartStyle,
  background: 'linear-gradient(to bottom, #d49f48, #c68532)',
};

const pointsStyle: React.CSSProperties = {
  fontSize: '2.2rem',
  fontWeight: 'bold',
  color: '#000',
  textShadow: '1px 1px 0px rgba(255,255,255,0.3)',
};

export default AnswerBox;
