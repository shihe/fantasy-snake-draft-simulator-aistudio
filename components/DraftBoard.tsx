import React, { useState, useEffect } from 'react';
import type { Player, DraftBoardData } from '../types';
import { PlayerCard } from './PlayerCard';

interface DraftBoardProps {
  boardData: DraftBoardData;
  numTeams: number;
  pickedPlayers: Set<number>;
  onTogglePlayerPicked: (rank: number) => void;
  onTogglePlayerHighlight: (rank: number, name: string) => void;
  onMarkUntilPicked: (rank: number) => void;
}

const EmptyCard: React.FC<{ round: number }> = ({ round }) => {
  const roundColorClass = round % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/10';
  return <div className={`p-2 rounded-md h-28 ${roundColorClass} border border-dashed border-gray-700`}></div>;
};

const DraftBoard: React.FC<DraftBoardProps> = ({ boardData, numTeams, pickedPlayers, onTogglePlayerPicked, onTogglePlayerHighlight, onMarkUntilPicked }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)'); // Tailwind's 'lg' breakpoint
    const handleMediaQueryChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    handleMediaQueryChange(); // Set initial value
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, []);
  
  const teamKeys = Object.keys(boardData);
  if (teamKeys.length === 0) {
    return (
        <div className="text-center py-10 bg-gray-800/30 rounded-lg">
            <p className="text-gray-400">Draft board will appear here once rankings are entered.</p>
        </div>
    );
  }

  const numRounds = boardData[teamKeys[0]]?.length || 0;
  
  const getStyle = (teams: number) => {
    // On mobile screens, enforce a minimum width for player cards to prevent them
    // from becoming unreadably narrow. This enables horizontal scrolling.
    const minPlayerCardWidth = isMobile ? '5rem' : 0;

    return { gridTemplateColumns: `auto repeat(${teams}, minmax(${minPlayerCardWidth}, 1fr))` };
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-block min-w-full">
        <div className="grid gap-1.5" style={getStyle(numTeams)}>
          {/* Grid Headers */}
          <div className="sticky top-0 left-0 z-30 bg-gray-900"></div> {/* Blank cell for top-left corner */}
          {teamKeys.map((teamName) => (
            <div key={teamName} className="sticky top-0 z-10 bg-gray-900 pt-2">
              <h2 className="bg-gray-700 text-cyan-300 p-2 text-center font-bold text-sm md:text-base rounded-t-md shadow-md">
                {teamName}
              </h2>
            </div>
          ))}

          {/* Grid Body */}
          {Array.from({ length: numRounds }).map((_, roundIndex) => (
            <React.Fragment key={roundIndex}>
              {/* Round Number Cell */}
              <div className="flex items-center justify-center sticky left-0 bg-gray-900 z-20 h-full pr-2">
                <div className="hidden lg:block">
                  <div className="text-center font-bold text-gray-500 text-sm">
                    <p className="leading-none tracking-wider">RND</p>
                    <p className="text-lg leading-tight text-gray-300">{roundIndex + 1}</p>
                  </div>
                </div>
              </div>
              
              {teamKeys.map((teamName, teamIndex) => {
                const player = boardData[teamName]?.[roundIndex] ?? null;
                const isForwardRound = roundIndex % 2 === 0;
                const pickInRound = isForwardRound ? teamIndex : numTeams - 1 - teamIndex;
                const overallPick = roundIndex * numTeams + pickInRound + 1;

                return (
                  <div key={`${teamName}-${roundIndex}`}>
                    {player ? (
                      <PlayerCard 
                        player={player} 
                        overallPick={overallPick} 
                        round={roundIndex}
                        isPicked={pickedPlayers.has(overallPick)}
                        onTogglePicked={onTogglePlayerPicked}
                        isHighlighted={player.isHighlighted}
                        onToggleHighlight={onTogglePlayerHighlight}
                        onMarkUntilPicked={onMarkUntilPicked}
                        isMobile={isMobile}
                      />
                    ) : (
                      <EmptyCard round={roundIndex} />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DraftBoard;
