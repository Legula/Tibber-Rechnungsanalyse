export interface InvoiceData {
  id: string;
  month: string; // e.g., "Januar"
  monthIndex: number; // 0-11 for sorting
  year: number;
  consumptionKwh: number;
  totalCost: number;
  avgPriceCent: number; // Calculated or extracted: totalCost / consumptionKwh * 100
  fileName: string;
}

export enum AnalyzeStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ProcessingState {
  status: AnalyzeStatus;
  message?: string;
}