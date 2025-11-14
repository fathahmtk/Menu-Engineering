import React, { useState, useCallback } from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PricedItem } from '../types';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, Tags } from 'lucide-react';
import { useNotification } from '../hooks/useNotificationContext';

type ImportStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';
type PricedItemUpload = Omit<PricedItem, 'id' | 'businessId'>;

const ITEM_CATEGORIES: PricedItem['category'][] = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Seafood'];

const PriceList: React.FC = () => {
    const { pricedItems, uploadPriceList } = useData();
    const { formatCurrency } = useCurrency();
    const { addNotification } = useNotification();

    const [status, setStatus] = useState<ImportStatus>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<PricedItemUpload[]>([]);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);

    const resetUploaderState = useCallback(() => {
        setStatus('idle');
        setFile(null);
        setParsedData([]);
        setParseErrors([]);
    }, []);

    const parsePriceListFile = async (fileContent: string): Promise<{ data: PricedItemUpload[]; errors: string[] }> => {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].trim().split(',').map(h => h.replace(/"/g, '').trim());
        const requiredHeaders = ['name', 'category', 'unit', 'unitCost'];
        const errors: string[] = [];
        
        requiredHeaders.forEach(h => {
            if (!headers.includes(h)) errors.push(`Missing required header: ${h}`);
        });

        if (errors.length > 0) return { data: [], errors };

        const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const item: any = {};
            headers.forEach((header, i) => item[header] = values[i]);
            
            const category = item.category as PricedItem['category'];
            if (!ITEM_CATEGORIES.includes(category)) {
                errors.push(`Row ${index + 2}: Invalid category "${item.category}".`);
            }
            const unitCost = parseFloat(item.unitCost);
            if (isNaN(unitCost) || unitCost < 0) {
                 errors.push(`Row ${index + 2}: Invalid unitCost "${item.unitCost}". Must be a non-negative number.`);
            }

            return {
                name: item.name,
                category: ITEM_CATEGORIES.includes(category) ? category : 'Pantry',
                unit: item.unit,
                unitCost: unitCost,
            };
        }).filter(item => item.name && !isNaN(item.unitCost));
        
        return { data, errors };
    };

    const handleFileChange = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setStatus('parsing');
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const { data, errors } = await parsePriceListFile(text);
            setParsedData(data);
            setParseErrors(errors);
            setStatus('preview');
        };
        reader.readAsText(selectedFile);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleImportClick = async () => {
        if (!window.confirm(`This will replace your current price list of ${pricedItems.length} items with ${parsedData.length} new items. Are you sure you want to continue?`)) {
            return;
        }
        setStatus('importing');
        const result = await uploadPriceList(parsedData);
        addNotification(`${result.successCount} items have been imported successfully. Your price list is updated.`, 'success');
        resetUploaderState();
    };

    const renderUploader = () => {
        switch (status) {
            case 'idle':
                return (
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
                        <p className="text-xs text-[var(--color-text-muted)]">CSV file with your price list</p>
                      </label>
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
                        <button onClick={resetUploaderState} className="text-sm font-semibold text-[var(--color-primary)] hover:underline">Choose another file</button>
                        </div>
                        {parseErrors.length > 0 && (
                        <div className="bg-red-100 border border-red-200 p-3 rounded-lg">
                            <h4 className="font-semibold text-[var(--color-danger)] flex items-center"><AlertTriangle size={16} className="mr-2" /> Found {parseErrors.length} potential issues:</h4>
                            <ul className="list-disc list-inside text-sm text-red-800/90 mt-1 max-h-24 overflow-y-auto">
                            {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                        )}
                        <h4 className="font-semibold">{parsedData.length} records found.</h4>
                        <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={resetUploaderState} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleImportClick} disabled={parsedData.length === 0} className={`ican-btn ican-btn-primary w-full md:w-auto ${parsedData.length === 0 ? 'ican-btn-disabled' : ''}`}>
                            Upload and Replace
                        </button>
                        </div>
                    </div>
                 );
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold">Upload Price List</h2>
                <p className="text-[var(--color-text-muted)] text-sm mt-1 mb-4">Upload a CSV file to set or replace your current price list. This list will be used for all recipe cost calculations.</p>
                <a href="data:text/csv;charset=utf-8,name,category,unit,unitCost%0AExample%20Chicken,Meat,kg,18.50" download="price_list_template.csv" className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline">
                    <Download size={16} className="mr-2" />
                    Download Template (name, category, unit, unitCost)
                </a>
                {renderUploader()}
            </Card>
            <Card>
                 <h2 className="text-xl font-bold mb-4">Current Price List ({pricedItems.length} items)</h2>
                 <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left responsive-table">
                        <thead className="ican-table-header sticky top-0">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Name</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Category</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Unit</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap text-right">Unit Cost</th>
                            </tr>
                        </thead>
                         <tbody>
                        {pricedItems.length > 0 ? pricedItems.map(item => {
                            return (
                                <tr key={item.id} className="border-b border-[var(--color-border)] last:border-b-0 transition-colors hover:bg-[var(--color-input)]">
                                    <td data-label="Name" className="p-4 font-medium text-[var(--color-text-primary)] whitespace-nowrap">{item.name}</td>
                                    <td data-label="Category" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.category}</td>
                                    <td data-label="Unit" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.unit}</td>
                                    <td data-label="Unit Cost" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap text-right font-mono">{formatCurrency(item.unitCost)}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} className="text-center py-10">
                                     <div className="flex flex-col items-center text-[var(--color-text-muted)]">
                                        <Tags size={40} className="mb-2 text-[var(--color-border)]"/>
                                        <p className="font-semibold">Your price list is empty.</p>
                                        <p className="text-sm">Upload a CSV file above to get started.</p>
                                     </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                 </div>
            </Card>
        </div>
    );
};

export default PriceList;
