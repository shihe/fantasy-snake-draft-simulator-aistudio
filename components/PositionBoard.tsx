import React, { useState, useEffect } from 'react';
import type { Player } from '../types';
import { PlayerCard } from './PlayerCard';

interface PositionBoardProps {
  players: Player[];
  pickedPlayers: Set<number>;
  onTogglePlayerPicked: (rank: number) => void;
  onTogglePlayerHighlight: (rank: number, name: string) => void;
  onMarkUntilPickedPosition: (rank: number, position: string) => void;
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

export const PositionBoard: React.FC<PositionBoardProps> = ({ 
  players, 
  pickedPlayers, 
  onTogglePlayerPicked, 
  onTogglePlayerHighlight, 
  onMarkUntilPickedPosition 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [hideDrafted, setHideDrafted] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const handleMediaQueryChange = () => setIsMobile(mediaQuery.matches);
    handleMediaQueryChange();
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    return () => mediaQuery.removeEventListener('change', handleMediaQueryChange);
  }, []);
  
  if (players.length === 0) {
    return (
        <div className="text-center py-10 bg-gray-800/30 rounded-lg">
            <p className="text-gray-400">Position board will appear here once rankings are entered.</p>
        </div>
    );
  }

  // Pre-calculate overall picks (index + 1 in the original array)
  // and group them by position.
  const columns: { title: string; items: { player: Player, overallPick: number }[] }[] = [];
  
  POSITIONS.forEach(pos => {
    let items = players
      .map((player, index) => ({ player, overallPick: index + 1 }))
      .filter(item => {
        const p = item.player.position.toUpperCase();
        if (pos === 'DEF') {
          return p.startsWith('DE') || p.startsWith('D/ST');
        }
        return p.startsWith(pos);
      });
      
    if (hideDrafted) {
      items = items.filter(item => !pickedPlayers.has(item.overallPick));
    }
      
    if (items.length > 0) {
      columns.push({ title: pos, items });
    }
  });

  const getStyle = (colCount: number) => {
    const minPlayerCardWidth = isMobile ? '5rem' : 0;
    return { gridTemplateColumns: `repeat(${colCount}, minmax(${minPlayerCardWidth}, 1fr))` };
  };

  const maxRows = Math.max(...columns.map(c => c.items.length), 0);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end mb-2 px-2">
        <label className="flex items-center cursor-pointer gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-700">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-cyan-500 accent-cyan-500 rounded border-gray-600 bg-gray-900 focus:ring-cyan-500 focus:ring-offset-gray-900 cursor-pointer"
            checked={hideDrafted}
            onChange={(e) => setHideDrafted(e.target.checked)}
          />
          Hide Drafted Players
        </label>
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
        <div className="grid gap-1.5" style={getStyle(columns.length)}>
          {/* Grid Headers */}
          {columns.map((col) => (
            <div key={col.title} className="sticky top-0 z-10 bg-gray-900 pt-2">
              <h2 className="bg-gray-700 text-cyan-300 p-2 text-center font-bold text-sm md:text-base rounded-t-md shadow-md">
                {col.title}
              </h2>
            </div>
          ))}

          {/* Grid Body */}
          {Array.from({ length: maxRows }).map((_, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {columns.map((col) => {
                const item = col.items[rowIndex];
                return (
                  <div key={`${col.title}-${rowIndex}`}>
                    {item ? (
                      <PlayerCard 
                        player={item.player} 
                        overallPick={item.overallPick} 
                        round={rowIndex}
                        isPicked={pickedPlayers.has(item.overallPick)}
                        onTogglePicked={onTogglePlayerPicked}
                        isHighlighted={item.player.isHighlighted}
                        onToggleHighlight={onTogglePlayerHighlight}
                        onMarkUntilPicked={(overallPick) => onMarkUntilPickedPosition(overallPick, col.title)}
                        isMobile={isMobile}
                        hideArrows={true}
                        compact={true}
                      />
                    ) : (
                      <div className="h-10 min-h-[2.5rem]"></div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};
