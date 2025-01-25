import React from 'react';
import { CDP, CDPs } from '../types';

interface CDPSelectorProps {
  selectedCDP: CDP | null;
  onSelect: (cdp: CDP) => void;
}

export function CDPSelector({ selectedCDP, onSelect }: CDPSelectorProps) {
  return (
    <div className="flex gap-2 p-4 border-b bg-white">
      {CDPs.map((cdp) => (
        <button
          key={cdp}
          onClick={() => onSelect(cdp)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${selectedCDP === cdp 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {cdp}
        </button>
      ))}
    </div>
  );
}