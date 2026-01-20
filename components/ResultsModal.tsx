import React, { useState } from 'react';
import { SimulationResult } from '../types';
import { NODES } from '../constants';
import { X, Trophy, Info, Timer, ArrowRight, HelpCircle } from 'lucide-react';

interface ResultsModalProps {
  result: SimulationResult | null;
  onClose: () => void;
  isDarkMode?: boolean;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ result, onClose, isDarkMode = true }) => {
  const [showDistInfo, setShowDistInfo] = useState(false);
  const [showSpeedInfo, setShowSpeedInfo] = useState(false);

  if (!result) return null;

  const bgClass = isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300';
  const textClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const subTextClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const cardBgClass = isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50';
  const cardBorderClass = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const headerBgClass = isDarkMode ? 'bg-slate-800' : 'bg-slate-50';
  const itemBgClass = isDarkMode ? 'bg-slate-900/50' : 'bg-white';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className={`${bgClass} border rounded-2xl p-0 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden transition-colors`}>
        
        {/* Header */}
        <div className={`${headerBgClass} p-6 flex flex-col items-center border-b ${cardBorderClass} relative`}>
             <button 
                onClick={onClose}
                className={`absolute top-4 right-4 ${subTextClass} hover:${textClass} transition-colors`}
            >
                <X size={20} />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
                <Trophy size={32} className="text-slate-900" />
            </div>
            <h2 className={`text-2xl font-black ${textClass} tracking-tight`}>Run Complete!</h2>
            <div className={`flex items-center gap-2 ${subTextClass} mt-1`}>
                <span className="text-xs font-bold uppercase tracking-wider">Destination:</span>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{result.finalDestination}</span>
            </div>
            
             {/* Total Time - Prominent */}
             <div className={`mt-4 px-6 py-2 rounded-full border flex items-center gap-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <Timer className="text-emerald-500" size={20} />
                <span className="text-emerald-500 font-mono text-2xl font-bold">{result.timeTaken.toFixed(2)}s</span>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className={`overflow-y-auto p-6 space-y-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            
            {/* COMPARISON 1: DISTANCE vs DISPLACEMENT */}
            <div className={`${cardBgClass} rounded-xl border ${cardBorderClass} overflow-hidden`}>
                <div className={`grid grid-cols-2 divide-x ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                    <div className="p-4 flex flex-col items-center text-center">
                        <span className={`text-[10px] font-bold ${subTextClass} uppercase tracking-wider mb-1`}>Total Distance</span>
                        <span className={`text-2xl font-mono ${textClass} mb-1`}>{result.distanceTraveled.toFixed(0)}m</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>Scalar</span>
                    </div>
                    <div className={`p-4 flex flex-col items-center text-center ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100/60'}`}>
                         <span className={`text-[10px] font-bold ${subTextClass} uppercase tracking-wider mb-1`}>Displacement</span>
                        <span className="text-2xl font-mono text-red-500 mb-1">{result.displacement.toFixed(0)}m</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${isDarkMode ? 'bg-red-900/30 text-red-300 border-red-900/50' : 'bg-red-50 text-red-600 border-red-200'}`}>Vector</span>
                    </div>
                </div>
                
                {/* Info Toggle */}
                <button 
                    onClick={() => setShowDistInfo(!showDistInfo)}
                    className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-bold ${subTextClass} hover:${textClass} hover:${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} transition-colors border-t ${cardBorderClass}`}
                >
                    <HelpCircle size={14} />
                    {showDistInfo ? "Hide Explanation" : "What's the difference?"}
                </button>
                
                {/* Explanation */}
                {showDistInfo && (
                    <div className={`p-4 text-xs leading-relaxed border-t animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        <p className="mb-2">
                            <strong className={textClass}>Distance</strong> is the total length traveled in a specific time without basing it on the initial point. It accumulates constantly as you move.
                        </p>
                        <p>
                            <strong className="text-red-500">Displacement</strong> has a reference point (the Start). It doesn't matter how long you've traveled; it can increase or decrease if you move back near the initial point, whereas distance strictly increases.
                        </p>
                    </div>
                )}
            </div>

            {/* COMPARISON 2: SPEED vs VELOCITY */}
            <div className={`${cardBgClass} rounded-xl border ${cardBorderClass} overflow-hidden`}>
                <div className={`grid grid-cols-2 divide-x ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                    <div className="p-4 flex flex-col items-center text-center">
                        <span className={`text-[10px] font-bold ${subTextClass} uppercase tracking-wider mb-1`}>Avg Speed</span>
                        <span className="text-xl font-mono text-blue-500 mb-1">{result.averageSpeed.toFixed(1)} m/s</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>Scalar</span>
                    </div>
                    <div className={`p-4 flex flex-col items-center text-center ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100/60'}`}>
                         <span className={`text-[10px] font-bold ${subTextClass} uppercase tracking-wider mb-1`}>Avg Velocity</span>
                        <span className="text-xl font-mono text-blue-500 mb-1">{result.averageVelocity.toFixed(1)} m/s</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>Vector</span>
                    </div>
                </div>

                 {/* Info Toggle */}
                 <button 
                    onClick={() => setShowSpeedInfo(!showSpeedInfo)}
                    className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-bold ${subTextClass} hover:${textClass} hover:${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} transition-colors border-t ${cardBorderClass}`}
                >
                    <HelpCircle size={14} />
                    {showSpeedInfo ? "Hide Explanation" : "Why are they different?"}
                </button>
                
                {/* Explanation */}
                {showSpeedInfo && (
                    <div className={`p-4 text-xs leading-relaxed border-t animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                         <p className="mb-2">
                            <strong className={textClass}>Speed</strong> is how fast you cover distance (Distance ÷ Time). It ignores direction.
                        </p>
                        <p>
                            <strong className="text-blue-500">Velocity</strong> is how fast your position changes from the start (Displacement ÷ Time). It includes direction, so if you return to the start, your average velocity could be zero even if you moved fast!
                        </p>
                    </div>
                )}
            </div>

            {/* NODE TO NODE ANALYSIS */}
            <div className={`${cardBgClass} rounded-xl border ${cardBorderClass} p-4`}>
                <div className={`flex items-center gap-2 mb-3 border-b ${cardBorderClass} pb-2`}>
                    <Info size={14} className={isDarkMode ? "text-yellow-400" : "text-yellow-600"} />
                    <h3 className={`text-xs font-bold ${textClass} uppercase tracking-wider`}>Path Direction Analysis</h3>
                </div>
                
                {/* Scrollable list for segments */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {result.segmentData && result.segmentData.map((seg, idx) => (
                        <div key={idx} className={`flex flex-col gap-1 text-xs p-2 rounded border ${itemBgClass} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    <span className={`font-mono font-bold ${textClass}`}>{seg.from}</span>
                                    <ArrowRight size={12} className={subTextClass} />
                                    <span className={`font-mono font-bold ${textClass}`}>{seg.to}</span>
                                </div>
                                <div className={`text-[10px] ${subTextClass} font-mono`}>
                                    {seg.distance.toFixed(0)}m in {seg.time.toFixed(1)}s
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className={`${subTextClass} text-[10px] uppercase font-bold tracking-wider`}>Velocity:</span>
                                <span className="font-mono font-bold text-blue-500 text-xs">{seg.velocityLabel}</span>
                            </div>
                        </div>
                    ))}
                    {!result.segmentData && (
                        <div className={`text-center ${subTextClass} py-4 text-xs`}>No segment data available</div>
                    )}
                </div>
                
                <div className={`mt-3 text-[11px] p-2 rounded border leading-snug ${isDarkMode ? 'text-slate-300 bg-blue-900/20 border-blue-900/50' : 'text-slate-600 bg-blue-50 border-blue-200'}`}>
                    <strong className="text-blue-500">Note:</strong> Even if the <span className={`${textClass} font-bold`}>speed</span> (number part) remains constant (e.g., 20 m/s), the <span className="text-blue-500 font-bold">velocity</span> changes every time the car turns because direction is part of velocity.
                </div>
            </div>

        </div>

        {/* Footer Action */}
        <div className={`p-6 border-t ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <button 
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 transform active:scale-95"
            >
                Start New Experiment
            </button>
        </div>

      </div>
    </div>
  );
};

export default ResultsModal;