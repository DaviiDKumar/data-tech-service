"use client";

import { useState, useRef, useEffect } from "react";
import { uploadBulkResumes } from "@/app/actions/resume";
import { motion, AnimatePresence } from "framer-motion";
import { passero, robotoSlab } from "@/lib/fonts";
import {
  AlertCircle,
  FileText,
  Upload,
  XCircle,
  Loader2,
  Zap,
  ShieldCheck,
} from "lucide-react";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadPhase, setUploadPhase] = useState("idle");
  const fileInputRef = useRef(null);
  const [currentTime, setCurrentTime] = useState("");

  // Ticking clock
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
    if (uploadResults) setUploadResults(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    setUploadPhase("uploading");

    let masterResults = {
      success: true,
      count: 0,
      duplicateCount: 0,
      data: [],
      errors: []
    };

    // Process 5 files at a time to prevent local connection choking
    const FILE_BATCH_LIMIT = 5;
    const totalFiles = selectedFiles.length;

    try {
      for (let i = 0; i < totalFiles; i += FILE_BATCH_LIMIT) {
        const batchFiles = selectedFiles.slice(i, i + FILE_BATCH_LIMIT);
        const batchFormData = new FormData();

        batchFiles.forEach(file => {
          batchFormData.append("files", file);
        });

        // Call server action for this batch segment
        // Inside your app/admin/upload/page.js handleUpload function loop change this block:
        const result = await uploadBulkResumes(batchFormData);

        if (result && !result.success) {
          masterResults.success = false;
          masterResults.errors.push(result.error || `Batch starting at index ${i} failed.`);
        } else if (result) {
          // ✅ FIXED: Changed variable targets to align directly with your backend payload key contracts
          masterResults.count += result.count || 0;
          masterResults.duplicateCount += result.duplicateCount || 0;
          if (result.data) {
            masterResults.data = [...masterResults.data, ...result.data];
          }
        }
        // Calculate actual real progress percentage
        const filesProcessed = Math.min(i + FILE_BATCH_LIMIT, totalFiles);
        setProgress(Math.round((filesProcessed / totalFiles) * 100));
      }

      setUploadPhase("done");

      setTimeout(() => {
        setUploadResults({
          success: masterResults.success,
          count: masterResults.count,
          duplicateCount: masterResults.duplicateCount,
          data: masterResults.data,
          message: masterResults.success
            ? `${masterResults.count} resumes synced successfully.`
            : `Sync completed with warnings.`,
          error: masterResults.errors.length > 0 ? masterResults.errors.slice(0, 2).join(" | ") : null
        });

        setIsUploading(false);
        setProgress(0);
        setUploadPhase("idle");
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 800);

    } catch (err) {
      console.error(err);
      setUploadResults({ success: false, error: err.message || "Upload pipeline broken." });
      setIsUploading(false);
      setProgress(0);
      setUploadPhase("idle");
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setUploadResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const phaseLabel = {
    idle: "",
    uploading: "Shipping batch packets...",
    done: "Complete!",
  };

  return (
    <div className={`p-6 md:p-10 mx-auto space-y-8 bg-white min-h-screen ${robotoSlab.className} text-black`}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Resume Upload Page</p>
          <h1 className={`${robotoSlab.className} text-5xl uppercase italic tracking-tighter leading-none`}>
            Upload <span className="opacity-50 text-4xl">Resumes</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Local Sync Time</p>
          <p className="text-sm font-black tabular-nums">{currentTime || "--:--:--"}</p>
        </div>
      </div>

      {/* UPLOAD DROPZONE */}
      <div className="bg-white rounded-[3rem] p-12 text-center shadow-sm relative overflow-hidden border border-gray-100">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          id="resume-upload"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <label htmlFor="resume-upload" className={`cursor-pointer block group ${isUploading ? "pointer-events-none" : ""}`}>
          <div className="w-20 h-20 bg-gray-50 text-black/10 rounded-[2rem] flex items-center justify-center mx-auto group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-inner">
            <Upload size={32} />
          </div>
          <h2 className={`${passero.className} mt-6 text-2xl uppercase tracking-tight`}>
            {selectedFiles.length > 0 ? `${selectedFiles.length} Blobs Selected` : "Select Source Files"}
          </h2>
          <p className="text-black/30 text-[10px] mt-1 font-bold uppercase tracking-widest italic">
            {selectedFiles.length > 0 ? `${selectedFiles.length} PDFs ready for processing` : "Map PDF files to the local file system"}
          </p>
        </label>

        {selectedFiles.length > 0 && !isUploading && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 flex justify-center gap-4">
            <button onClick={clearFiles} className="px-8 py-3 text-[10px] font-black text-black/40 hover:text-black transition-all uppercase tracking-widest">
              Cancel
            </button>
            <button onClick={handleUpload} className="px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3">
              <Zap size={14} /> Upload Resumes
            </button>
          </motion.div>
        )}

        {/* Progress bar */}
        <AnimatePresence>
          {isUploading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-10 max-w-xs mx-auto space-y-3">
              <div className="flex justify-between text-[9px] font-black text-black uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  {phaseLabel[uploadPhase] || "Processing upload clusters..."}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="bg-gray-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                <motion.div animate={{ width: `${progress}%` }} transition={{ ease: "easeInOut", duration: 0.1 }} className="bg-black h-full rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RESULTS */}
      <AnimatePresence mode="wait">
        {uploadResults && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
            <div className={`p-6 rounded-[2.5rem] border flex items-center justify-between gap-6 shadow-sm ${uploadResults.success ? "bg-white border-gray-100 text-black" : "bg-red-50 border-red-100 text-red-900"}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${uploadResults.success ? "bg-black text-white" : "bg-red-500 text-white"}`}>
                  {uploadResults.success ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h4 className={`${robotoSlab.className} text-xl uppercase tracking-wider leading-none mb-1`}>
                    {uploadResults.success ? `${uploadResults.count || 0} Uploaded / ${uploadResults.duplicateCount || 0} Duplicates` : "Upload Failed"}
                  </h4>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none">
                    {uploadResults.message || uploadResults.error}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Files Mapping Output */}
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
              {uploadResults.data && uploadResults.data.length > 0 ? (
                uploadResults.data.map((file, i) => (
                  <motion.div key={file.uniqueId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.005, 0.5) }} className="bg-white border border-gray-100 p-5 rounded-3xl flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-gray-50 rounded-2xl text-black/10 group-hover:text-black transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight text-black">{file.originalName}</p>
                        <p className="text-[9px] font-bold text-black/20 uppercase tracking-tighter">Locally Indexed: {file.fileSize}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`${passero.className} text-lg text-black/20 group-hover:text-black transition-colors`}>
                        RES-{String(file.resumeNo).padStart(3, "0")}
                      </span>
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-16 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm italic">
                  <XCircle size={32} className="text-black/5 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Zero New Records Saved</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}