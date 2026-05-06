import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AllQuestions, QuestionData } from './types';
import { allQuestionsData } from './parseQuestions';

const TOTAL_QUESTIONS = 10;

interface GameContextType {
  gameData: QuestionData | null;
  setGameData: (data: QuestionData | null) => void;
  allQuestions: AllQuestions;
  currentQuestionNum: number;
  goToQuestion: (num: number) => void;
  totalQuestions: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  // CSV is parsed at module load time — no async needed
  const [allQuestions] = useState<AllQuestions>(allQuestionsData);
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);

  // gameData holds the active question being played on the Board
  const [gameData, setGameDataState] = useState<QuestionData | null>(() => {
    const saved = localStorage.getItem('familyFeudData');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetGameData = (data: QuestionData | null) => {
    setGameDataState(data);
    if (data) {
      localStorage.setItem('familyFeudData', JSON.stringify(data));
    } else {
      localStorage.removeItem('familyFeudData');
    }
  };

  /** Navigate to a question number (1-based), with boundary validation */
  const goToQuestion = (num: number) => {
    if (num < 1 || num > TOTAL_QUESTIONS) return;
    setCurrentQuestionNum(num);
  };

  return (
    <GameContext.Provider
      value={{
        gameData,
        setGameData: handleSetGameData,
        allQuestions,
        currentQuestionNum,
        goToQuestion,
        totalQuestions: TOTAL_QUESTIONS,
      }}
    >
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
