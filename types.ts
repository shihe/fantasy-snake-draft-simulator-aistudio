export interface Player {
  rank: number;
  name: string;
  position: string;
  isHighlighted: boolean;
  team?: string;
}

export type DraftBoardData = Record<string, (Player | null)[]>;

export type DataSource = 'Sleeper Standard' | 'Sleeper Half PPR' | 'Sleeper PPR' | 'Sleeper Superflex' | 'Custom';