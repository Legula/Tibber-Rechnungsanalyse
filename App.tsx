import React, { useState, useCallback } from 'react';
import { AnalyzeStatus, InvoiceData, ProcessingState } from './types';
import { analyzeInvoiceWithGemini } from './services/geminiService';
import { Uploader } from './components/Uploader';
import { MetricsCards } from './components/MetricsCards';
import { Charts } from './components/Charts';
import { InvoiceTable } from './components/InvoiceTable';
import { Zap } from 'lucide-react';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: AnalyzeStatus.IDLE
  });

  const handleUpload = useCallback(async (files: FileList) => {
    setProcessingState({ status: AnalyzeStatus.PROCESSING, message: 'Starte Analyse...' });
    
    const newInvoices: InvoiceData[] = [];
    let errorCount = 0;

    // Process files sequentially to avoid hitting rate limits too hard (though Gemini is fast)
    // or concurrently if we are confident. Let's do parallel for better UX but limit concurrency conceptually.
    
    const promises = Array.from(files).map(async (file, index) => {
      try {
        setProcessingState(prev => ({ 
            ...prev, 
            message: `Analysiere ${file.name} (${index + 1}/${files.length})...` 
        }));
        
        const data = await analyzeInvoiceWithGemini(file);
        
        // Add ID and filename
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
        // Simple deduplication logic could go here based on month/year
        // For now, we just append.
        return [...prev, ...newInvoices];
      });
      setProcessingState({ 
        status: AnalyzeStatus.SUCCESS, 
        message: `${newInvoices.length} Rechnungen erfolgreich analysiert.` 
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => setProcessingState({ status: AnalyzeStatus.IDLE }), 3000);
    } else {
      setProcessingState({ 
        status: AnalyzeStatus.ERROR, 
        message: 'Keine Daten konnten extrahiert werden.' 
      });
    }

  }, []);

  const handleDelete = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600">
              Tibber Analyzer 2025
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Text */}
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ihre Stromkosten im Blick</h2>
          <p className="text-slate-600">
            Laden Sie einfach Ihre Tibber PDF-Rechnungen hier hoch. Die KI extrahiert automatisch Verbrauchsdaten und Kosten, um Ihnen eine detaillierte Jahresübersicht zu erstellen.
          </p>
        </div>

        {/* Upload Section */}
        <Uploader onUpload={handleUpload} processingState={processingState} />

        {/* Dashboard Content - Only show if we have data */}
        {invoices.length > 0 ? (
          <div className="animate-fade-in space-y-8">
            <MetricsCards invoices={invoices} />
            <Charts invoices={invoices} />
            <InvoiceTable invoices={invoices} onDelete={handleDelete} />
          </div>
        ) : (
          <div className="text-center py-12">
             <div className="inline-block p-6 rounded-full bg-slate-100 mb-4">
               <Zap className="w-12 h-12 text-slate-300" />
             </div>
             <p className="text-slate-400">Noch keine Daten vorhanden. Laden Sie Rechnungen hoch, um zu starten.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;