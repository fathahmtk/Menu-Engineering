

import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';

type ImportStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';

interface ImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateUrl: string;
  templateFilename: string;
  parseFile: (fileContent: string) => Promise<{ data: T[]; errors: string[] }>;
  onImport: (data: T[]) => Promise<{ successCount: number; duplicateCount: number }>;
  renderPreview: (item: T, index: number) => React.ReactNode;
}

const ImportModal = <T extends {}>({
  isOpen,
  onClose,
  title,
  templateUrl,
  templateFilename,
  parseFile,
  onImport,
  renderPreview,
}: ImportModalProps<T>) => {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<T[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ successCount: number; duplicateCount: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const resetState = useCallback(() => {
    setStatus('idle');
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setImportResult(null);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setStatus('parsing');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const { data, errors } = await parseFile(text);
      setParsedData(data);
      setParseErrors(errors);
      setStatus('preview');
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleImportClick = async () => {
    setStatus('importing');
    const result = await onImport(parsedData);
    setImportResult(result);
    setStatus('complete');
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-muted)] text-sm">Upload a CSV file to import data. For correct formatting, please download and use our template.</p>
            <a href={templateUrl} download={templateFilename} className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline">
              <Download size={16} className="mr-2" />
              Download Template
            </a>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}
            >
              <input type="file" id="csv-upload" accept=".csv" className="hidden" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
              <label htmlFor="csv-upload" className="cursor-pointer w-full flex flex-col items-center">
                <Upload size={32} className="mx-auto text-[var(--color-text-muted)]" />
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-primary)]">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">CSV file</p>
              </label>
            </div>
          </div>
        );
      case 'parsing':
      case 'importing':
        return <div className="text-center p-8"><p>Processing...</p></div>;
      case 'preview':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[var(--color-input)] p-2 rounded-lg">
              <div className="flex items-center">
                <FileText size={18} className="mr-2 text-[var(--color-text-muted)]" />
                <p className="text-sm font-medium">{file?.name}</p>
              </div>
              <button onClick={resetState} className="text-sm font-semibold text-[var(--color-primary)] hover:underline">Choose another file</button>
            </div>
            {parseErrors.length > 0 && (
              <div className="bg-red-100 border border-red-200 p-3 rounded-lg">
                <h4 className="font-semibold text-[var(--color-danger)] flex items-center"><AlertTriangle size={16} className="mr-2" /> Found {parseErrors.length} potential issues:</h4>
                <ul className="list-disc list-inside text-sm text-red-800/90 mt-1 max-h-24 overflow-y-auto">
                  {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <h4 className="font-semibold">{parsedData.length} records found. Preview:</h4>
            <div className="max-h-60 overflow-y-auto border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)]">
              {parsedData.slice(0, 10).map(renderPreview)}
              {parsedData.length > 10 && <div className="p-2 text-center text-sm text-[var(--color-text-muted)]">...and {parsedData.length - 10} more.</div>}
            </div>
            <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
              <button onClick={handleClose} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
              <button onClick={handleImportClick} disabled={parsedData.length === 0} className={`ican-btn ican-btn-primary w-full md:w-auto ${parsedData.length === 0 ? 'ican-btn-disabled' : ''}`}>Import Data</button>
            </div>
          </div>
        );
      case 'complete':
        return (
          <div className="text-center space-y-4 py-4">
            <CheckCircle size={48} className="mx-auto text-[var(--color-success)]" />
            <h3 className="text-xl font-bold">Import Complete</h3>
            <p><span className="font-semibold text-[var(--color-success)]">{importResult?.successCount || 0}</span> records were successfully imported.</p>
            {importResult && importResult.duplicateCount > 0 && (
              <p className="text-[var(--color-text-muted)] text-sm flex items-center justify-center">
                <XCircle size={14} className="mr-2 text-[var(--color-warning)]" />
                <span className="font-semibold text-[var(--color-warning)]">{importResult.duplicateCount}</span> duplicates were skipped.
              </p>
            )}
            <div className="pt-4 w-full md:w-auto md:mx-auto">
              <button onClick={handleClose} className="ican-btn ican-btn-primary px-6 w-full md:w-auto">Done</button>
            </div>
          </div>
        );
    }
  };

  return <Modal isOpen={isOpen} onClose={handleClose} title={title}>{renderContent()}</Modal>;
};

export default ImportModal;
