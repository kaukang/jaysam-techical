import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Plus, Trash2, AlertCircle, CheckCircle2, Download } from 'lucide-react';

export default function AdminBulkProductsModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  categories 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSuccess: () => void,
  categories: any[]
}) {
  const [activeTab, setActiveTab] = useState<'form' | 'csv'>('form');
  
  // Dependencies state
  const [existingSkus, setExistingSkus] = useState<string[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  // Form State
  const [formProducts, setFormProducts] = useState([
    { name: '', brand: '', category_id: categories[0]?.id || '', sku: '', price: '', old_price: '', stock_quantity: '', description: '', status: 'active' }
  ]);
  const [savingForm, setSavingForm] = useState(false);

  // CSV State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<{row: number, message: string}[]>([]);
  const [csvPreview, setCsvPreview] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: number, failed: number, errors: string[]} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDependencies();
    }
  }, [isOpen]);

  const fetchDependencies = async () => {
    try {
      const { data: skuData } = await supabase.from('products').select('sku');
      if (skuData) {
        setExistingSkus(skuData.map(p => p.sku).filter(Boolean));
      }
      
      const { data: brandData } = await supabase.from('brands').select('id, name');
      if (brandData) {
        setBrands(brandData);
      }
    } catch (error) {
      if (error && error.code === 'PGRST205') {
        console.warn('Error fetching dependencies:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error fetching dependencies:', error);
      }
    }
  };

  if (!isOpen) return null;

  const handleAddFormRow = () => {
    setFormProducts([
      ...formProducts, 
      { name: '', brand: '', category_id: categories[0]?.id || '', sku: '', price: '', old_price: '', stock_quantity: '', description: '', status: 'active' }
    ]);
  };

  const handleRemoveFormRow = (index: number) => {
    const newProducts = [...formProducts];
    newProducts.splice(index, 1);
    setFormProducts(newProducts);
  };

  const handleFormChange = (index: number, field: string, value: any) => {
    const newProducts = [...formProducts];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormProducts(newProducts);
  };

  const validateProduct = (product: any, index: number, allData: any[]) => {
    if (!product.name || !product.name.trim()) return "Product name is required.";
    if (!product.brand || !product.brand.trim()) return "Brand is required.";
    if (!product.category_id) return "Category is required.";
    if (!product.sku || !product.sku.trim()) return "SKU is required.";
    
    const price = parseFloat(product.price);
    if (isNaN(price) || price < 0) return "Valid price is required.";
    
    const stock = parseInt(product.stock_quantity);
    if (isNaN(stock) || stock < 0) return "Valid stock quantity is required.";

    // Check SKU duplicates in current batch
    const duplicateInBatch = allData.findIndex((p, i) => i !== index && p.sku === product.sku);
    if (duplicateInBatch !== -1) return "Duplicate SKU in current list.";
    
    // Check SKU duplicates in database
    if (existingSkus.includes(product.sku)) return "SKU already exists in database.";
    
    return null;
  };

  const handleSaveForm = async () => {
    setSavingForm(true);
    
    // Filter out empty rows
    const filledProducts = formProducts.filter(p => p.name.trim() || p.sku.trim());
    
    if (filledProducts.length === 0) {
      alert("No products to add.");
      setSavingForm(false);
      return;
    }

    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    const validProducts = [];

    for (let i = 0; i < filledProducts.length; i++) {
      const error = validateProduct(filledProducts[i], i, filledProducts);
      if (error) {
        errors.push(`Row ${i + 1} (${filledProducts[i].name}): ${error}`);
        failedCount++;
      } else {
        validProducts.push({
          ...filledProducts[i],
          price: parseFloat(filledProducts[i].price),
          old_price: parseFloat(filledProducts[i].old_price) || 0,
          stock_quantity: parseInt(filledProducts[i].stock_quantity),
          is_featured: false
        });
      }
    }

    if (validProducts.length > 0) {
      const { error } = await supabase.from('products').insert(validProducts);
      if (error) {
        errors.push(`Database error: ${error.message}`);
        failedCount += validProducts.length;
      } else {
        successCount = validProducts.length;
      }
    }

    setImportResult({ success: successCount, failed: failedCount, errors });
    setSavingForm(false);
  };

  const downloadTemplate = () => {
    const headers = ['name', 'brand', 'category', 'sku', 'price', 'sale_price', 'stock', 'description', 'is_active'];
    const example1 = ['iPhone 16 Pro', 'Apple', categories[0]?.name || 'Smartphones', 'IP16PRO001', '120000', '115000', '10', 'Premium smartphone', 'true'];
    const example2 = ['Infinix Note 50', 'Infinix', categories[0]?.name || 'Smartphones', 'INFNOTE50', '45000', '42000', '15', 'Latest smartphone', 'true'];
    
    const csvContent = [headers.join(','), example1.join(','), example2.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const product: any = {};
      
      headers.forEach((header, index) => {
        product[header] = values[index];
      });

      // Transform for DB
      const dbProduct: any = {
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        description: product.description || '',
        status: ['true', '1', 'active', 'yes'].includes(product.is_active?.toLowerCase()) ? 'active' : 'inactive',
        is_featured: false
      };

      // Resolve category
      const cat = categories.find(c => c.name.toLowerCase() === product.category?.toLowerCase());
      if (cat) {
        dbProduct.category_id = cat.id;
      } else {
        dbProduct.category_id = '';
      }

      // Handle pricing (price -> old_price, sale_price -> price)
      const rawPrice = parseFloat(product.price);
      const rawSalePrice = parseFloat(product.sale_price);

      if (!isNaN(rawSalePrice) && rawSalePrice > 0) {
        dbProduct.price = rawSalePrice;
        dbProduct.old_price = !isNaN(rawPrice) ? rawPrice : 0;
      } else {
        dbProduct.price = !isNaN(rawPrice) ? rawPrice : 0;
        dbProduct.old_price = 0;
      }

      dbProduct.stock_quantity = parseInt(product.stock) || 0;

      // Validation
      if (!dbProduct.name || !dbProduct.name.trim()) errors.push({ row: i, message: "Product name is missing." });
      else if (!dbProduct.brand || !dbProduct.brand.trim()) errors.push({ row: i, message: "Brand is missing." });
      else if (!dbProduct.category_id) errors.push({ row: i, message: `Category '${product.category}' does not exist.` });
      else if (!dbProduct.sku || !dbProduct.sku.trim()) errors.push({ row: i, message: "SKU is missing." });
      else if (dbProduct.price <= 0) errors.push({ row: i, message: "Valid price is required." });
      else if (existingSkus.includes(dbProduct.sku)) {
        if (!updateExisting) {
          errors.push({ row: i, message: "SKU already exists in database. (Check 'Update Existing' to overwrite)" });
        }
      }
      else if (data.find(p => p.sku === dbProduct.sku)) errors.push({ row: i, message: "Duplicate SKU in CSV." });
      else {
        // Warning if brand doesn't exist (if they are tightly coupled), but here brand is a text field in products based on our schema exploration
        // The prompt asks to reference Samsung's brand ID if it exists, but the DB schema has `brand` as text in products (based on Home.tsx fetching).
        // Let's ensure the brand matches an existing brand name precisely if we want to enforce it.
        const brandMatch = brands.find(b => b.name.toLowerCase() === product.brand?.toLowerCase());
        if (!brandMatch) {
          errors.push({ row: i, message: `Brand '${product.brand}' does not exist in Brands list.` });
        } else {
          dbProduct.brand = brandMatch.name; // normalize to actual brand name case
        }
      }

      // Save row for preview
      dbProduct._originalCategory = product.category;
      data.push(dbProduct);
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
    const activeErrors = csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists')));
    const validRows = csvData.filter((_, index) => !activeErrors.find(e => e.row === index + 1));
    
    let successCount = 0;
    let failedCount = activeErrors.length;
    const errors = activeErrors.map(e => `Row ${e.row}: ${e.message}`);

    if (validRows.length > 0) {
      // Remove preview helper fields
      const rowsToInsert = validRows.map(({ _originalCategory, ...rest }) => rest);
      
      const { error } = await supabase.from('products').upsert(rowsToInsert, { onConflict: 'sku' });
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
    setFormProducts([{ name: '', brand: '', category_id: categories[0]?.id || '', sku: '', price: '', old_price: '', stock_quantity: '', description: '', status: 'active' }]);
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-[#082B52]">Bulk Add Products</h2>
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
                ✓ Successfully imported {importResult.success} products.<br/>
                {importResult.failed > 0 && <span>⚠ {importResult.failed} products skipped.</span>}
              </p>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
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
                View Products
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-slate-200 px-6">
              <div className="flex">
                <button
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'form' ? 'border-[#087FF5] text-[#087FF5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => { setActiveTab('form'); setCsvPreview(false); }}
                >
                  Multiple Products Form
                </button>
                <button
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'csv' ? 'border-[#087FF5] text-[#087FF5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('csv')}
                >
                  Import from CSV
                </button>
              </div>
              {activeTab === 'csv' && !csvPreview && (
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#087FF5] hover:text-[#0666C5]"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              {activeTab === 'form' ? (
                <div className="space-y-6">
                  {formProducts.map((product, index) => (
                    <div key={index} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm relative">
                      <button
                        onClick={() => handleRemoveFormRow(index)}
                        disabled={formProducts.length === 1}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                      <h4 className="font-medium text-slate-700 mb-4">Product {index + 1}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleFormChange(index, 'name', e.target.value)}
                            placeholder="e.g. iPhone 16 Pro"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Brand</label>
                          <select
                            value={product.brand}
                            onChange={(e) => handleFormChange(index, 'brand', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                          >
                            <option value="">Select Brand...</option>
                            {brands.map(b => (
                              <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                          <select
                            value={product.category_id}
                            onChange={(e) => handleFormChange(index, 'category_id', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">SKU</label>
                          <input
                            type="text"
                            value={product.sku}
                            onChange={(e) => handleFormChange(index, 'sku', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Regular Price</label>
                          <input
                            type="number"
                            value={product.old_price}
                            onChange={(e) => handleFormChange(index, 'old_price', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Sale Price</label>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => handleFormChange(index, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Stock</label>
                          <input
                            type="number"
                            value={product.stock_quantity}
                            onChange={(e) => handleFormChange(index, 'stock_quantity', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleAddFormRow}
                    className="flex items-center gap-2 text-[#087FF5] font-medium hover:text-[#0666C5]"
                  >
                    <Plus size={18} /> Add Another Product
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {!csvPreview ? (
                    <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center">
                      <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Upload size={24} className="text-slate-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Products CSV</h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                        CSV must contain headers: name, brand, category, sku, price, sale_price, stock, description, is_active
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
                        <h3 className="font-medium text-slate-800">PRODUCT IMPORT PREVIEW</h3>
                        <div className="text-sm">
                          <span className="text-emerald-600 font-medium">Valid: {csvData.length - csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists'))).length}</span>
                          <span className="text-slate-300 mx-2">|</span>
                          <span className="text-red-600 font-medium">Errors: {csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists'))).length}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-medium w-12">#</th>
                                <th className="px-4 py-3 font-medium">Product</th>
                                <th className="px-4 py-3 font-medium">Brand</th>
                                <th className="px-4 py-3 font-medium">Category</th>
                                <th className="px-4 py-3 font-medium">SKU</th>
                                <th className="px-4 py-3 font-medium">Price</th>
                                <th className="px-4 py-3 font-medium">Stock</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {csvData.map((product, index) => {
                                const rowError = csvErrors.find(e => e.row === index + 1 && !(updateExisting && e.message.includes('SKU already exists')));
                                return (
                                  <React.Fragment key={index}>
                                    <tr className={rowError ? "bg-red-50/50" : ""}>
                                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                      <td className="px-4 py-3 font-medium">{product.name}</td>
                                      <td className="px-4 py-3">{product.brand}</td>
                                      <td className="px-4 py-3">{product._originalCategory}</td>
                                      <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                                      <td className="px-4 py-3">{product.price?.toLocaleString()}</td>
                                      <td className="px-4 py-3">{product.stock_quantity}</td>
                                    </tr>
                                    {rowError && (
                                      <tr className="bg-red-50/50 border-t-0">
                                        <td colSpan={7} className="px-4 py-2 pb-3 whitespace-normal">
                                          <div className="flex items-center gap-2 text-sm text-red-600">
                                            <AlertCircle size={14} className="flex-shrink-0" />
                                            <span>⚠ Row {rowError.row} — {product.name || 'Unknown'}: {rowError.message}</span>
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
                        <div className="flex items-center gap-2 mr-4 text-sm text-slate-700">
     <input type="checkbox" id="update-existing" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
     <label htmlFor="update-existing" className="cursor-pointer">Update existing SKUs</label>
   </div>
   <button onClick={handleImportCSV} disabled={importing || csvData.length === 0} className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
     {importing ? 'Importing...' : `Import ${csvData.length - csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists'))).length} Products`}
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
                  {savingForm ? 'Saving...' : 'Save All Products'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
