
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AnalyzeStatus, InvoiceData, ProcessingState } from './types';
import { analyzeInvoiceWithGemini } from './services/geminiService';
import { Uploader } from './components/Uploader';
import { MetricsCards } from './components/MetricsCards';
import { Charts } from './components/Charts';
import { InvoiceTable } from './components/InvoiceTable';
import { Zap, LayoutDashboard, History, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'strom_analyzer_data';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: AnalyzeStatus.IDLE
  });

  // Load and sanitize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: InvoiceData[] = JSON.parse(saved);
        
        // Sanitize: Remove any accidental duplicates that might have been saved
        const uniqueInvoices = parsed.reduce((acc: InvoiceData[], current) => {
          const x = acc.find(item => item.monthIndex === current.monthIndex && item.year === current.year);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        setInvoices(uniqueInvoices);
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
        console.error("Fehler bei Datei " + file.name, err);
      }
    });

    await Promise.all(promises);

    if (newInvoices.length > 0) {
      setInvoices(prev => {
        // Robust duplicate check based on monthIndex and year
        const filteredNew = newInvoices.filter(newInv => 
          !prev.some(oldInv => oldInv.monthIndex === newInv.monthIndex && oldInv.year === newInv.year)
        );
        
        const updated = [...prev, ...filteredNew].sort((a, b) => {
           if (a.year !== b.year) return a.year - b.year;
           return a.monthIndex - b.monthIndex;
        });
        
        return updated;
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
    if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      setInvoices(currentInvoices => {
        const filtered = currentInvoices.filter(inv => inv.id !== id);
        return filtered;
      });
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Möchten Sie ALLE gespeicherten Daten unwiderruflich löschen?")) {
      setInvoices([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const availableYears = useMemo(() => {
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
              Smart Strom-Analyzer
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
              Multi-Anbieter KI-Analyse
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ihre Stromverbrauchs-Historie</h2>
            <p className="text-slate-600 mb-6">
              Laden Sie Ihre PDF-Stromrechnungen hoch. Unsere KI extrahiert Kosten und Verbrauch für Ihr persönliches Dashboard.
            </p>
            <Uploader onUpload={handleUpload} processingState={processingState} />
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm self-start">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Zeitraum filtern
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
             <h3 className="text-lg font-medium text-slate-900">Keine Daten vorhanden</h3>
             <p className="text-slate-400 max-w-xs mx-auto">Laden Sie eine Stromrechnung hoch, um die Analyse zu starten.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
