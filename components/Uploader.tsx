import React, { useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ProcessingState, AnalyzeStatus } from '../types';

interface UploaderProps {
  onUpload: (files: FileList) => void;
  processingState: ProcessingState;
}

export const Uploader: React.FC<UploaderProps> = ({ onUpload, processingState }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div className="mb-8">
      <div 
        onClick={processingState.status === AnalyzeStatus.PROCESSING ? undefined : handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${processingState.status === AnalyzeStatus.PROCESSING ? 'bg-slate-50 border-slate-300 cursor-not-allowed' : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 bg-white'}
        `}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="application/pdf" 
          multiple 
          onChange={handleChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {processingState.status === AnalyzeStatus.IDLE && (
            <>
              <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-700">Rechnungen hier ablegen</p>
                <p className="text-sm text-slate-500 mt-1">oder klicken, um PDFs auszuwählen</p>
              </div>
            </>
          )}

          {processingState.status === AnalyzeStatus.PROCESSING && (
            <>
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-600 font-medium">{processingState.message || "Analysiere Rechnungen..."}</p>
            </>
          )}

          {processingState.status === AnalyzeStatus.SUCCESS && (
            <>
               <div className="p-4 bg-green-100 rounded-full text-green-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-green-700 font-medium">Analyse erfolgreich!</p>
              <p className="text-xs text-slate-400">Klicken Sie, um weitere hinzuzufügen</p>
            </>
          )}

          {processingState.status === AnalyzeStatus.ERROR && (
            <>
              <div className="p-4 bg-red-100 rounded-full text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-red-600 font-medium">{processingState.message || "Fehler beim Upload"}</p>
              <p className="text-xs text-slate-400">Versuchen Sie es erneut</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};