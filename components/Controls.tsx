import React, { useState } from 'react';
import { DataSource, CustomRanking } from '../types';
import { Edit2, Trash2, Plus, Check } from 'lucide-react';

interface ControlsProps {
  rawText: string;
  setRawText: (text: string) => void;
  numTeams: number;
  setNumTeams: (teams: number) => void;
  dataSource: DataSource;
  onDataSourceChange: (source: DataSource) => void;
  onResetDraft: () => void;
  isLoadingSleeper: boolean;
  lastUpdated: string | null;
  customRankings: CustomRanking[];
  onCreateCustom: () => void;
  onRenameCustom: (id: string, newName: string) => void;
  onDeleteCustom: (id: string) => void;
}

const TEAM_OPTIONS = [8, 10, 12, 14];
const SLEEPER_SOURCES: DataSource[] = ['Sleeper Standard', 'Sleeper Half PPR', 'Sleeper PPR', 'Sleeper Superflex'];

const Controls: React.FC<ControlsProps> = ({
  rawText,
  setRawText,
  numTeams,
  setNumTeams,
  dataSource,
  onDataSourceChange,
  onResetDraft,
  isLoadingSleeper,
  lastUpdated,
  customRankings,
  onCreateCustom,
  onRenameCustom,
  onDeleteCustom,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (custom: CustomRanking) => {
    setEditingId(custom.id);
    setEditName(custom.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      onRenameCustom(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-lg shadow-lg mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <label htmlFor="player-rankings" className="block text-sm font-medium text-gray-300 mb-2">
            Player Rankings {isLoadingSleeper && <span className="text-cyan-400 italic ml-2">(Loading from Sleeper...)</span>}
            {!isLoadingSleeper && lastUpdated && <span className="text-gray-500 italic ml-2 font-normal">(Last updated: {lastUpdated})</span>}
          </label>
          <textarea
            id="player-rankings"
            rows={20}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 shadow-inner resize-y min-h-[300px]"
            placeholder={isLoadingSleeper ? 'Fetching ADP rankings...' : 'Paste rankings here, one player per line (e.g., 1 Tom Brady QB)'}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={isLoadingSleeper}
            aria-label="Player Rankings Input"
          />
          <p className="text-xs text-gray-500 mt-2">Format: Rank Name Position (e.g., 1 Ja'Marr Chase WR). Your custom list is saved automatically.</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sleeper Default Rankings
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SLEEPER_SOURCES.map((source) => (
                <button
                  key={source}
                  onClick={() => onDataSourceChange(source)}
                  className={`px-2 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${
                    dataSource === source
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  aria-pressed={dataSource === source}
                >
                  {source}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Custom Rankings
              </label>
              <button 
                onClick={onCreateCustom}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-cyan-900/30 rounded hover:bg-cyan-900/50 transition-colors"
              >
                <Plus size={14} /> New
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {customRankings.length > 0 ? (
                customRankings.map(custom => {
                  const isSelected = dataSource === custom.id;
                  return (
                    <div key={custom.id} className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelected ? 'bg-gray-700/80 ring-1 ring-cyan-500' : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'}`} onClick={() => !isSelected && onDataSourceChange(custom.id)}>
                       <div className="flex-1 min-w-0 mr-2">
                         {editingId === custom.id ? (
                           <input 
                             type="text"
                             value={editName}
                             onChange={(e) => setEditName(e.target.value)}
                             onBlur={() => handleSaveEdit(custom.id)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(custom.id)}
                             className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white w-full focus:outline-none focus:border-cyan-500"
                             autoFocus
                             onClick={e => e.stopPropagation()}
                           />
                         ) : (
                           <div className={`text-sm truncate ${isSelected ? 'text-cyan-400 font-semibold' : 'text-gray-300'}`}>
                             {custom.name}
                           </div>
                         )}
                       </div>
                       <div className="flex items-center gap-1 flex-shrink-0">
                         {editingId === custom.id ? (
                           <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(custom.id); }} className="p-1.5 rounded bg-gray-900/50 text-green-400 hover:text-green-300 hover:bg-gray-900">
                             <Check size={14} />
                           </button>
                         ) : (
                           <button onClick={(e) => { e.stopPropagation(); startEdit(custom); }} className="p-1.5 rounded bg-gray-900/0 text-gray-400 hover:text-cyan-300 hover:bg-gray-900">
                             <Edit2 size={14} />
                           </button>
                         )}
                         <button onClick={(e) => { e.stopPropagation(); onDeleteCustom(custom.id); }} className="p-1.5 rounded bg-gray-900/0 text-gray-400 hover:text-red-400 hover:bg-gray-900">
                           <Trash2 size={14} />
                         </button>
                       </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-800/30 rounded border border-dashed border-gray-700">
                  No custom rankings saved.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Teams
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {TEAM_OPTIONS.map((teams) => (
                <button
                  key={teams}
                  onClick={() => setNumTeams(teams)}
                  className={`px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${
                    numTeams === teams
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  aria-pressed={numTeams === teams}
                >
                  {teams} Teams
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-300 mb-2">
              Draft Actions
            </label>
            <button
                onClick={onResetDraft}
                className="w-full px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 bg-red-800/50 text-red-300 hover:bg-red-700/60"
                aria-label="Reset the entire draft board"
            >
                Reset Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;