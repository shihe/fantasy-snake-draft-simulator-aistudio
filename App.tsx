
import React, { useState, useMemo, useEffect } from 'react';
import type { Player, DraftBoardData, DataSource } from './types';
import Controls from './components/Controls';
import DraftBoard from './components/DraftBoard';

const fetchSleeperAdp = async (source: DataSource): Promise<string> => {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(`https://api.sleeper.app/projections/nfl/${year}?season_type=regular`);
    if (!res.ok) throw new Error('Failed to fetch from Sleeper');
    const data = await res.json();
    
    let adpKey = 'adp_ppr';
    if (source === 'Sleeper Standard') adpKey = 'adp_std';
    else if (source === 'Sleeper Half PPR') adpKey = 'adp_half_ppr';
    else if (source === 'Sleeper Superflex') adpKey = 'adp_2qb';

    const ranked = data
      .filter((p: any) => p.stats && p.stats[adpKey] && p.stats[adpKey] < 999)
      .sort((a: any, b: any) => a.stats[adpKey] - b.stats[adpKey]);

    const lines = ranked.map((p: any, index: number) => {
      const pos = p.player.position || p.player.fantasy_positions?.[0] || 'UNK';
      const team = p.player.team || 'FA';
      const name = `${p.player.first_name} ${p.player.last_name}`.trim();
      return `${index + 1}\t${pos}\t${name}\t${team}\t${p.stats[adpKey]}`;
    });
    
    // Add header
    return `Rank\tPosition\tPlayer\tTeam\tADP\n` + lines.join('\n');
  } catch (err) {
    console.error(err);
    return 'Error loading rankings. Try custom.';
  }
};

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
    
    if (processedLine.toLowerCase().startsWith('adp') || processedLine.toLowerCase().startsWith('rank')) {
      continue;
    }
    
    let rank: number, name: string, position: string, team: string | undefined;

    let tabParts = processedLine.split('\t').map(s => s.trim());
    
    if (tabParts.length >= 3 && processedLine.includes('\t')) {
      const parsedRank = parseInt(tabParts[0], 10);
      if (isNaN(parsedRank)) {
        continue;
      }
      rank = parsedRank;
      
      const col1 = tabParts[1];
      const col2 = tabParts[2];
      const isPos = /^[A-Z]{1,5}(?:\/[A-Z]{1,2})?(?:-\d+)?$/.test(col1.toUpperCase()) || col1.toUpperCase() === 'FLEX' || col1.toUpperCase() === 'K' || col1.toUpperCase() === 'DEF' || col1.toUpperCase() === 'DST';
      
      if (isPos && tabParts.length >= 4) {
        position = col1;
        name = col2;
        team = tabParts[3];
      } else {
        name = col1;
        position = col2;
      }
    } else {
      const parts = processedLine.split(/\s+/);
      
      if (parts.length < 3) {
        return { players: [], error: `Malformed line detected. Each line must have rank, name, and position. Problem line: "${line}"` };
      }
      
      const parsedRank = parseInt(parts[0], 10);
      if (isNaN(parsedRank)) {
        continue;
      }
      rank = parsedRank;
      
      const col1 = parts[1];
      const isPos = /^[A-Z]{1,5}(?:\/[A-Z]{1,2})?(?:-\d+)?$/.test(col1.toUpperCase()) || col1.toUpperCase() === 'FLEX' || col1.toUpperCase() === 'K' || col1.toUpperCase() === 'DEF' || col1.toUpperCase() === 'DST';
      
      if (parts.length >= 6 && isPos && (parts[parts.length - 1].includes('.') || !isNaN(parseFloat(parts[parts.length - 1])))) {
         position = col1;
         team = parts[parts.length - 3];
         name = parts.slice(2, parts.length - 3).join(' ');
      } else {
        position = parts[parts.length - 1];
        name = parts.slice(1, -1).join(' ');
      }
    }

    if (isNaN(rank) || !name || !position) {
      return { players: [], error: `Could not parse line. Check format. Problem line: "${line}"` };
    }

    players.push({ rank, name, position, team, isHighlighted });
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
    return localStorage.getItem('customPlayerRankings') || '';
  });

  const [dataSource, setDataSource] = useState<DataSource>(() => {
    return localStorage.getItem('customPlayerRankings') ? 'Custom' : 'Sleeper PPR';
  });
  
  const [isLoadingSleeper, setIsLoadingSleeper] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    return localStorage.getItem('lastUpdated') || null;
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

  // Load default sleeper data on first mount if not custom
  useEffect(() => {
    if (dataSource !== 'Custom' && !rawText) {
      loadSleeperData(dataSource);
    }
  }, []);

  const updateLastFetched = () => {
    const now = new Date().toLocaleString(undefined, { 
      month: 'short', day: 'numeric' 
    });
    setLastUpdated(now);
    localStorage.setItem('lastUpdated', now);
  };

  const loadSleeperData = async (source: DataSource) => {
    setIsLoadingSleeper(true);
    const data = await fetchSleeperAdp(source);
    setRawText(data);
    updateLastFetched();
    setIsLoadingSleeper(false);
  };

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

  const handleRawTextChange = (text: string, isUserTyping: boolean = false) => {
    setRawText(text);
    if (isUserTyping) {
      updateLastFetched();
    }
    if (dataSource !== 'Custom') {
      setDataSource('Custom');
    }
  };

  const handleDataSourceChange = (source: DataSource) => {
    setDataSource(source);
    if (source === 'Custom') {
      setRawText(localStorage.getItem('customPlayerRankings') || '');
      // Do not update the date when switching back to Custom, it reflects when they last modified it
    } else {
      loadSleeperData(source);
    }
  };
  
  const handleTogglePlayerPicked = (overallPick: number) => {
    setPickedPlayers(prevPicked => {
      const newPicked = new Set(prevPicked);
      if (newPicked.has(overallPick)) {
        newPicked.delete(overallPick);
      } else {
        newPicked.add(overallPick);
      }
      return newPicked;
    });
  };
  
  const handleTogglePlayerHighlight = (playerRank: number, playerName: string) => {
    const lines = rawText.split('\n');
    let targetIndex = -1;
    
    // Find the line that matches this player's rank and name
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      if (line.trim().toLowerCase().startsWith('adp') || line.trim().toLowerCase().startsWith('rank')) continue;
      
      if (line.includes(playerName)) {
        targetIndex = i;
        break;
      }
    }
    
    if (targetIndex !== -1) {
      let line = lines[targetIndex];
      if (line.trim().endsWith('*')) {
        lines[targetIndex] = line.trim().slice(0, -1).trim();
      } else {
        lines[targetIndex] = `${line.trim()} *`;
      }
      const newRawText = lines.join('\n');
      handleRawTextChange(newRawText, false); // highlighting doesn't count as a user typing edit for date tracking
    }
  };

  const handleMarkUntilPicked = (overallPick: number) => {
    setPickedPlayers(prevPicked => {
      const newPicked = new Set(prevPicked);
      players.forEach(p => {
        if (p.rank <= overallPick) {
          newPicked.add(p.rank);
        }
      });
      return newPicked;
    });
  };
  
  const handleResetDraft = () => {
    setPickedPlayers(new Set());
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-tight">
            Fantasy Interactive Draft
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Paste your favorite player rankings and see the draft unfold.
          </p>
        </header>

        <main>
          <Controls
            rawText={rawText}
            setRawText={(text) => handleRawTextChange(text, true)}
            numTeams={numTeams}
            setNumTeams={setNumTeams}
            dataSource={dataSource}
            onDataSourceChange={handleDataSourceChange}
            onResetDraft={handleResetDraft}
            isLoadingSleeper={isLoadingSleeper}
            lastUpdated={lastUpdated}
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
