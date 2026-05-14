"use client";

import { useState, useEffect } from "react";
import { getAllKycRequests, updateComplianceStatus } from "@/app/actions/admin";
import {  X, Eye,CheckCheck, Landmark, ShieldCheck, Search, Loader2, UserCheck, SquareArrowRightEnter, Undo2, CloudDownload } from "lucide-react";

import { Toaster, toast } from "sonner";
import { robotoSlab } from "@/lib/fonts";

export default function KycReviewPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({ show: false, type: null, data: null, reqId: null });

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    const res = await getAllKycRequests();
    if (res.success) setRequests(res.data);
    setLoading(false);
  }

  const loginId = requests.map(req => req.userId?.loginId).filter(Boolean);
  console.log("Fetched KYC Requests for Login IDs:", loginId);

  const filteredData = requests.filter(req => {
    const matchesSearch = req.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userId?.loginId?.toLowerCase().includes(searchTerm.toLowerCase());
    const isPending = req.documents?.status === 'pending' || req.bankDetails?.status === 'pending';
    const isVerified = req.documents?.status === 'verified' && req.bankDetails?.status === 'verified';
    return viewTab === "pending" ? (matchesSearch && isPending) : (matchesSearch && isVerified);
  });


  const handleAction = async (status) => {
    const { reqId, type } = modal;
    const res = await updateComplianceStatus(reqId, type, status);
    if (res.success) {
      toast.success(`SYSTEM: ${type.toUpperCase()} set to ${status.toUpperCase()}`);
      setModal({ show: false, type: null, data: null, reqId: null });
      loadRequests();
    } else {
      toast.error(res.error);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-violet-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-10 bg-white min-h-screen text-black">
      <Toaster position="top-center" richColors />

      {/* --- INTEGRATED HEADER & CONTROL BAR --- */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-16 gap-8 border-b border-slate-100 shadow-2xl p-8 rounded pb-10">
        <div className="flex items-center gap-6">
          <div className="w-22 h-22 bg-black rounded-2xl flex items-center justify-center text-white">
            <UserCheck size={44} />
          </div>
          <div>
            <h1 className={`${robotoSlab.className} text-6xl mb-2 `}>KYC <span className="text-violet-600 text-5xl"  >Review</span> </h1>
            <p className="text-[12px] font-semibold text-black/80 ml-2">Approve and Reject KYC Requests</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Search Field */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input
              placeholder="SEARCH USER..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-[10px] font-bold uppercase outline-none focus:border-violet-600 transition-all"
            />
          </div>

          {/* Toggle Buttons (Now on the Right) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {["pending", "verified"].map((tab) => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`px-8 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${viewTab === tab ? 'bg-white text-black shadow-sm border border-slate-200' : 'text-slate-400 hover:text-black'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- REFINED TABLE (Image Reference Style) --- */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100">
            <p className="text-black font-black uppercase tracking-widest text-md ">No matching records found in database.</p>
          </div>
        ) : (
          filteredData.map((req, index) => (
            <div key={req._id} className="group bg-white border border-slate-200 shadow-xl rounded-md  p-6  flex flex-wrap md:flex-nowrap items-center justify-between gap-6 transition-all">

              <div className="flex items-center gap-8 flex-1">
                {/* S.No with custom styling from image */}
                <span className="text-lg font-black text-slate-900 w-6  group-hover:text-violet-600">{index + 1}</span>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">{req.userId?.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {req.userId?.loginId}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons styled like 'Continue' button from image */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModal({ show: true, type: 'kyc', data: req.documents, reqId: req._id })}
                  className={`px-6 py-3 rounded-full text-[12px] cursor-pointer font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${req.documents?.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-800 hover:text-white' : 'bg-white text-black border-slate-100 hover:bg-black hover:text-white'}`}
                >
                  <ShieldCheck size={14} /> KYC {req.documents?.status === 'verified' && <span className="text-[8px]  ">(Verified)</span>}
                </button>

                <button
                  onClick={() => setModal({ show: true, type: 'bank', data: req.bankDetails, reqId: req._id })}
                  className={`px-6 py-3 rounded-full text-[12px] cursor-pointer font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${req.bankDetails?.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-800 hover:text-white' : 'bg-white text-black border-slate-100 hover:bg-black hover:text-white'}`}
                >
                  <Landmark size={14} /> Bank {req.bankDetails?.status === 'verified' && <span className="text-[8px] ">(Verified)</span>}
                </button>

                <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block" />


              </div>
            </div>
          ))
        )}
      </div>

      {/* --- REVIEW MODAL (IDENTICAL TO PREVIOUS LOGIC) --- */}
      {modal.show && (
        <div className="fixed inset-0 z-[100]  flex items-center justify-center bg-black backdrop-blur-sm p-4 animate-in fade-in duration-300">

          {/* Dynamic Width: max-w-lg for Bank, max-w-6xl for KYC */}
          <div className={`bg-white  w-full h-[85vh] shadow-2xl border-2 border-white flex overflow-hidden transition-all duration-500 ${modal.type === 'bank' ? 'max-w-lg' : 'max-w-6xl'}`}>

            {/* --- LEFT PANEL: DATA & ACTIONS --- */}
            <div className={`p-10 flex flex-col bg-white h-full ${modal.type === 'kyc' ? 'w-full md:w-[35%] border-r-4 border-black' : 'w-full'}`}>
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className={`${robotoSlab.className} text-4xl `}>Review KYC </h2>
                </div>
                <button
                  onClick={() => setModal({ show: false, type: null, data: null, reqId: null, previewUrl: null })}
                  className="p-3 bg-white text-red-600 border-red-600 border rounded-full hover:text-white hover:bg-red-600  cursor-pointer transition-all"
                ><Undo2 size={20} /></button>
              </div>

              {/* Data Fields Section */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {modal.type === 'kyc' ? (
                  /* Identity View with Preview Buttons */
                  <div className="space-y-4">
                    <div className="flex justify-between text-[14px]  pb-2">
                      <span className="text-black">ID PROOF </span>
                      <span className="text-black">{modal.data.idProof?.idType}</span>
                    </div>
                    <div className="flex justify-between text-[14px]  pb-2">
                      <span className="text-black">ID NO </span>
                      <span className="text-black italic">{modal.data.idProof?.idNumber}</span>
                    </div>
                    <button
                      onClick={() => setModal({ ...modal, previewUrl: modal.data.idProof?.fileUrl })}
                      className="w-full py-4 flex items-center justify-center gap-3 cursor-pointer bg-violet-50 text-violet-600 text-[10px] font-black uppercase rounded-2xl border-2 border-violet-100 transition-all hover:bg-violet-600 hover:text-white shadow-sm group"
                    >
                      <SquareArrowRightEnter
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                      Load ID Preview
                    </button>
                    <div className="h-6" />

                    <div className="flex justify-between text-[14px]  pb-2">
                      <span className="text-black">ADRSS PROOF </span>
                      <span className="text-black">{modal.data.addressProof?.idType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-[14px]  pb-2">
                      <span className="text-black/">ADRESS ID NO </span>
                      <span className="text-black italic">{modal.data.addressProof?.idNumber}</span>
                    </div>
                    <button
                      onClick={() => setModal({ ...modal, previewUrl: modal.data.addressProof?.fileUrl })}
                    className="w-full py-4 flex items-center justify-center gap-3 cursor-pointer bg-violet-50 text-violet-600 text-[10px] font-black uppercase rounded-2xl border-2 border-violet-100 transition-all hover:bg-violet-600 hover:text-white shadow-sm group"
                    >
                      <SquareArrowRightEnter
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                      Load Address ID Preview
                    </button>
                  </div>
                ) : (
                  /* Bank View: Straight Simple List */
                  <div className="space-y-4">
                    {[
                      { l: "HOLDER NAME", v: modal.data.data?.accountHolderName },
                      { l: "ACCOUNT NO", v: modal.data.data?.accountNumber },
                      { l: "BANK NAME", v: modal.data.data?.bankName },
                      { l: "IFSC CODE", v: modal.data.data?.ifscCode },
                      { l: "TYPE", v: modal.data.data?.accountType },
                      { l: "METHOD", v: modal.data.data?.paymentMethod },
                      { l: "UPI NO", v: modal.data.data?.paymentMobile },
                    ].map(row => (
                      <div key={row.l} className="flex justify-between text-[14px]  pb-2">
                        <span className="text-black">{row.l} </span>
                        <span className="text-black">{row.v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
            

<div className="flex gap-4 pt-8 border-t-4 border-black mt-6">
  {/* REJECT BUTTON - Red Slide-in */}
  <button 
    onClick={() => handleAction('rejected')} 
    className="group relative flex-1 py-5 overflow-hidden rounded-md cursor-pointer   bg-white text-[10px] font-black uppercase tracking-widest text-rose-600 transition-all duration-300"
  >
    {/* Slide-in Background Layer */}
    <span className="absolute inset-0 top-0 left-full z-0 h-full w-full bg-rose-600 transition-all duration-500 ease-out group-hover:left-0" />
    
    {/* Content - Relative z-10 to stay above the slide-in bg */}
    <div className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
      <X size={16} />
      Reject 
    </div>
  </button>

  {/* APPROVE BUTTON - Green Slide-in */}
  <button 
    onClick={() => handleAction('verified')} 
    className="group relative flex-1 py-5 overflow-hidden rounded-md cursor-pointer  bg-white text-[10px] font-black uppercase tracking-widest text-emerald-600 transition-all duration-300 shadow-xl shadow-emerald-50"
  >
    {/* Slide-in Background Layer */}
    <span className="absolute inset-0 top-0 left-full z-0 h-full w-full bg-emerald-600 transition-all duration-500 ease-out group-hover:left-0" />
    
    {/* Content */}
    <div className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
      <CheckCheck size={16} />
      Approve
    </div>
  </button>
</div>
            </div>

            {/* --- RIGHT PANEL: PREVIEW (Only for KYC) --- */}
            {modal.type === 'kyc' && (
              <div className="hidden md:flex flex-1 bg-black relative">
                {modal.previewUrl ? (
                  <iframe
                    src={`https://docs.google.com/gview?url=${modal.previewUrl}&embedded=true`}
                    className="w-full h-full border-none bg-white"
                    title="Viewer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-white/5 flex items-center justify-center border-2 border-white/10 animate-pulse">
                      <CloudDownload size={30} className="text-white/20" />
                    </div>
                    <p className="text-white font-black uppercase italic tracking-[0.4em] text-[10px]">Files Will be Displayed Here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}