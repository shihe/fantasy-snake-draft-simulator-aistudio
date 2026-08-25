import React from 'react';
import type { Player } from '../types';

export interface PlayerCardProps {
    player: Player;
    overallPick: number;
    round: number;
    isPicked: boolean;
    onTogglePicked: (rank: number) => void;
    isHighlighted: boolean;
    onToggleHighlight: (rank: number, name: string) => void;
    onMarkUntilPicked: (rank: number) => void;
    isMobile: boolean;
    hideArrows?: boolean;
    compact?: boolean;
}

const getPositionColorClasses = (position: string): { border: string; text: string; } => {
  switch (position.slice(0, 2).toUpperCase()) {
    case 'WR':
      return { border: 'border-l-sky-400', text: 'text-sky-400' };
    case 'RB':
      return { border: 'border-l-emerald-400', text: 'text-emerald-400' };
    case 'TE':
      return { border: 'border-l-amber-400', text: 'text-amber-400' };
    case 'QB':
      return { border: 'border-l-rose-400', text: 'text-rose-400' };
    case 'K':
      return { border: 'border-l-purple-400', text: 'text-purple-400' };
    case 'DE': // DEF
      return { border: 'border-l-orange-400', text: 'text-orange-400' };
    default:
      return { border: 'border-l-gray-500', text: 'text-gray-400' };
  }
};

const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(' ');
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts.slice(0, nameParts.length - 1).join(' ');
  return { firstName, lastName };
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, overallPick, round, isPicked, onTogglePicked, isHighlighted, onToggleHighlight, onMarkUntilPicked, isMobile, hideArrows, compact }) => {
  const roundColorClass = round % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/60';
  const positionColors = getPositionColorClasses(player.position);
  const pickedClasses = isPicked ? 'opacity-40 filter grayscale hover:bg-transparent' : 'hover:bg-gray-700/80 hover:scale-[1.02]';
  const highlightClasses = isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : '';
  const isForwardRound = round % 2 === 0;
  const { firstName, lastName } = splitName(player.name);

  return (
    <div 
        className={`relative ${compact ? 'p-1 h-auto min-h-[2.5rem]' : 'p-2 h-28'} rounded-md flex flex-col justify-between text-left shadow-lg border border-gray-700/50 border-l-4 ${roundColorClass} ${positionColors.border} cursor-pointer transform transition-all duration-300 ease-in-out ${pickedClasses} ${highlightClasses}`}
        onClick={() => onTogglePicked(overallPick)}
        onContextMenu={(e) => {
            e.preventDefault();
            onToggleHighlight(player.rank, player.name);
        }}
        onAuxClick={(e) => {
            if (e.button === 1) { // Middle mouse button
                e.preventDefault();
                onMarkUntilPicked(overallPick);
            }
        }}
        role="button"
        aria-pressed={isPicked}
        tabIndex={0}
        aria-label={`Pick ${player.name}, Rank ${player.rank}, Position ${player.position}. Click to toggle drafted status. Right-click to toggle highlight. Middle-click to mark all previous players as drafted.`}
    >
      {compact ? (
        <div className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-baseline gap-1">
            <p className={`font-bold text-xs text-white truncate min-w-0 ${isPicked ? 'line-through' : ''}`} title={player.name}>
              {player.name}
            </p>
            <p className={`text-[10px] font-mono font-bold ${positionColors.text} flex-shrink-0`}>
              {player.position}
            </p>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex gap-1.5 items-center text-[10px] text-gray-400">
               {player.team && <span className="font-mono uppercase">{player.team}</span>}
               <span>{isMobile ? `Rk:${player.rank}` : `Rk: ${player.rank}`}</span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              {isMobile ? `${overallPick}` : `Pick ${overallPick}`}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-between items-start gap-1">
              <p className={`font-bold text-sm text-white truncate min-w-0 ${isPicked ? 'line-through' : ''}`} title={player.name}>
                {firstName}
              </p>
              <div className="hidden lg:block ml-1 flex-shrink-0 text-right">
                <p className={`text-xs font-mono font-bold ${positionColors.text}`}>
                  {player.position}
                </p>
              </div>
            </div>
            <p className={`font-bold text-sm text-white truncate min-w-0 ${isPicked ? 'line-through' : ''}`} title={player.name}>
              {lastName}
            </p>
            <div className="hidden lg:block mt-0.5">
              {player.team && (
                <p className="text-[10px] font-mono text-gray-400 uppercase truncate" title={player.team}>
                  {player.team}
                </p>
              )}
            </div>
            <div className="block lg:hidden">
              <p className={`text-xs font-mono font-bold flex-shrink-0 ${positionColors.text}`}>
                {player.position}
              </p>
              {player.team && <p className="text-[10px] font-mono text-gray-400 mt-0.5 uppercase truncate" title={player.team}>{player.team}</p>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              { isMobile ? `(Rk: ${player.rank})` : `(Rank: ${player.rank})` } 
            </p>
          </div>
          <div className="flex justify-between items-center mt-1">
            {!hideArrows ? (
                <svg
                    className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${!isForwardRound ? 'transform -scale-x-100' : ''}`}
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
            ) : <div />}
            <p className="text-xs text-gray-500 font-mono">
                { isMobile ? `${overallPick}` : `Pick ${overallPick}` }
            </p>
          </div>
        </>
      )}
    </div>
  );
};
