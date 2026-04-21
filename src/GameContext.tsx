import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { QuestionData } from './types';

interface GameContextType {
  gameData: QuestionData | null;
  setGameData: (data: QuestionData | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameData, setGameData] = useState<QuestionData | null>(() => {
    const saved = localStorage.getItem('familyFeudData');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetGameData = (data: QuestionData | null) => {
    setGameData(data);
    if (data) {
      localStorage.setItem('familyFeudData', JSON.stringify(data));
    } else {
      localStorage.removeItem('familyFeudData');
    }
  };

  return (
    <GameContext.Provider value={{ gameData, setGameData: handleSetGameData }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
