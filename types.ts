export interface Player {
  rank: number;
  name: string;
  position: string;
  isHighlighted: boolean;
  team?: string;
}

export type DraftBoardData = Record<string, (Player | null)[]>;

export type DataSource = string;

export interface CustomRanking {
  id: string;
  name: string;
  text: string;
  lastUpdated: string;
}