export interface Answer {
  id: string;
  text: string;
  points: number;
  revealed: boolean;
}

export interface QuestionData {
  question: string;
  answers: Answer[];
}
