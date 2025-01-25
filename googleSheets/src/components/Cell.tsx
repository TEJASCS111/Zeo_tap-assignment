import React, { memo, useRef, useEffect } from 'react';
import { useSheetStore } from '../store/sheetStore';
import clsx from 'clsx';

interface CellProps {
  id: string;
  isSelected: boolean;
  isInRange: boolean;
  onSelect: (id: string, isRangeSelect: boolean) => void;
}

export const Cell: React.FC<CellProps> = memo(({ 
  id, 
  isSelected, 
  isInRange,
  onSelect 
}) => {
  const { 
    data,
    editingCell,
    setEditingCell,
    updateCell,
    dragOperation,
    startDragOperation,
    completeDragOperation
  } = useSheetStore();
  
  const cell = data[id];
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingCell === id;
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    onSelect(id, e.shiftKey);
  };

  const handleDoubleClick = () => {
    setEditingCell(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
      // Move to next row
      const [col, row] = id.match(/([A-Z]+)(\d+)/)!.slice(1);
      onSelect(`${col}${parseInt(row) + 1}`, false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setEditingCell(null);
      // Move to next column
      const [col, row] = id.match(/([A-Z]+)(\d+)/)!.slice(1);
      const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
      onSelect(`${nextCol}${row}`, false);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    startDragOperation('move', [id]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOperation) {
      completeDragOperation([id]);
    }
  };

  return (
    <div
      className={clsx(
        'border-r border-b px-2 py-1 outline-none min-h-[24px] relative',
        'hover:bg-gray-50',
        {
          'bg-blue-50 border-blue-200': isSelected,
          'bg-blue-50/50': isInRange,
          'font-bold': cell?.style?.bold,
          'italic': cell?.style?.italic,
          'underline': cell?.style?.underline,
        }
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      style={{
        color: cell?.style?.color,
        backgroundColor: cell?.style?.backgroundColor,
        fontSize: cell?.style?.fontSize ? `${cell.style.fontSize}px` : undefined,
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="absolute inset-0 w-full h-full px-2 py-1 border-2 border-blue-400"
          value={cell?.formula || cell?.value || ''}
          onChange={(e) => updateCell(id, {
            value: e.target.value,
            formula: e.target.value.startsWith('=') ? e.target.value : ''
          })}
          onKeyDown={handleKeyDown}
          onBlur={() => setEditingCell(null)}
        />
      ) : (
        cell?.computed ?? cell?.value ?? ''
      )}
      {isSelected && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-400 cursor-crosshair"
             onMouseDown={() => startDragOperation('fill', [id])} />
      )}
    </div>
  );
});