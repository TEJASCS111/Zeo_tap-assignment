import React from 'react';
import { useSheetStore } from '../store/sheetStore';

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'row' | 'column';
  index: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  index,
  onClose
}) => {
  const {
    insertRow,
    insertColumn,
    deleteRows,
    deleteColumns,
    clearContents
  } = useSheetStore();

  const handleClick = (action: string) => {
    switch (action) {
      case 'insertBefore':
        type === 'row' ? insertRow(index, 'above') : insertColumn(index, 'left');
        break;
      case 'insertAfter':
        type === 'row' ? insertRow(index, 'below') : insertColumn(index, 'right');
        break;
      case 'delete':
        type === 'row' ? deleteRows([index]) : deleteColumns([index]);
        break;
      case 'clear':
        // Generate range for entire row/column
        const range = type === 'row'
          ? Array.from({ length: 26 }, (_, i) => `${String.fromCharCode(65 + i)}${index}`)
          : Array.from({ length: 100 }, (_, i) => `${String.fromCharCode(65 + index)}${i + 1}`);
        clearContents(range);
        break;
    }
    onClose();
  };

  return (
    <div
      className="fixed bg-white shadow-lg rounded-lg py-1 z-50 min-w-[150px]"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full text-left px-4 py-1 hover:bg-gray-100"
        onClick={() => handleClick('insertBefore')}
      >
        Insert {type === 'row' ? 'above' : 'left'}
      </button>
      <button
        className="w-full text-left px-4 py-1 hover:bg-gray-100"
        onClick={() => handleClick('insertAfter')}
      >
        Insert {type === 'row' ? 'below' : 'right'}
      </button>
      <div className="border-t my-1" />
      <button
        className="w-full text-left px-4 py-1 hover:bg-gray-100"
        onClick={() => handleClick('delete')}
      >
        Delete {type}
      </button>
      <button
        className="w-full text-left px-4 py-1 hover:bg-gray-100"
        onClick={() => handleClick('clear')}
      >
        Clear contents
      </button>
    </div>
  );
};