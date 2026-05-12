// components/GlobalSkeleton.js
export default function GlobalSkeleton({ type = "grid", count = 6 }) {
  const pulse = "animate-pulse bg-slate-200 rounded-xl";
  const darkPulse = "animate-pulse bg-slate-300 rounded-xl";

  const layouts = {
    // 1. GRID CARDS (3-column layout)
    grid: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white border-2 border-slate-200 p-8 rounded-[2.5rem] h-[380px] space-y-6">
            <div className="flex justify-between">
              <div className={`w-12 h-12 ${darkPulse}`} />
              <div className={`w-20 h-6 ${pulse}`} />
            </div>
            <div className="space-y-3">
              <div className={`h-6 w-full ${darkPulse}`} />
              <div className={`h-6 w-2/3 ${pulse}`} />
            </div>
            <div className="pt-12">
              <div className={`h-14 w-full bg-slate-100 rounded-2xl ${pulse}`} />
            </div>
          </div>
        ))}
      </div>
    ),

    // 2. DATA TABLE (For Admin lists)
    table: (
      <div className="bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="p-6 border-b border-slate-100 flex items-center gap-6">
             <div className={`w-12 h-12 rounded-2xl ${pulse}`} />
             <div className="flex-1 space-y-2">
                <div className={`h-4 w-1/4 ${darkPulse}`} />
                <div className={`h-3 w-1/6 ${pulse}`} />
             </div>
             <div className={`w-24 h-10 ${pulse} rounded-lg`} />
          </div>
        ))}
      </div>
    ),

    // 3. STATS ROW (4 small cards)
    stats: (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border-2 border-black p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-32 flex flex-col justify-between">
             <div className={`h-3 w-20 ${pulse}`} />
             <div className={`h-10 w-16 ${darkPulse}`} />
          </div>
        ))}
      </div>
    )
  };

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto min-h-screen bg-gray-50">
      
      {/* HEADER SKELETON (Logo & Title) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 ${darkPulse}`} />
             <div className={`h-4 w-32 ${pulse}`} />
          </div>
          <div className={`h-16 w-80 md:w-[500px] ${darkPulse} rounded-3xl`} />
          <div className={`h-4 w-64 ${pulse}`} />
        </div>
        <div className={`h-24 w-32 bg-white border-2 border-black rounded-3xl ${pulse}`} />
      </div>

      {/* SEARCH BOX SKELETON */}
      <div className={`w-full h-16 bg-white border-2 border-slate-200 rounded-2xl mb-12 ${pulse}`} />

      {/* MAIN CONTENT AREA */}
      {layouts[type] || layouts.grid}

      {/* PAGINATION SKELETON (10 dots/buttons) */}
      <div className="mt-16 flex justify-center items-center gap-4">
        <div className={`w-12 h-12 ${pulse} rounded-xl`} />
        <div className="flex gap-2">
           {[...Array(10)].map((_, i) => (
             <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? darkPulse : pulse}`} />
           ))}
        </div>
        <div className={`w-12 h-12 ${pulse} rounded-xl`} />
      </div>

      {/* FOOTER SKELETON */}
      <div className="mt-24 text-center border-t border-slate-200 pt-12 opacity-10">
        <div className={`h-3 w-48 mx-auto ${pulse}`} />
      </div>
    </div>
  );
}