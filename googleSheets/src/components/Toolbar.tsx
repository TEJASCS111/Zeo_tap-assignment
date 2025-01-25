import React from 'react';
import { clsx } from 'clsx';
import {
  Bold,
  Italic,
  Underline,
  Type,
  Palette,
  Plus,
  Minus,
  Search,
  Copy,
  Trash2,
  Paintbrush,
} from 'lucide-react';
import { useSheetStore } from '../store/sheetStore';

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

export const Toolbar: React.FC = () => {
  const { 
    selectedCell,
    selectedRange,
    updateCell,
    data,
    setFormatPainter,
    formatPainter,
    clearContents
  } = useSheetStore();
  
  const toggleStyle = (style: keyof CellStyle) => {
    if (!selectedCell) return;
    const currentCell = data[selectedCell];
    updateCell(selectedCell, {
      style: {
        ...currentCell?.style,
        [style]: !currentCell?.style[style],
      },
    });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedCell) return;
    updateCell(selectedCell, {
      style: {
        ...data[selectedCell]?.style,
        fontSize: parseInt(e.target.value),
      },
    });
  };

  const handleColorChange = (type: 'color' | 'backgroundColor', e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCell) return;
    updateCell(selectedCell, {
      style: {
        ...data[selectedCell]?.style,
        [type]: e.target.value,
      },
    });
  };

  const handleFormatPainter = () => {
    if (!selectedCell) return;
    if (formatPainter) {
      setFormatPainter(null);
    } else {
      setFormatPainter(data[selectedCell]?.style || {});
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-white">
      <div className="flex items-center gap-1 border-r pr-2">
        <select
          className="px-2 py-1 border rounded"
          value={selectedCell && data[selectedCell]?.style?.fontSize || 11}
          onChange={handleFontSizeChange}
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        
        <button
          onClick={() => toggleStyle('bold')}
          className={clsx(
            "p-1 hover:bg-gray-100 rounded",
            { "bg-gray-200": selectedCell && data[selectedCell]?.style?.bold }
          )}
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => toggleStyle('italic')}
          className={clsx(
            "p-1 hover:bg-gray-100 rounded",
            { "bg-gray-200": selectedCell && data[selectedCell]?.style?.italic }
          )}
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => toggleStyle('underline')}
          className={clsx(
            "p-1 hover:bg-gray-100 rounded",
            { "bg-gray-200": selectedCell && data[selectedCell]?.style?.underline }
          )}
        >
          <Underline size={18} />
        </button>
        
        <input
          type="color"
          className="w-8 h-8 p-1 rounded cursor-pointer"
          value={selectedCell && data[selectedCell]?.style?.color || '#000000'}
          onChange={(e) => handleColorChange('color', e)}
        />
        <input
          type="color"
          className="w-8 h-8 p-1 rounded cursor-pointer"
          value={selectedCell && data[selectedCell]?.style?.backgroundColor || '#ffffff'}
          onChange={(e) => handleColorChange('backgroundColor', e)}
        />
      </div>
      
      <div className="flex items-center gap-1 border-r pr-2">
        <button
          onClick={handleFormatPainter}
          className={clsx(
            "p-1 hover:bg-gray-100 rounded",
            { "bg-gray-200": formatPainter }
          )}
        >
          <Paintbrush size={18} />
        </button>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => selectedRange.length > 0 && clearContents(selectedRange)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};