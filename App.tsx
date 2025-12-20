
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AnalyzeStatus, InvoiceData, ProcessingState } from './types';
import { analyzeInvoiceWithGemini } from './services/geminiService';
import { Uploader } from './components/Uploader';
import { MetricsCards } from './components/MetricsCards';
import { Charts } from './components/Charts';
import { InvoiceTable } from './components/InvoiceTable';
import { Zap, LayoutDashboard, History, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'tibber_analyzer_data';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: AnalyzeStatus.IDLE
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch (e) {
        console.error("Fehler beim Laden der gespeicherten Daten", e);
      }
    }
  }, []);

  // Save to localStorage whenever invoices change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices]);

  const handleUpload = useCallback(async (files: FileList) => {
    setProcessingState({ status: AnalyzeStatus.PROCESSING, message: 'Starte Analyse...' });
    
    const newInvoices: InvoiceData[] = [];
    let errorCount = 0;

    const promises = Array.from(files).map(async (file, index) => {
      try {
        setProcessingState(prev => ({ 
            ...prev, 
            message: `Analysiere ${file.name} (${index + 1}/${files.length})...` 
        }));
        
        const data = await analyzeInvoiceWithGemini(file);
        
        newInvoices.push({
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          fileName: file.name
        });

      } catch (err) {
        console.error(err);
        errorCount++;
      }
    });

    await Promise.all(promises);

    if (newInvoices.length > 0) {
      setInvoices(prev => {
        // Simple duplicate check based on month and year
        const filteredNew = newInvoices.filter(newInv => 
          !prev.some(oldInv => oldInv.month === newInv.month && oldInv.year === newInv.year)
        );
        return [...prev, ...filteredNew].sort((a, b) => {
           if (a.year !== b.year) return a.year - b.year;
           return a.monthIndex - b.monthIndex;
        });
      });
      
      setProcessingState({ 
        status: AnalyzeStatus.SUCCESS, 
        message: `${newInvoices.length} Rechnungen verarbeitet.` 
      });
      
      setTimeout(() => setProcessingState({ status: AnalyzeStatus.IDLE }), 3000);
    } else {
      setProcessingState({ 
        status: AnalyzeStatus.ERROR, 
        message: 'Keine neuen Daten konnten extrahiert werden.' 
      });
    }
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diese Rechnung wirklich löschen?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm("Möchten Sie ALLE gespeicherten Daten unwiderruflich löschen?")) {
      setInvoices([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const availableYears = useMemo(() => {
    // Fixed: Explicitly type the sort parameters to prevent 'unknown' type error on localeCompare
    const years = Array.from(new Set(invoices.map(inv => inv.year.toString())));
    return years.sort((a: string, b: string) => b.localeCompare(a));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (selectedYear === 'all') return invoices;
    return invoices.filter(inv => inv.year.toString() === selectedYear);
  }, [invoices, selectedYear]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600">
              Tibber Historie
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {invoices.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="text-slate-400 hover:text-red-500 transition-colors p-2 text-xs flex items-center gap-1"
                title="Alle Daten löschen"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Daten zurücksetzen</span>
              </button>
            )}
            <div className="text-sm text-slate-500 hidden md:block border-l pl-4 border-slate-200">
              KI-Analyse aktiv
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Historische Stromdaten</h2>
            <p className="text-slate-600 mb-6">
              Laden Sie Ihre monatlichen Rechnungen hoch, um Ihre langfristige Verbrauchs-Historie zu pflegen. Daten werden lokal in Ihrem Browser gespeichert.
            </p>
            <Uploader onUpload={handleUpload} processingState={processingState} />
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm self-start">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Zeitraum wählen
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedYear('all')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${selectedYear === 'all' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                Gesamte Historie
              </button>
              {availableYears.map(year => (
                <button 
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${selectedYear === year ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  Jahr {year}
                </button>
              ))}
            </div>
            {invoices.length === 0 && (
              <p className="text-xs text-slate-400 mt-4 italic text-center">
                Noch keine Daten vorhanden.
              </p>
            )}
          </div>
        </div>

        {invoices.length > 0 ? (
          <div className="animate-fade-in space-y-8">
            <MetricsCards invoices={filteredInvoices} />
            <Charts invoices={filteredInvoices} isAllYears={selectedYear === 'all'} />
            <InvoiceTable invoices={filteredInvoices} onDelete={handleDelete} />
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
             <div className="inline-block p-6 rounded-full bg-slate-50 mb-4">
               <LayoutDashboard className="w-12 h-12 text-slate-300" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">Bereit für die Analyse</h3>
             <p className="text-slate-400 max-w-xs mx-auto">Laden Sie Ihre erste Tibber Rechnung hoch, um das Dashboard zu aktivieren.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
