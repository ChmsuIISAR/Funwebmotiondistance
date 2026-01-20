import React, { useState, useMemo } from 'react';
import { Play, RotateCcw, Settings, MapPin, X, Wind, Layers, Gauge, Ruler, Weight, Sun, Moon, RefreshCw, Power, CarFront, Globe } from 'lucide-react'; 
import { NODES, VEHICLES, DEFAULT_GRID_SCALE } from './constants';
import { VehicleType, SimulationResult } from './types';
import SimulationCanvas from './components/SimulationCanvas';
import ResultsModal from './components/ResultsModal';

const App: React.FC = () => {
  // State
  const [vehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [finishNodeId, setFinishNodeId] = useState<string>('J'); 
  const [gridScale, setGridScale] = useState<number>(DEFAULT_GRID_SCALE);
  const [showBuildings, setShowBuildings] = useState<boolean>(true);

  // PHYSICS STATE
  const [targetSpeed, setTargetSpeed] = useState<number>(30); // m/s
  const [friction, setFriction] = useState<number>(0); // 0 to 5
  const [isFrictionOn, setIsFrictionOn] = useState<boolean>(true);
  const [airResistance, setAirResistance] = useState<number>(0); // 0 to 50 N
  const [mass, setMass] = useState<number>(20); // kg
  const [frictionStartNode, setFrictionStartNode] = useState<string>('B');
  const [frictionEndNode, setFrictionEndNode] = useState<string>('D');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  // UX State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Handlers
  const handleLaunch = () => {
    if (isRunning) return;
    setResult(null);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setResult(null);
  };

  const handleFinish = (res: SimulationResult) => {
    setIsRunning(false);
    setResult(res);
  };

  const handleResetSettings = () => {
    setGridScale(DEFAULT_GRID_SCALE);
    setTargetSpeed(30);
    setFriction(0);
    setIsFrictionOn(true);
    setAirResistance(0);
    setMass(20);
    setFrictionStartNode('B');
    setFrictionEndNode('D');
  };

  const carConfig = VEHICLES[VehicleType.CAR];

  // Available nodes for range selection (excluding A and J for start, A for end roughly)
  const rangeOptions = NODES.filter(n => n.id !== 'A'); 

  // Dynamic Classes based on Theme
  const bgClass = isDarkMode ? 'bg-slate-950' : 'bg-slate-100';
  const textClass = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const headerClass = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const sidebarClass = isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200';
  const cardClass = isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const labelClass = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const subLabelClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputBgClass = isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900';

  return (
    <div className={`flex flex-col h-screen ${bgClass} ${textClass} font-sans overflow-hidden transition-colors duration-300`}>
      {/* HEADER - Reduced Height (h-[60px]) */}
      <header className={`flex-none h-[60px] ${headerClass} border-b shadow-md px-6 flex items-center justify-between z-40 relative transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
             <MapPin className="text-slate-900" size={20} />
          </div>
          <div>
              <h1 className={`text-lg font-extrabold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Physics Lab</h1>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">Forces & Motion • Grade 7</p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
            {/* Finish Line Selector */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destination:</span>
                <select 
                    value={finishNodeId}
                    onChange={(e) => setFinishNodeId(e.target.value)}
                    disabled={isRunning}
                    className={`bg-transparent text-sm font-bold focus:outline-none focus:ring-0 cursor-pointer disabled:cursor-not-allowed ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
                >
                    {NODES.filter(n => n.isFinishOption).map(n => (
                        <option key={n.id} value={n.id} className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}>
                            Checkpoint {n.label} ({n.name})
                        </option>
                    ))}
                </select>
            </div>

            {/* Launch / Reset Button */}
            <div className="w-32 lg:w-40 flex justify-end">
                {!isRunning ? (
                    <button 
                        onClick={handleLaunch}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 text-sm"
                    >
                        <Play size={16} fill="currentColor" />
                        LAUNCH
                    </button>
                ) : (
                    <button 
                        onClick={handleReset}
                        className={`w-full flex items-center justify-center gap-2 font-bold py-2 rounded-full shadow-lg transition-all border text-sm ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'}`}
                    >
                        <RotateCcw size={16} />
                        RESET
                    </button>
                )}
            </div>

            {/* Sidebar Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg border transition-all ${isSidebarOpen ? 'bg-yellow-500 text-slate-900 border-yellow-400' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
            >
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* CENTER: Canvas */}
        <main className="flex-1 relative flex p-2 lg:p-4">
            <div className={`w-full h-full relative shadow-2xl rounded-xl overflow-hidden border-2 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                <SimulationCanvas 
                    vehicleType={vehicleType}
                    gridScale={gridScale}
                    finishNodeId={finishNodeId}
                    showBuildings={showBuildings}
                    isRunning={isRunning}
                    isFinished={!!result}
                    onFinish={handleFinish}
                    // PHYSICS PROPS
                    targetSpeed={targetSpeed}
                    friction={isFrictionOn ? friction : 0}
                    airResistance={airResistance}
                    mass={mass}
                    frictionStartNode={frictionStartNode}
                    frictionEndNode={frictionEndNode}
                    isDarkMode={isDarkMode}
                />
            </div>
        </main>

        {/* RIGHT: Floating Sidebar (Global Controls) */}
        {isSidebarOpen && (
            <aside className={`w-80 flex-none border-l flex flex-col z-30 shadow-2xl backdrop-blur-xl absolute right-0 top-0 bottom-0 animate-in slide-in-from-right duration-300 ${sidebarClass}`}>
                
                {/* Fixed Title Header */}
                <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'}`}>
                    <h2 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Settings</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    
                    {/* SECTION 1: GLOBAL CONTROLS */}
                    <section className="space-y-4">
                         <div className="flex items-center gap-2 mb-2 px-1 pb-2 border-b border-dashed border-slate-700/50">
                            <Globe size={14} className={isDarkMode ? "text-yellow-500" : "text-yellow-600"} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${subLabelClass}`}>Global Controls</h3>
                        </div>

                        {/* Toolbar: Theme & Reset */}
                        <div className={`p-3 rounded-2xl border flex flex-col gap-3 ${cardClass}`}>
                             <div className="flex justify-between items-center w-full">
                                 <span className={`text-[10px] font-bold ${subLabelClass}`}>APPEARANCE</span>
                                 <button 
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                                    {isDarkMode ? 'Light' : 'Dark'}
                                </button>
                             </div>
                             
                             <button 
                                onClick={handleResetSettings}
                                title="Restore to Default Settings"
                                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                            >
                                <RefreshCw size={12} /> Restore Default Settings
                            </button>
                        </div>

                        {/* CONTROL 0: GRID SCALE */}
                        <div className={`space-y-4 p-4 rounded-2xl border ${cardClass}`}>
                            <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <Ruler size={14} /> Map Scale
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className={`text-sm font-bold ${labelClass}`}>Meters per Square</label>
                                    <span className={`text-xs font-mono px-2 py-1 rounded text-indigo-500 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        {gridScale} m
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="50" 
                                    step="5"
                                    value={gridScale}
                                    onChange={(e) => setGridScale(Number(e.target.value))}
                                    disabled={isRunning}
                                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div className={`flex justify-between text-[10px] font-bold ${subLabelClass}`}>
                                    <span>10m</span>
                                    <span>50m</span>
                                </div>
                            </div>
                        </div>

                        {/* CONTROL 2: FRICTION */}
                        <div className={`space-y-4 p-4 rounded-2xl border ${cardClass}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-wider">
                                    <Layers size={14} /> Friction Control
                                </div>
                                {/* Toggle Switch */}
                                <button 
                                    onClick={() => setIsFrictionOn(!isFrictionOn)}
                                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${isFrictionOn ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}
                                >
                                    <Power size={10} />
                                    {isFrictionOn ? 'ON' : 'OFF'}
                                </button>
                            </div>

                            {/* Range Selection */}
                            <div className={`grid grid-cols-2 gap-2 mb-4 transition-opacity ${isFrictionOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <div>
                                    <label className={`text-[9px] font-bold block mb-1 ${subLabelClass}`}>FROM</label>
                                    <select 
                                        value={frictionStartNode}
                                        onChange={(e) => {
                                            setFrictionStartNode(e.target.value);
                                            const startIdx = NODES.findIndex(n => n.id === e.target.value);
                                            const endIdx = NODES.findIndex(n => n.id === frictionEndNode);
                                            if (endIdx <= startIdx) {
                                                const next = NODES[startIdx + 1];
                                                if (next) setFrictionEndNode(next.id);
                                            }
                                        }}
                                        className={`w-full rounded-lg text-xs py-1.5 px-2 focus:outline-none focus:border-yellow-400 ${inputBgClass}`}
                                    >
                                        {rangeOptions.map(n => (
                                            <option key={n.id} value={n.id}>{n.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`text-[9px] font-bold block mb-1 ${subLabelClass}`}>TO</label>
                                    <select 
                                        value={frictionEndNode}
                                        onChange={(e) => setFrictionEndNode(e.target.value)}
                                        className={`w-full rounded-lg text-xs py-1.5 px-2 focus:outline-none focus:border-yellow-400 ${inputBgClass}`}
                                    >
                                        {rangeOptions.filter(n => {
                                            const startIdx = NODES.findIndex(x => x.id === frictionStartNode);
                                            const thisIdx = NODES.findIndex(x => x.id === n.id);
                                            return thisIdx > startIdx;
                                        }).map(n => (
                                            <option key={n.id} value={n.id}>{n.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Friction Slider */}
                            <div className={`space-y-2 transition-opacity ${isFrictionOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex justify-between items-end">
                                    <label className={`text-sm font-bold ${labelClass}`}>Coefficient (µ)</label>
                                    <span className={`text-xs font-mono px-2 py-1 rounded text-orange-500 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        {friction.toFixed(2)}
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="5" 
                                    step="0.1"
                                    value={friction}
                                    onChange={(e) => setFriction(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                                <div className={`flex justify-between text-[10px] font-bold ${subLabelClass}`}>
                                    <span>Smooth (0)</span>
                                    <span>Extreme (5)</span>
                                </div>
                            </div>
                        </div>

                        {/* CONTROL 3: AIR RESISTANCE */}
                        <div className={`space-y-4 p-4 rounded-2xl border ${cardClass}`}>
                             <div className="flex items-center gap-2 text-cyan-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <Wind size={14} /> Air Resistance
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className={`text-sm font-bold ${labelClass}`}>Force (Newtons)</label>
                                    <span className={`text-xs font-mono px-2 py-1 rounded text-cyan-500 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        {airResistance} N
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="50" 
                                    step="1"
                                    value={airResistance}
                                    onChange={(e) => setAirResistance(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                                 <div className={`flex justify-between text-[10px] font-bold ${subLabelClass}`}>
                                    <span>None (0N)</span>
                                    <span>Strong (50N)</span>
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* SECTION 2: VEHICLE CONTROLLER */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 px-1 pb-2 border-b border-dashed border-slate-700/50">
                            <CarFront size={14} className="text-emerald-500" />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${subLabelClass}`}>Vehicle Controller</h3>
                        </div>

                        {/* CONTROL 1: ENGINE SPEED */}
                        <div className={`space-y-4 p-4 rounded-2xl border ${cardClass}`}>
                             <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <Gauge size={14} /> Target Speed
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className={`text-sm font-bold ${labelClass}`}>Speed (m/s)</label>
                                    <span className={`text-xs font-mono px-2 py-1 rounded text-emerald-500 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        {targetSpeed} m/s
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="120" 
                                    step="5"
                                    value={targetSpeed}
                                    onChange={(e) => setTargetSpeed(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className={`flex justify-between text-[10px] font-bold ${subLabelClass}`}>
                                    <span>10 m/s</span>
                                    <span>120 m/s</span>
                                </div>
                            </div>
                        </div>

                        {/* CONTROL 4: MASS (New) */}
                        <div className={`space-y-4 p-4 rounded-2xl border ${cardClass}`}>
                             <div className="flex items-center gap-2 text-purple-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <Weight size={14} /> Vehicle Mass
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className={`text-sm font-bold ${labelClass}`}>Mass (kg)</label>
                                    <span className={`text-xs font-mono px-2 py-1 rounded text-purple-500 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        {mass} kg
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    step="5"
                                    value={mass}
                                    onChange={(e) => setMass(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <div className={`flex justify-between text-[10px] font-bold ${subLabelClass}`}>
                                    <span>Light (10kg)</span>
                                    <span>Heavy (100kg)</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Heavier cars accelerate slower.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>
            </aside>
        )}
      </div>
      
      {/* FOOTER - Increased Height (h-[52px]) */}
      <footer className={`h-[52px] border-t flex items-center justify-between px-6 text-[10px] z-50 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
        <span>Grade 7 Science • Forces and Motion</span>
        <span>© 2024 Physics Lab</span>
      </footer>

      {/* Results Popup */}
      <ResultsModal result={result} onClose={handleReset} isDarkMode={isDarkMode} />
    </div>
  );
};

export default App;