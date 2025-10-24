import React from 'react';
import { TalentType, talentTypeConfig } from '../../types/talent';

interface TalentTypeFormProps {
  selectedTypes: TalentType[];
  onSelect: (type: TalentType) => void;
}

export function TalentTypeForm({ selectedTypes, onSelect }: TalentTypeFormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Talent Types (Multiple Selection Allowed)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(talentTypeConfig) as [TalentType, typeof talentTypeConfig[TalentType]][]).map(([type, config]) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedTypes.includes(type)
                ? 'border-pink-500 bg-pink-50 text-pink-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <i className={`${config.icon} text-2xl mb-3`}></i>
              <h3 className="text-lg font-medium mb-2">{config.label}</h3>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 