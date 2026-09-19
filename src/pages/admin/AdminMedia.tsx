import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, Trash2, Copy, Search, Loader } from 'lucide-react';

export default function AdminMedia() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from('media').list();
      
      if (error) throw error;
      
      // Filter out empty placeholder files
      const validFiles = data?.filter(file => file.name !== '.emptyFolderPlaceholder') || [];
      
      // Generate public URLs for all files
      const filesWithUrls = validFiles.map(file => {
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(file.name);
        return {
          ...file,
          publicUrl
        };
      });
      
      // Sort by created_at desc
      filesWithUrls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setFiles(filesWithUrls);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm('Are you sure you want to delete this file? This may break images currently used on the website.')) return;
    
    try {
      const { error } = await supabase.storage.from('media').remove([fileName]);
      if (error) throw error;
      
      setFiles(files.filter(f => f.name !== fileName));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copied to clipboard!');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#082B52]">Media Library</h1>
        <div className="text-sm text-slate-500">
          Upload new media through the Products or Categories sections.
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 text-[#087FF5] animate-spin mb-4" />
            <p className="text-slate-500">Loading media files...</p>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="group border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col">
                <div className="aspect-square bg-white flex items-center justify-center p-2 relative">
                  <img 
                    src={file.publicUrl} 
                    alt={file.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => copyToClipboard(file.publicUrl)}
                      className="p-2 bg-white rounded-full text-slate-700 hover:text-[#087FF5] transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(file.name)}
                      className="p-2 bg-white rounded-full text-slate-700 hover:text-red-600 transition-colors"
                      title="Delete File"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-3 text-xs border-t border-slate-200">
                  <p className="font-medium text-slate-700 truncate" title={file.name}>{file.name}</p>
                  <p className="text-slate-500 mt-1">{formatSize(file.metadata?.size || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No media files found</h3>
            <p className="text-slate-500">Upload images while creating products or categories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
