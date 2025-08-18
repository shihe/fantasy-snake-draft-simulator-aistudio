
import React, { useState, useMemo, useEffect } from 'react';
import type { Player, DraftBoardData, DataSource } from './types';
import Controls from './components/Controls';
import DraftBoard from './components/DraftBoard';
import { SLEEPER_PLAYER_LIST, YAHOO_PLAYER_LIST, ESPN_PLAYER_LIST } from './constants';

const parsePlayerText = (text: string): { players: Player[]; error: string | null } => {
  const players: Player[] = [];
  const lines = text.trim().split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    let processedLine = line.trim();
    const isHighlighted = processedLine.endsWith('*');
    if (isHighlighted) {
      processedLine = processedLine.slice(0, -1).trim();
    }
    
    const parts = processedLine.split(/\s+/);
    
    if (parts.length < 3) {
      return { players: [], error: `Malformed line detected. Each line must have rank, name, and position. Problem line: "${line}"` };
    }
    
    const rank = parseInt(parts[0], 10);
    const position = parts[parts.length - 1];
    const name = parts.slice(1, -1).join(' ');

    if (isNaN(rank) || !name || !position) {
      return { players: [], error: `Could not parse line. Check format. Problem line: "${line}"` };
    }

    players.push({ rank, name, position, isHighlighted });
  }

  return { players, error: null };
};

const generateSnakeDraft = (players: Player[], numTeams: number): DraftBoardData => {
  if (!players.length || numTeams <= 0) {
    return {};
  }

  const rounds: (Player | null)[][] = [];
  const numPicks = players.length;
  const numRounds = Math.ceil(numPicks / numTeams);
  
  for(let r = 0; r < numRounds; r++) {
    rounds.push(new Array(numTeams).fill(null));
  }
  
  players.forEach((player, index) => {
    const round = Math.floor(index / numTeams);
    const pickInRound = index % numTeams;
    const isForwardRound = round % 2 === 0;

    const teamIndex = isForwardRound ? pickInRound : numTeams - 1 - pickInRound;
    
    if (rounds[round] && teamIndex < numTeams) {
      rounds[round][teamIndex] = player;
    }
  });

  const board: DraftBoardData = {};
  for (let t = 0; t < numTeams; t++) {
    const teamKey = `Team ${t + 1}`;
    board[teamKey] = [];
    for (let r = 0; r < numRounds; r++) {
        board[teamKey].push(rounds[r][t]);
    }
  }

  return board;
};


const App: React.FC = () => {
  const [numTeams, setNumTeams] = useState<number>(() => {
    const saved = localStorage.getItem('numTeams');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && [8, 10, 12, 14].includes(parsed)) {
        return parsed;
      }
    }
    return 10;
  });
  const [error, setError] = useState<string | null>(null);
  
  const [pickedPlayers, setPickedPlayers] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('draftedPlayerRanks');
    if (saved) {
      try {
        const ranks = JSON.parse(saved);
        return new Set(ranks);
      } catch (e) {
        console.error("Failed to parse drafted players from localStorage", e);
        return new Set();
      }
    }
    return new Set();
  });
  
  const [rawText, setRawText] = useState<string>(() => {
    return localStorage.getItem('customPlayerRankings') || SLEEPER_PLAYER_LIST;
  });

  const [dataSource, setDataSource] = useState<DataSource>(() => {
    return localStorage.getItem('customPlayerRankings') ? 'Custom' : 'Sleeper PPR';
  });

  useEffect(() => {
    if (dataSource === 'Custom') {
      localStorage.setItem('customPlayerRankings', rawText);
    }
  }, [rawText, dataSource]);
  
  useEffect(() => {
    localStorage.setItem('draftedPlayerRanks', JSON.stringify(Array.from(pickedPlayers)));
  }, [pickedPlayers]);

  useEffect(() => {
    localStorage.setItem('numTeams', String(numTeams));
  }, [numTeams]);

  // Memoize the parsed players and any parsing error
  const { players, error: parseError } = useMemo(() => parsePlayerText(rawText), [rawText]);

  // Create a stable identifier for the list of players, ignoring highlights.
  // This prevents resetting the draft when a player is only highlighted.
  const playerListIdentifier = useMemo(() => {
    return players.map(p => `${p.rank}|${p.name}`).join(',');
  }, [players]);

  // Update the error state when the parsing result changes
  useEffect(() => {
    setError(parseError);
  }, [parseError]);
  
  // When player list fundamentally changes, reset the picked players.
  useEffect(() => {
    setPickedPlayers(new Set());
  }, [playerListIdentifier]);

  // Memoize the draft board generation
  const draftData = useMemo(() => {
    if (players && players.length > 0) {
      return generateSnakeDraft(players, numTeams);
    }
    return {};
  }, [players, numTeams]);

  const handleRawTextChange = (text: string) => {
    setRawText(text);
    if (dataSource !== 'Custom') {
      setDataSource('Custom');
    }
  };

  const handleDataSourceChange = (source: DataSource) => {
    setDataSource(source);
    switch (source) {
      case 'Sleeper PPR':
        setRawText(SLEEPER_PLAYER_LIST);
        break;
      case 'Yahoo Half':
        setRawText(YAHOO_PLAYER_LIST);
        break;
      case 'ESPN Half':
        setRawText(ESPN_PLAYER_LIST);
        break;
      case 'Custom':
        handleRawTextChange(localStorage.getItem('customPlayerRankings') || '');
        break;
    }
  };
  
  const handleTogglePlayerPicked = (playerRank: number) => {
    setPickedPlayers(prevPicked => {
      const newPicked = new Set(prevPicked);
      if (newPicked.has(playerRank)) {
        newPicked.delete(playerRank);
      } else {
        newPicked.add(playerRank);
      }
      return newPicked;
    });
  };
  
  const handleTogglePlayerHighlight = (playerRank: number) => {
    const lines = rawText.split('\n');
    const playerLineIndex = lines.findIndex(line => {
      // Find line that starts with the rank, ignoring any existing highlight marker
      const trimmedLine = line.trim().replace(/\s*\*\s*$/, '');
      const rankMatch = trimmedLine.match(/^\d+/);
      return rankMatch ? parseInt(rankMatch[0], 10) === playerRank : false;
    });

    if (playerLineIndex !== -1) {
      let line = lines[playerLineIndex];
      if (line.trim().endsWith('*')) {
        lines[playerLineIndex] = line.trim().slice(0, -1).trim();
      } else {
        lines[playerLineIndex] = `${line.trim()} *`;
      }
      const newRawText = lines.join('\n');
      handleRawTextChange(newRawText);
    }
  };

  const handleMarkUntilPicked = (playerRank: number) => {
    const newPicked = new Set<number>();
    players.forEach(p => {
      if (p.rank <= playerRank) {
        newPicked.add(p.rank);
      }
    });
    setPickedPlayers(newPicked);
  };
  
  const handleResetDraft = () => {
    setPickedPlayers(new Set());
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-tight">
            Fantasy Snake Draft Simulator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Paste your favorite player rankings and see the draft unfold.
          </p>
        </header>

        <main>
          <Controls
            rawText={rawText}
            setRawText={handleRawTextChange}
            numTeams={numTeams}
            setNumTeams={setNumTeams}
            dataSource={dataSource}
            onDataSourceChange={handleDataSourceChange}
            onResetDraft={handleResetDraft}
          />

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative my-4" role="alert">
              <strong className="font-bold">Parsing Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-gray-400" role="toolbar" aria-label="Mouse Controls">
            <span className="flex items-center gap-2">
              <strong className="font-semibold text-gray-200">Left Click:</strong> Draft a player
            </span>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <span className="flex items-center gap-2">
              <strong className="font-semibold text-gray-200">Middle Click:</strong> Draft all players before
            </span>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <span className="flex items-center gap-2">
              <strong className="font-semibold text-gray-200">Right Click:</strong> Highlight a player
            </span>
          </div>

          <DraftBoard 
            boardData={draftData} 
            numTeams={numTeams} 
            pickedPlayers={pickedPlayers}
            onTogglePlayerPicked={handleTogglePlayerPicked}
            onTogglePlayerHighlight={handleTogglePlayerHighlight}
            onMarkUntilPicked={handleMarkUntilPicked}
          />
        </main>
      </div>
    </div>
  );
};

export default App;