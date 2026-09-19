import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminBulkBrandsModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  existingBrands 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSuccess: () => void,
  existingBrands: any[]
}) {
  const [activeTab, setActiveTab] = useState<'form' | 'csv'>('form');
  
  // Form State
  const [formBrands, setFormBrands] = useState([
    { name: '', slug: '', is_active: true, display_order: existingBrands.length + 1 }
  ]);
  const [savingForm, setSavingForm] = useState(false);

  // CSV State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<{row: number, message: string}[]>([]);
  const [csvPreview, setCsvPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: number, failed: number, errors: string[]} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddFormRow = () => {
    setFormBrands([
      ...formBrands, 
      { name: '', slug: '', is_active: true, display_order: existingBrands.length + formBrands.length + 1 }
    ]);
  };

  const handleRemoveFormRow = (index: number) => {
    const newBrands = [...formBrands];
    newBrands.splice(index, 1);
    setFormBrands(newBrands);
  };

  const handleFormChange = (index: number, field: string, value: any) => {
    const newBrands = [...formBrands];
    newBrands[index] = { ...newBrands[index], [field]: value };
    
    // Auto-generate slug if name changed and slug is empty
    if (field === 'name' && !newBrands[index].slug) {
      newBrands[index].slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    setFormBrands(newBrands);
  };

  const validateBrand = (brand: any, index: number, allData: any[]) => {
    if (!brand.name || !brand.name.trim()) return "Brand name is missing.";
    if (!brand.slug || !brand.slug.trim()) return "Brand slug is missing.";
    
    // Check duplicates in current batch
    const duplicateInBatch = allData.findIndex((b, i) => i !== index && (b.name === brand.name || b.slug === brand.slug));
    if (duplicateInBatch !== -1) return "Duplicate brand in current list.";
    
    // Check duplicates in database
    const duplicateInDb = existingBrands.find(b => b.name === brand.name || b.slug === brand.slug);
    if (duplicateInDb) return "Brand already exists in database.";
    
    return null;
  };

  const handleSaveForm = async () => {
    setSavingForm(true);
    
    // Filter out completely empty rows
    const filledBrands = formBrands.filter(b => b.name.trim() || b.slug.trim());
    
    if (filledBrands.length === 0) {
      alert("No brands to add.");
      setSavingForm(false);
      return;
    }

    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    const validBrands = [];

    for (let i = 0; i < filledBrands.length; i++) {
      const error = validateBrand(filledBrands[i], i, filledBrands);
      if (error) {
        errors.push(`Row ${i + 1} (${filledBrands[i].name}): ${error}`);
        failedCount++;
      } else {
        validBrands.push(filledBrands[i]);
      }
    }

    if (validBrands.length > 0) {
      const { error } = await supabase.from('brands').insert(validBrands);
      if (error) {
        errors.push(`Database error: ${error.message}`);
        failedCount += validBrands.length;
      } else {
        successCount = validBrands.length;
      }
    }

    setImportResult({ success: successCount, failed: failedCount, errors });
    setSavingForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) {
      alert("CSV file seems empty or invalid.");
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: any[] = [];
    const errors: {row: number, message: string}[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      const brand: any = {};
      
      headers.forEach((header, index) => {
        if (header === 'is_active') {
          brand[header] = ['true', '1', 'active', 'yes'].includes(values[index]?.toLowerCase());
        } else if (header === 'display_order') {
          brand[header] = parseInt(values[index]) || 0;
        } else {
          brand[header] = values[index];
        }
      });

      // Defaults
      if (brand.is_active === undefined) brand.is_active = true;
      if (!brand.display_order) brand.display_order = existingBrands.length + data.length + 1;

      // Validate
      const error = validateBrand(brand, data.length, data);
      if (error) {
        errors.push({ row: i, message: error });
      }

      data.push(brand);
    }

    setCsvData(data);
    setCsvErrors(errors);
    setCsvPreview(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportCSV = async () => {
    setImporting(true);
    
    // Only import valid rows
    const validRows = csvData.filter((_, index) => !csvErrors.find(e => e.row === index + 1));
    
    let successCount = 0;
    let failedCount = csvErrors.length;
    const errors = csvErrors.map(e => `Row ${e.row}: ${e.message}`);

    if (validRows.length > 0) {
      const { error } = await supabase.from('brands').insert(validRows);
      if (error) {
        errors.push(`Database error: ${error.message}`);
        failedCount += validRows.length;
      } else {
        successCount = validRows.length;
      }
    }

    setImportResult({ success: successCount, failed: failedCount, errors });
    setImporting(false);
  };

  const resetState = () => {
    setFormBrands([{ name: '', slug: '', is_active: true, display_order: existingBrands.length + 1 }]);
    setCsvData([]);
    setCsvErrors([]);
    setCsvPreview(false);
    setImportResult(null);
  };

  const handleClose = () => {
    if (importResult?.success) {
      onSuccess();
    }
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-[#082B52]">Bulk Add Brands</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {importResult ? (
          <div className="p-6 overflow-y-auto">
            <div className="text-center mb-8">
              {importResult.success > 0 ? (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 size={32} />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                  <AlertCircle size={32} />
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-800">Import Complete</h3>
              <p className="text-slate-600 mt-2">
                ✓ Successfully imported {importResult.success} brands.<br/>
                {importResult.failed > 0 && <span>⚠ {importResult.failed} brands skipped.</span>}
              </p>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Errors & Skipped Rows:</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex border-b border-slate-200 px-6">
              <button
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'form' ? 'border-[#087FF5] text-[#087FF5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => { setActiveTab('form'); setCsvPreview(false); }}
              >
                Multiple Brands Form
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'csv' ? 'border-[#087FF5] text-[#087FF5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('csv')}
              >
                Import from CSV
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              {activeTab === 'form' ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Slug</th>
                          <th className="px-4 py-3 font-medium w-32">Status</th>
                          <th className="px-4 py-3 font-medium w-24">Display</th>
                          <th className="px-4 py-3 font-medium w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formBrands.map((brand, index) => (
                          <tr key={index} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={brand.name}
                                onChange={(e) => handleFormChange(index, 'name', e.target.value)}
                                placeholder="e.g. Nokia"
                                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] min-w-[150px]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={brand.slug}
                                onChange={(e) => handleFormChange(index, 'slug', e.target.value)}
                                placeholder="e.g. nokia"
                                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] min-w-[150px]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={brand.is_active ? 'true' : 'false'}
                                onChange={(e) => handleFormChange(index, 'is_active', e.target.value === 'true')}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] min-w-[100px]"
                              >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={brand.display_order}
                                onChange={(e) => handleFormChange(index, 'display_order', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] min-w-[80px]"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveFormRow(index)}
                                disabled={formBrands.length === 1}
                                className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <button
                    onClick={handleAddFormRow}
                    className="flex items-center gap-2 text-[#087FF5] font-medium hover:text-[#0666C5]"
                  >
                    <Plus size={18} /> Add Another Brand
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {!csvPreview ? (
                    <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center">
                      <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Upload size={24} className="text-slate-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Upload CSV File</h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                        CSV must contain headers: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">name</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">slug</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">is_active</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">display_order</code>
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Select File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <h3 className="font-medium text-slate-800">IMPORT PREVIEW</h3>
                        <div className="text-sm">
                          <span className="text-emerald-600 font-medium">Valid: {csvData.length - csvErrors.length}</span>
                          <span className="text-slate-300 mx-2">|</span>
                          <span className="text-red-600 font-medium">Errors: {csvErrors.length}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-medium w-12">#</th>
                                <th className="px-4 py-3 font-medium">Brand</th>
                                <th className="px-4 py-3 font-medium">Slug</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Order</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {csvData.map((brand, index) => {
                                const rowError = csvErrors.find(e => e.row === index + 1);
                                return (
                                  <React.Fragment key={index}>
                                    <tr className={rowError ? "bg-red-50/50" : ""}>
                                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                      <td className="px-4 py-3 font-medium">{brand.name}</td>
                                      <td className="px-4 py-3 text-slate-500">{brand.slug}</td>
                                      <td className="px-4 py-3">
                                        {brand.is_active ? 
                                          <span className="text-emerald-600">Active</span> : 
                                          <span className="text-slate-500">Inactive</span>
                                        }
                                      </td>
                                      <td className="px-4 py-3 text-slate-500">{brand.display_order}</td>
                                    </tr>
                                    {rowError && (
                                      <tr className="bg-red-50/50 border-t-0">
                                        <td colSpan={5} className="px-4 py-2 pb-3 whitespace-normal">
                                          <div className="flex items-center gap-2 text-sm text-red-600">
                                            <AlertCircle size={14} className="flex-shrink-0" />
                                            <span>⚠ Row {rowError.row} — {brand.name || 'Unknown'}: {rowError.message}</span>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => { setCsvPreview(false); setCsvData([]); setCsvErrors([]); }}
                          className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                        >
                          Cancel / Upload New
                        </button>
                        <button
                          onClick={handleImportCSV}
                          disabled={importing || csvData.length === 0}
                          className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {importing ? 'Importing...' : `Import ${csvData.length - csvErrors.length} Brands`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeTab === 'form' && (
              <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 bg-white">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveForm}
                  disabled={savingForm}
                  className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {savingForm ? 'Saving...' : 'Save All Brands'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
