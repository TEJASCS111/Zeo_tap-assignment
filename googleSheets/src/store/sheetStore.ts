import { create } from 'zustand';
import { produce } from 'immer';
import { SheetState, CellData, CellStyle, HistoryState } from '../types/sheet';
import { evaluateFormula } from '../utils/functions';

interface SheetStore extends SheetState {
  updateCell: (cellId: string, data: Partial<CellData>) => void;
  setSelectedCell: (cellId: string | null) => void;
  setSelectedRange: (range: string[]) => void;
  setEditingCell: (cellId: string | null) => void;
  updateColumnWidth: (colId: string, width: number) => void;
  updateRowHeight: (rowId: string, height: number) => void;
  startDragOperation: (type: 'move' | 'copy' | 'fill', sourceRange: string[]) => void;
  completeDragOperation: (targetRange: string[]) => void;
  setFormatPainter: (style: CellStyle | null) => void;
  applyFormatPainter: (cellId: string) => void;
  insertRow: (index: number, position: 'above' | 'below') => void;
  insertColumn: (index: number, position: 'left' | 'right') => void;
  deleteRows: (indices: number[]) => void;
  deleteColumns: (indices: number[]) => void;
  clearContents: (range: string[]) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

export const useSheetStore = create<SheetStore>((set, get) => ({
  data: {},
  selectedCell: null,
  selectedRange: [],
  columnWidths: {},
  rowHeights: {},
  editingCell: null,
  dragOperation: null,
  formatPainter: null,
  undoStack: [],
  redoStack: [],

  updateCell: (cellId, newData) => set(produce((state: SheetState) => {
    // Save current state to undo stack
    state.undoStack.push({
      data: { ...state.data },
      columnWidths: { ...state.columnWidths },
      rowHeights: { ...state.rowHeights }
    });
    if (state.undoStack.length > MAX_HISTORY) {
      state.undoStack.shift();
    }
    state.redoStack = [];

    const currentCell = state.data[cellId] || { value: '', formula: '', style: {} };
    state.data[cellId] = {
      ...currentCell,
      ...newData,
    };
    
    if (newData.formula) {
      state.data[cellId].computed = evaluateFormula(
        newData.formula,
        (ref) => get().data[ref]
      );
    }
  })),

  setSelectedCell: (cellId) => set({ selectedCell: cellId }),
  
  setSelectedRange: (range) => set({ selectedRange: range }),
  
  setEditingCell: (cellId) => set({ editingCell: cellId }),

  updateColumnWidth: (colId, width) => set(produce((state: SheetState) => {
    state.columnWidths[colId] = width;
  })),

  updateRowHeight: (rowId, height) => set(produce((state: SheetState) => {
    state.rowHeights[rowId] = height;
  })),

  startDragOperation: (type, sourceRange) => set({
    dragOperation: { type, sourceRange, targetRange: [] }
  }),

  completeDragOperation: (targetRange) => set(produce((state: SheetState) => {
    if (!state.dragOperation) return;

    // Save current state to undo stack
    state.undoStack.push({
      data: { ...state.data },
      columnWidths: { ...state.columnWidths },
      rowHeights: { ...state.rowHeights }
    });

    const { type, sourceRange } = state.dragOperation;
    
    if (type === 'move') {
      // Move cells
      sourceRange.forEach((sourceId, index) => {
        const targetId = targetRange[index];
        if (targetId && sourceId !== targetId) {
          state.data[targetId] = { ...state.data[sourceId] };
          delete state.data[sourceId];
        }
      });
    } else if (type === 'copy' || type === 'fill') {
      // Copy cells with formula adjustment
      sourceRange.forEach((sourceId, index) => {
        const targetId = targetRange[index];
        if (targetId && sourceId !== targetId) {
          const sourceCellData = state.data[sourceId];
          if (sourceCellData) {
            state.data[targetId] = {
              ...sourceCellData,
              formula: adjustFormula(sourceCellData.formula, sourceId, targetId)
            };
          }
        }
      });
    }

    state.dragOperation = null;
  })),

  setFormatPainter: (style) => set({ formatPainter: style }),

  applyFormatPainter: (cellId) => set(produce((state: SheetState) => {
    if (!state.formatPainter) return;
    
    const currentCell = state.data[cellId] || { value: '', formula: '', style: {} };
    state.data[cellId] = {
      ...currentCell,
      style: { ...currentCell.style, ...state.formatPainter }
    };
  })),

  insertRow: (index, position) => set(produce((state: SheetState) => {
    // Save current state to undo stack
    state.undoStack.push({
      data: { ...state.data },
      columnWidths: { ...state.columnWidths },
      rowHeights: { ...state.rowHeights }
    });

    const newData: { [key: string]: CellData } = {};
    const targetRow = position === 'above' ? index : index + 1;

    Object.entries(state.data).forEach(([cellId, cellData]) => {
      const [col, row] = parseCellId(cellId);
      const currentRow = parseInt(row);
      
      if (currentRow >= targetRow) {
        newData[`${col}${currentRow + 1}`] = cellData;
      } else {
        newData[cellId] = cellData;
      }
    });

    state.data = newData;
  })),

  insertColumn: (index, position) => set(produce((state: SheetState) => {
    // Save current state to undo stack
    state.undoStack.push({
      data: { ...state.data },
      columnWidths: { ...state.columnWidths },
      rowHeights: { ...state.rowHeights }
    });

    const newData: { [key: string]: CellData } = {};
    const targetCol = position === 'left' ? index : index + 1;

    Object.entries(state.data).forEach(([cellId, cellData]) => {
      const [col, row] = parseCellId(cellId);
      const currentCol = col.charCodeAt(0) - 65;
      
      if (currentCol >= targetCol) {
        newData[`${String.fromCharCode(66 + currentCol)}${row}`] = cellData;
      } else {
        newData[cellId] = cellData;
      }
    });

    state.data = newData;
  })),

  deleteRows: (indices) => set(produce((state: SheetState) => {
    // Save current state to undo stack
    state.undoStack.push({
      data: { ...state.data },
      columnWidths: { ...state.columnWidths },
      rowHeights: { ...state.rowHeights }
    });

    const newData: { [key: string]: CellData } = {};
    const sortedIndices = [...indices].sort((a, b) => a - b);

    Object.entries(state.data).forEach(([cellId, cellData]) => {
      const [col, row] = parseCellId(cellId);
      const currentRow = parseInt(row);
      
      if (!sortedIndices.includes(currentRow)) {
        const shift = sortedIndices.filter(i => i < currentRow).length;
        newData[`${col}${currentRow - shift}`] = cellData;
      }
    });

    state.data = newData;
  })),

  deleteColumns: (indices) => set(produce((state: SheetState) => {
    // Save current state to undo stack
    state.undoStack.push({
      data: { ...state.data },
      columnWidths: { ...state.columnWidths },
      rowHeights: { ...state.rowHeights }
    });

    const newData: { [key: string]: CellData } = {};
    const sortedIndices = [...indices].sort((a, b) => a - b);

    Object.entries(state.data).forEach(([cellId, cellData]) => {
      const [col, row] = parseCellId(cellId);
      const currentCol = col.charCodeAt(0) - 65;
      
      if (!sortedIndices.includes(currentCol)) {
        const shift = sortedIndices.filter(i => i < currentCol).length;
        newData[`${String.fromCharCode(65 + currentCol - shift)}${row}`] = cellData;
      }
    });

    state.data = newData;
  })),

  clearContents: (range) => set(produce((state: SheetState) => {
    // Save current state to undo stack
    state.undoStack.push({
      data: { ...state.data },
      columnWidths: { ...state.columnWidths },
      rowHeights: { ...state.rowHeights }
    });

    range.forEach(cellId => {
      if (state.data[cellId]) {
        state.data[cellId] = {
          value: '',
          formula: '',
          style: state.data[cellId].style
        };
      }
    });
  })),

  undo: () => set(produce((state: SheetState) => {
    const previousState = state.undoStack.pop();
    if (previousState) {
      state.redoStack.push({
        data: { ...state.data },
        columnWidths: { ...state.columnWidths },
        rowHeights: { ...state.rowHeights }
      });
      state.data = previousState.data;
      state.columnWidths = previousState.columnWidths;
      state.rowHeights = previousState.rowHeights;
    }
  })),

  redo: () => set(produce((state: SheetState) => {
    const nextState = state.redoStack.pop();
    if (nextState) {
      state.undoStack.push({
        data: { ...state.data },
        columnWidths: { ...state.columnWidths },
        rowHeights: { ...state.rowHeights }
      });
      state.data = nextState.data;
      state.columnWidths = nextState.columnWidths;
      state.rowHeights = nextState.rowHeights;
    }
  })),
}));

function parseCellId(cellId: string): [string, string] {
  const match = cellId.match(/([A-Z]+)(\d+)/);
  if (!match) throw new Error(`Invalid cell ID: ${cellId}`);
  return [match[1], match[2]];
}

function adjustFormula(formula: string, sourceId: string, targetId: string): string {
  if (!formula.startsWith('=')) return formula;
  
  const [sourceCol, sourceRow] = parseCellId(sourceId);
  const [targetCol, targetRow] = parseCellId(targetId);
  
  const colDiff = targetCol.charCodeAt(0) - sourceCol.charCodeAt(0);
  const rowDiff = parseInt(targetRow) - parseInt(sourceRow);
  
  return formula.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
    const newCol = String.fromCharCode(col.charCodeAt(0) + colDiff);
    const newRow = parseInt(row) + rowDiff;
    return `${newCol}${newRow}`;
  });
}