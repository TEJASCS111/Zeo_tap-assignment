import { CellData } from '../types/sheet';

export const evaluateFormula = (formula: string, getCellValue: (ref: string) => CellData | undefined): number | string => {
  if (!formula.startsWith('=')) return formula;
  
  const cleanFormula = formula.substring(1);
  const functionMatch = cleanFormula.match(/^([A-Z]+)\((.*)\)$/);
  
  if (!functionMatch) return formula;
  
  const [, functionName, args] = functionMatch;
  const evaluatedArgs = args.split(',').map(arg => {
    const trimmed = arg.trim();
    const rangeMatch = trimmed.match(/([A-Z]+[0-9]+):([A-Z]+[0-9]+)/);
    
    if (rangeMatch) {
      return getCellRange(rangeMatch[1], rangeMatch[2], getCellValue);
    }
    
    const cellValue = getCellValue(trimmed);
    return cellValue?.computed ?? cellValue?.value ?? 0;
  });

  return executeMathFunction(functionName, evaluatedArgs);
};

const getCellRange = (start: string, end: string, getCellValue: (ref: string) => CellData | undefined): number[] => {
  const startCol = start.match(/[A-Z]+/)![0];
  const startRow = parseInt(start.match(/[0-9]+/)![0]);
  const endCol = end.match(/[A-Z]+/)![0];
  const endRow = parseInt(end.match(/[0-9]+/)![0]);
  
  const values: number[] = [];
  
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellRef = `${col}${row}`;
      const cellValue = getCellValue(cellRef);
      const value = Number(cellValue?.computed ?? cellValue?.value ?? 0);
      if (!isNaN(value)) values.push(value);
    }
  }
  
  return values;
};

const executeMathFunction = (name: string, args: any[]): number | string => {
  switch (name.toUpperCase()) {
    case 'SUM':
      return args.flat().reduce((a: number, b: number) => a + b, 0);
    case 'AVERAGE':
      const numbers = args.flat();
      return numbers.reduce((a: number, b: number) => a + b, 0) / numbers.length;
    case 'MAX':
      return Math.max(...args.flat());
    case 'MIN':
      return Math.min(...args.flat());
    case 'COUNT':
      return args.flat().filter((x: any) => typeof x === 'number').length;
    case 'TRIM':
      return String(args[0]).trim();
    case 'UPPER':
      return String(args[0]).toUpperCase();
    case 'LOWER':
      return String(args[0]).toLowerCase();
    default:
      return '#ERROR!';
  }
};