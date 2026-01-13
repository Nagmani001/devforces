import React from 'react';

export const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
);

export const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);

export const GraduationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
);

export const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
);

export const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export const EmptyCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><circle cx="12" cy="12" r="10"></circle></svg>
);

export const FileIcon = ({ color, text }: { color: string, text: string }) => (
  <div className={`relative w-16 h-20 ${color} rounded-lg shadow-md flex flex-col items-center justify-center text-white font-bold text-xs pt-4`}>
    <div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-bl-lg"></div>
    {text}
    <div className="mt-2 space-y-1 w-8">
      <div className="h-0.5 w-full bg-white/40"></div>
      <div className="h-0.5 w-full bg-white/40"></div>
      <div className="h-0.5 w-2/3 bg-white/40"></div>
    </div>
  </div>
);

export const DocIcon = () => (
  <div className="relative w-16 h-20 bg-blue-500 rounded-lg shadow-md flex flex-col items-center justify-center p-2">
    <div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-bl-lg"></div>
    <div className="space-y-1.5 w-full mt-2">
      <div className="h-1 w-full bg-white/40 rounded-full"></div>
      <div className="h-1 w-full bg-white/40 rounded-full"></div>
      <div className="h-1 w-full bg-white/40 rounded-full"></div>
      <div className="h-1 w-4/5 bg-white/40 rounded-full"></div>
    </div>
  </div>
);

export const FolderIcon = ({ label, active, isStudent }: { label: string, active?: boolean, isStudent?: boolean }) => {
  // Define colors based on whether it's a student folder or server folder
  // Student folder is now a "lil bit greyish" using slate-500/slate-400
  const backColorClass = isStudent
    ? (active ? 'bg-slate-800' : 'bg-slate-200')
    : (active ? 'bg-[#0095e0]' : 'bg-slate-200');

  const frontColorClass = isStudent
    ? (active ? 'bg-slate-600' : 'bg-white border border-slate-200')
    : (active ? 'bg-[#00b0ff]' : 'bg-white border border-slate-200');

  return (
    <div className="flex flex-col items-center group/folder ">
      <div className="relative w-[110px] h-[80px]">
        {/* Back Plate with Tab */}
        <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${backColorClass}`}>
          <div className={`absolute -top-[10px] left-0 w-[55%] h-[24px] rounded-tl-2xl rounded-tr-[24px] transition-colors duration-500 ${backColorClass}`}></div>
        </div>

        {/* Internal Elements: Paper, app.jsx, package.json */}
        {isStudent && (
          <>
            {/* Bottom Layer: Paper */}
            <div className="absolute top-2 left-4 right-4 bottom-6 bg-white rounded shadow-sm z-10 transition-transform duration-700 delay-150 group-hover:translate-y-[-24px] flex flex-col p-1.5 gap-1">
              <div className="h-0.5 w-full bg-slate-100 rounded-full"></div>
              <div className="h-0.5 w-3/4 bg-slate-100 rounded-full"></div>
              <div className="h-0.5 w-5/6 bg-slate-100 rounded-full"></div>
            </div>

            {/* Middle Layer: package.json */}
            <div className="absolute top-2 left-6 right-2 bottom-6 bg-rose-50 border border-rose-100 rounded shadow-sm z-10 transition-transform duration-500 delay-100 group-hover:translate-y-[-18px] translate-x-[4px] flex items-center justify-center">
              <span className="text-[6px] font-bold text-rose-500 uppercase">JSON</span>
            </div>

            {/* Top Layer: app.jsx */}
            <div className="absolute top-2 left-2 right-6 bottom-6 bg-sky-50 border border-sky-100 rounded shadow-sm z-10 transition-transform duration-300 group-hover:translate-y-[-12px] translate-x-[-4px] flex items-center justify-center">
              <span className="text-[6px] font-bold text-sky-600 uppercase">JSX</span>
            </div>
          </>
        )}

        {/* Non-student folder simple paper */}
        {!isStudent && (
          <div className={`absolute top-2 left-2 right-2 bottom-6 bg-white rounded-lg transition-all duration-700 ${active ? 'translate-y-[-10px] opacity-100' : 'translate-y-0 opacity-0'} z-10 shadow-sm flex items-center justify-center p-2`}>
            <div className="w-full space-y-1">
              <div className="h-0.5 w-full bg-slate-100 rounded-full"></div>
              <div className="h-0.5 w-2/3 bg-slate-100 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Front Flap */}
        <div className={`absolute left-0 right-0 bottom-0 h-[75%] rounded-2xl transition-all duration-500 z-20 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${frontColorClass}`}>
          <span className={`text-[11px] font-semibold uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};
