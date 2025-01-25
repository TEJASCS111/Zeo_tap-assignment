import React, { useCallback, useState, useEffect } from 'react';
import { useSheetStore } from '../store/sheetStore';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Cell } from './Cell';
import { ContextMenu } from './ContextMenu';

const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const ROWS = Array.from({ length: 100 }, (_, i) => i + 1);

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  type: 'row' | 'column';
  index: number;
}

export const Grid: React.FC = () => {
  const { 
    selectedCell,
    selectedRange,
    setSelectedCell,
    setSelectedRange,
    columnWidths,
    rowHeights,
    updateColumnWidth,
    updateRowHeight
  } = useSheetStore();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [resizing, setResizing] = useState<{ type: 'row' | 'column'; index: number } | null>(null);

  const handleCellSelect = useCallback((cellId: string, isRangeSelect: boolean) => {
    if (isRangeSelect) {
      setSelectedRange([...selectedRange, cellId]);
    } else {
      setSelectedCell(cellId);
      setSelectedRange([]);
    }
  }, [selectedRange, setSelectedCell, setSelectedRange]);

  const handleContextMenu = (e: React.MouseEvent, type: 'row' | 'column', index: number) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      index
    });
  };

  const handleResizeStart = (e: React.MouseEvent, type: 'row' | 'column', index: number) => {
    e.preventDefault();
    setResizing({ type, index });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizing) return;

    if (resizing.type === 'column') {
      const col = String.fromCharCode(65 + resizing.index);
      updateColumnWidth(col, Math.max(50, e.clientX - e.currentTarget.getBoundingClientRect().left));
    } else {
      updateRowHeight(resizing.index.toString(), Math.max(24, e.clientY - e.currentTarget.getBoundingClientRect().top));
    }
  };

  const handleResizeEnd = () => {
    setResizing(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      const [col, row] = selectedCell.match(/([A-Z]+)(\d+)/)!.slice(1);
      const colIndex = col.charCodeAt(0) - 65;
      const rowIndex = parseInt(row);

      let nextCell: string | null = null;

      switch (e.key) {
        case 'ArrowUp':
          if (rowIndex > 1) nextCell = `${col}${rowIndex - 1}`;
          break;
        case 'ArrowDown':
          if (rowIndex < 100) nextCell = `${col}${rowIndex + 1}`;
          break;
        case 'ArrowLeft':
          if (colIndex > 0) nextCell = `${String.fromCharCode(colIndex + 64)}${row}`;
          break;
        case 'ArrowRight':
          if (colIndex < 25) nextCell = `${String.fromCharCode(colIndex + 66)}${row}`;
          break;
        case 'F2':
          // Start editing
          break;
      }

      if (nextCell) {
        e.preventDefault();
        setSelectedCell(nextCell);
        setSelectedRange([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell]);

  return (
    <DndContext onDragEnd={handleResizeEnd}>
      <div 
        className="overflow-auto flex-1"
        onMouseMove={handleResizeMove}
        onMouseUp={handleResizeEnd}
      >
        <div className="inline-block min-w-full">
          <div className="grid" style={{
            gridTemplateColumns: `40px ${COLUMNS.map(col => 
              `${columnWidths[col] || 100}px`).join(' ')}`
          }}>
            {/* Header row */}
            <div className="sticky top-0 z-10 bg-gray-100 border-b h-8"></div>
            {COLUMNS.map((col, index) => (
              <div
                key={col}
                className="sticky top-0 z-10 bg-gray-100 border-b border-r h-8 flex items-center justify-center relative group"
                onContextMenu={(e) => handleContextMenu(e, 'column', index)}
              >
                {col}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group-hover:bg-blue-400"
                  onMouseDown={(e) => handleResizeStart(e, 'column', index)}
                />
              </div>
            ))}
            
            {/* Grid cells */}
            {ROWS.map((row, rowIndex) => (
              <React. Fragment key={row}>
                <div
                  className="sticky left-0 z-10 bg-gray-100 border-r w-10 flex items-center justify-center relative group"
                  onContextMenu={(e) => handleContextMenu(e, 'row', row)}
                >
                  {row}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize group-hover:bg-blue-400"
                    onMouseDown={(e) => handleResizeStart(e, 'row', row)}
                  />
                </div>
                {COLUMNS.map(col => (
                  <Cell
                    key={`${col}${row}`}
                    id={`${col}${row}`}
                    isSelected={selectedCell === `${col}${row}`}
                    isInRange={selectedRange.includes(`${col}${row}`)}
                    onSelect={handleCellSelect}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              type={contextMenu.type}
              index={contextMenu.index}
              onClose={() => setContextMenu(null)}
            />
          </>
        )}
      </div>
    </DndContext>
  );
};