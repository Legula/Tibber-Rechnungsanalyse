
export interface InvoiceData {
  id: string;
  month: string;
  monthIndex: number;
  year: number;
  consumptionKwh: number;
  totalCost: number;
  avgPriceCent: number;
  fileName: string;
  provider: string; // Name des Stromanbieters
  // Preisbestandteile
  baseFeeCost: number;       // Fixer Grundpreis
  workingPriceCost: number;  // Kosten für verbrauchte Energie (Arbeitspreis)
  gridFeesCost: number;      // Netzentgelte (falls separat ausgewiesen)
  taxesAndLeviesCost: number; // Steuern, Abgaben, Umlagen
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
