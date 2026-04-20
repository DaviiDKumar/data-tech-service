"use client";
import { useState, useRef } from "react";
import { uploadBulkResumes } from "@/app/actions/resume";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Upload, 
  FileCheck,
  XCircle,
  Loader2,
  Zap
} from "lucide-react";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
    // Naya selection aate hi purana status clear taaki confusion na ho
    if(uploadResults) setUploadResults(null); 
  };

 const handleUpload = async () => {
  if (selectedFiles.length === 0) return;
  
  setIsUploading(true);
  let uploadedCount = 0;
  const total = selectedFiles.length;

  // Instead of one big bulk call, we loop through them
  // This prevents Vercel's 15-second timeout
  for (const file of selectedFiles) {
    const formData = new FormData();
    formData.append("files", file); // Your action expects 'files' array

    const result = await uploadBulkResumes(formData);
    
    if (result.success) {
      uploadedCount++;
      // Update progress based on actual file completion
      setProgress(Math.round((uploadedCount / total) * 100));
    } else {
      console.error(`Failed to upload ${file.name}:`, result.error);
    }
  }

  // Finish up
  setTimeout(() => {
    setUploadResults({ success: true, count: uploadedCount });
    setIsUploading(false);
    setProgress(0);
    setSelectedFiles([]); 
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, 600);
};

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Upload <span className="text-blue-600">Resumes Page</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium italic">
          Bulk upload PDF files directly to the system pool
        </p>
      </div>

      {/* --- UPLOAD BOX (Always Active) --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm relative overflow-hidden">
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept=".pdf" 
          id="resume-upload" 
          className="hidden" 
          onChange={handleFileChange} 
        />
        
        <label htmlFor="resume-upload" className="cursor-pointer block group">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <Upload size={28} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-800 uppercase tracking-tight">
            {selectedFiles.length > 0 ? `${selectedFiles.length} Files Selected` : "Select Files"}
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium italic">
            {selectedFiles.length > 0 ? "Ready for upload" : "Click to browse PDF files"}
          </p>
        </label>

        {selectedFiles.length > 0 && !isUploading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex justify-center gap-3"
          >
            <button 
              onClick={() => { setSelectedFiles([]); if(fileInputRef.current) fileInputRef.current.value=""; }}
              className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-all uppercase"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload} 
              className="px-8 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Zap size={14} /> Start Upload
            </button>
          </motion.div>
        )}

        {/* PROGRESS BAR */}
        <AnimatePresence>
          {isUploading && (
             <div className="mt-8 max-w-xs mx-auto space-y-2">
               <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase tracking-widest">
                 <span className="flex items-center gap-2">
                   <Loader2 size={10} className="animate-spin" /> Processing...
                 </span>
                 <span>{progress}%</span>
               </div>
               <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progress}%` }} 
                    className="bg-blue-600 h-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                 />
               </div>
             </div>
          )}
        </AnimatePresence>
      </div>

      {/* --- RECENT UPLOAD RESULTS --- */}
      <AnimatePresence mode="wait">
        {uploadResults && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Status Notification */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm ${
              uploadResults.success 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-3">
                {uploadResults.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wide">
                    {uploadResults.count || 0} Successful | {uploadResults.duplicateCount || 0} Skipped
                  </span>
                  <p className="text-[10px] font-medium opacity-80 uppercase tracking-tighter">
                    {uploadResults.message}
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-bold bg-white/60 px-2 py-1 rounded border border-current opacity-70">
                Batch: {uploadResults.totalSelected}
              </div>
            </div>

            {/* Individual File List */}
            <div className="grid grid-cols-1 gap-2">
              {uploadResults.data && uploadResults.data.length > 0 ? (
                uploadResults.data.map((file, i) => (
                  <motion.div 
                    key={file.uniqueId} 
                    initial={{ opacity: 0, x: -5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.02 }}
                    className="bg-white border border-slate-200 p-3 px-5 rounded-xl flex items-center justify-between hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <FileText size={18} className="text-slate-300" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">{file.originalName}</p>
                        <p className="text-[9px] text-slate-400 font-mono">UUID: {file.uniqueId.slice(0, 18)}...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase">
                        RES-{String(file.resumeNo).padStart(3, '0')}
                      </span>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    </div>
                  </motion.div>
                ))
              ) : (
                /* No New Files Card */
                <div className="p-10 text-center bg-slate-100 border border-slate-200 rounded-2xl">
                  <XCircle size={30} className="text-slate-300 mx-auto mb-2" />
                  <h4 className="text-slate-500 font-bold text-sm uppercase">No New Data Added</h4>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">All selected files were duplicates.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}