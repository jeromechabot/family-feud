import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from './GameContext';
import type { Answer } from './types';

const Creator = () => {
  const { gameData, setGameData } = useGame();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(gameData?.question || '');
  const [answers, setAnswers] = useState<Answer[]>(
    gameData?.answers || Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), text: '', points: 0, revealed: false }))
  );

  const handleUpdateAnswer = (id: string, field: keyof Answer, value: string | number) => {
    setAnswers(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleAddAnswer = () => {
    if (answers.length < 8) {
      setAnswers([...answers, { id: crypto.randomUUID(), text: '', points: 0, revealed: false }]);
    }
  };

  const handleRemoveAnswer = (id: string) => {
    setAnswers(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validAnswers = answers.filter(a => a.text.trim() !== '');
    if (validAnswers.length === 0) {
      alert('Veuillez fournir au moins une réponse.');
      return;
    }
    setGameData({ question, answers: validAnswers.map(a => ({ ...a, revealed: false })) });
    navigate('/play');
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Configuration du jeu</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={inputGroup}>
            <label style={labelStyle}>Question :</label>
            <input 
              type="text" 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="ex. Nommez quelque chose que vous apportez à la plage"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={labelStyle}>Réponses (Max 8) :</label>
              <button 
                type="button" 
                onClick={handleAddAnswer} 
                disabled={answers.length >= 8}
                style={addButtonStyle}
              >
                + Ajouter une réponse
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {answers.map((ans, index) => (
                <div key={ans.id} style={answerRowRow}>
                  <span style={rankStyle}>{index + 1}</span>
                  <input 
                    type="text" 
                    value={ans.text} 
                    onChange={e => handleUpdateAnswer(ans.id, 'text', e.target.value)} 
                    placeholder="Texte de la réponse"
                    style={{ ...inputStyle, flex: 3 }}
                  />
                  <input 
                    type="number" 
                    value={ans.points || ''} 
                    onChange={e => handleUpdateAnswer(ans.id, 'points', parseInt(e.target.value) || 0)} 
                    placeholder="Pts"
                    style={{ ...inputStyle, flex: 1, textAlign: 'center' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveAnswer(ans.id)}
                    style={removeButtonStyle}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" style={submitBtnStyle}>Commencer le jeu</button>
        </form>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '3rem 1rem',
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '2rem',
  width: '100%',
  maxWidth: '600px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const titleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: '2rem',
  color: '#e94560',
  fontSize: '2rem',
  textAlign: 'center'
};

const inputGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const labelStyle: React.CSSProperties = {
  fontWeight: '600',
  color: '#a5a5b0',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const inputStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(0, 0, 0, 0.2)',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const answerRowRow: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center'
};

const rankStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: '#e94560',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  marginLeft: '-10px'
};

const addButtonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem'
};

const removeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #ff4757',
  color: '#ff4757',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  fontSize: '1.2rem',
  lineHeight: '1'
};

const submitBtnStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '1rem',
  background: 'linear-gradient(90deg, #e94560 0%, #d83450 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 10px 20px -5px rgba(233, 69, 96, 0.4)',
  transition: 'transform 0.2s',
};

export default Creator;
