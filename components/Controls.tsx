import React from 'react';
import { DataSource } from '../types';

interface ControlsProps {
  rawText: string;
  setRawText: (text: string) => void;
  numTeams: number;
  setNumTeams: (teams: number) => void;
  dataSource: DataSource;
  onDataSourceChange: (source: DataSource) => void;
  onResetDraft: () => void;
}

const TEAM_OPTIONS = [8, 10, 12, 14];
const DATA_SOURCES: DataSource[] = ['Sleeper', 'Yahoo', 'ESPN', 'Custom'];

const Controls: React.FC<ControlsProps> = ({
  rawText,
  setRawText,
  numTeams,
  setNumTeams,
  dataSource,
  onDataSourceChange,
  onResetDraft,
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-lg shadow-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="player-rankings" className="block text-sm font-medium text-gray-300 mb-2">
            Player Rankings
          </label>
          <textarea
            id="player-rankings"
            rows={10}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 shadow-inner"
            placeholder="Paste rankings here, one player per line (e.g., 1 Tom Brady QB)"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            aria-label="Player Rankings Input"
          />
          <p className="text-xs text-gray-500 mt-2">Format: Rank Name Position (e.g., 1 Ja'Marr Chase WR). Your custom list is saved automatically.</p>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Player Ranking Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DATA_SOURCES.map((source) => (
                <button
                  key={source}
                  onClick={() => onDataSourceChange(source)}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Teams
            </label>
            <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div>
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