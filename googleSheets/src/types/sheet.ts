export interface CellData {
  value: string;
  formula: string;
  style: CellStyle;
  computed?: number | string;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
}

export interface SheetState {
  data: { [key: string]: CellData };
  selectedCell: string | null;
  selectedRange: string[];
  columnWidths: { [key: string]: number };
  rowHeights: { [key: string]: number };
  editingCell: string | null;
  dragOperation: DragOperation | null;
  formatPainter: CellStyle | null;
  undoStack: HistoryState[];
  redoStack: HistoryState[];
}

export interface DragOperation {
  type: 'move' | 'copy' | 'fill';
  sourceRange: string[];
  targetRange: string[];
}

export interface HistoryState {
  data: { [key: string]: CellData };
  columnWidths: { [key: string]: number };
  rowHeights: { [key: string]: number };
}