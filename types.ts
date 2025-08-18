export interface Player {
  rank: number;
  name: string;
  position: string;
  isHighlighted: boolean;
}

export type DraftBoardData = Record<string, (Player | null)[]>;

export type DataSource = 'Sleeper' | 'Yahoo' | 'ESPN' | 'Custom';