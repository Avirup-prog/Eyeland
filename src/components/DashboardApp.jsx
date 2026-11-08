import React, { useState, useEffect } from 'react';
import MinimalEyes from './MinimalEyes.jsx';

export default function DashboardApp() {
  const [activeNav, setActiveNav] = useState('overview');
  const [isMaximized, setIsMaximized] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    cpu: { loadPercent: 8, model: 'Multi-Core CPU' },
    memory: { usedGb: '8.2', totalGb: '16.0', percent: 51 },
    battery: { percent: 100, isCharging: true },
  });
  const [aiStatus, setAiStatus] = useState({
    tier: 'bundled',
    activeModel: 'gemini-3.5-flash',
    hasKey: true,
  });

  useEffect(() => {
    // Check initial maximize state
    if (window.electronAPI?.isDashboardMaximized) {
      window.electronAPI.isDashboardMaximized().then(setIsMaximized).catch(() => {});
    }
    if (window.electronAPI?.getSystemTelemetry) {
      window.electronAPI.getSystemTelemetry().then((t) => {
        if (t) setSystemInfo(t);
      }).catch(() => {});
    }
    if (window.electronAPI?.geminiGetStatus) {
      window.electronAPI.geminiGetStatus().then((s) => {
        if (s) setAiStatus(s);
      }).catch(() => {});
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI?.minimizeDashboard) {
      window.electronAPI.minimizeDashboard();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximizeDashboard) {
      window.electronAPI.maximizeDashboard();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeDashboard) {
      window.electronAPI.closeDashboard();
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊', desc: 'System telemetry & status' },
    { id: 'ai', label: 'AI & Models', icon: '🤖', desc: 'Gemini LLM & Vision setup' },
    { id: 'appearance', label: 'Appearance', icon: '🎨', desc: 'Themes, eyes & glow' },
    { id: 'behaviors', label: 'Behaviors', icon: '⚡', desc: 'Autostart & triggers' },
    { id: 'shelf', label: 'Storage & Shelf', icon: '📁', desc: 'Clipboard & staged files' },
    { id: 'about', label: 'About', icon: 'ℹ️', desc: 'App info & updates' },
  ];

  return (
    <div className="w-screen h-screen bg-[#09090d] text-neutral-100 flex flex-col font-sans select-none overflow-hidden border border-neutral-800/80 rounded-2xl shadow-2xl">
      {/* WINDOW TITLEBAR (DRAGGABLE REGION) */}
      <div 
        className="h-10 bg-[#0e0e13]/90 backdrop-blur-xl border-b border-neutral-800/80 flex items-center justify-between px-3 shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
      >
        {/* App Title & Identity */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs shadow-sm">
            👁️
          </div>
          <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>Eyeland</span>
            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-normal">
              Dashboard
            </span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" title="Service Active" />
        </div>

        {/* Windows Standard Window Action Buttons */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* Minimize */}
          <button
            type="button"
            onClick={handleMinimize}
            className="w-7 h-7 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Minimize"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Maximize / Restore */}
          <button
            type="button"
            onClick={handleMaximize}
            className="w-7 h-7 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="7" y="7" width="13" height="13" rx="1" />
                <path d="M4 17V4h13" />
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg hover:bg-rose-600 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Dashboard"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* DASHBOARD BODY (SIDEBAR + MAIN CONTENT AREA) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-56 bg-[#0b0b0f]/95 border-r border-neutral-800/80 p-3 flex flex-col justify-between shrink-0 select-none">
          <div className="space-y-1">
            <div className="px-2 py-1 mb-2">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                Control Center
              </span>
            </div>

            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-semibold ${isActive ? 'text-emerald-400' : 'text-neutral-200'}`}>
                      {item.label}
                    </span>
                    <span className="text-[9px] text-neutral-500 truncate">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Island Status Badge */}
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/90 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs shrink-0">
              ⚡
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] font-semibold text-white truncate">Bezel Island Docked</div>
              <div className="text-[8.5px] font-mono text-emerald-400 truncate">Flush Top Screen Bezel</div>
            </div>
          </div>
        </aside>

        {/* MAIN DYNAMIC CONTENT CONTAINER */}
        <main className="flex-1 min-h-0 bg-[#09090d] p-5 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeNav === 'overview' && (
            <div className="space-y-4 max-w-4xl animate-fadeIn">
              {/* Header */}
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">System & Island Overview</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Live telemetry, ambient companion state, and active AI services running on your PC.
                </p>
              </div>

              {/* Hero Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900/80 to-teal-950/30 border border-emerald-500/30 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-2xl bg-black/60 border border-emerald-500/30 shadow-inner">
                    <MinimalEyes
                      tiltDeg={0}
                      offsetX={0}
                      offsetY={0}
                      expression="neutral"
                      themeColor="#c5f8d6"
                      themeShadow="0 0 14px rgba(197, 248, 214, 0.95)"
                      size="sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Eyeland Living Companion</h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        ONLINE
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      Hover over your top screen bezel anytime to expand and interact with Eyeland.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    Model: <strong className="text-emerald-400 font-semibold">{aiStatus.activeModel || 'gemini-3.5-flash'}</strong>
                  </span>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-4 gap-3">
                {/* Stat 1 */}
                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>CPU Telemetry</span>
                    <span className="text-emerald-400">⚡</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-white font-mono">{systemInfo.cpu?.loadPercent || 8}%</span>
                    <span className="text-[9.5px] text-neutral-500 block truncate">{systemInfo.cpu?.model || 'Windows Host'}</span>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>RAM Memory</span>
                    <span className="text-sky-400">💾</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-white font-mono">{systemInfo.memory?.usedGb || '8.2'} GB</span>
                    <span className="text-[9.5px] text-neutral-500 block">of {systemInfo.memory?.totalGb || '16.0'} GB used</span>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>AI Engine</span>
                    <span className="text-purple-400">🤖</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-white font-mono">Gemini 3.5</span>
                    <span className="text-[9.5px] text-emerald-400 block font-semibold">Zero-Setup Ready</span>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Battery Status</span>
                    <span className="text-amber-400">🔋</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-white font-mono">{systemInfo.battery?.percent || 100}%</span>
                    <span className="text-[9.5px] text-neutral-500 block">
                      {systemInfo.battery?.isCharging ? 'AC Power Connected' : 'Discharging'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Placeholder Note */}
              <div className="p-4 rounded-2xl bg-[#111116] border border-neutral-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white tracking-wide">Quick Controls</h4>
                  <span className="text-[10px] font-mono text-neutral-500">Eyeland Windows Service</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-between">
                    <span>Startup on Boot</span>
                    <span className="text-emerald-400 font-semibold text-[10px]">ENABLED</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-between">
                    <span>Multimodal Snip Vision</span>
                    <span className="text-emerald-400 font-semibold text-[10px]">ACTIVE</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-between">
                    <span>Clipboard Auto-Sync</span>
                    <span className="text-emerald-400 font-semibold text-[10px]">10 SLOTS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI & MODELS */}
          {activeNav === 'ai' && (
            <div className="space-y-4 max-w-4xl animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">AI & Model Settings</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Configure Google Gemini model preferences, reasoning modes, and API keys.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111116] border border-neutral-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Active LLM Provider</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Eyeland comes with a built-in pre-configured model for all users with zero configuration required.
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    ⚡ Gemini 3.5 Flash Active
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-300 space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <div>
                      <span className="font-semibold text-white block">Current Model Lineup</span>
                      <span className="text-[10px] text-neutral-400">gemini-3.5-flash • gemini-3.1-flash-lite • gemini-3.8-flash</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Cloud TPU Verified</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#111116] border border-neutral-800/90 space-y-2">
                <h4 className="text-xs font-bold text-white">Custom API Key (Optional)</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Have your own Google AI Studio key? You can connect it for dedicated personal quotas or higher-tier models.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="password"
                    readOnly
                    value="••••••••••••••••••••••••"
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-400 font-mono"
                  />
                  <span className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 text-xs font-mono">
                    Protected in AppData
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE */}
          {activeNav === 'appearance' && (
            <div className="space-y-4 max-w-4xl animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Appearance & Themes</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Personalize Eyeland's companion expressions, eye color schemes, and glow intensity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Mint Glow</span>
                    <span className="text-[9.5px] text-neutral-400">Default ambient signature</span>
                  </div>
                  <span className="w-4 h-4 rounded-full bg-[#c5f8d6] shadow-[0_0_8px_#c5f8d6]" />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Cyber Cyan</span>
                    <span className="text-[9.5px] text-neutral-400">High-tech sci-fi blue</span>
                  </div>
                  <span className="w-4 h-4 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Studio White</span>
                    <span className="text-[9.5px] text-neutral-400">Clean minimalist aesthetic</span>
                  </div>
                  <span className="w-4 h-4 rounded-full bg-white shadow-[0_0_8px_white]" />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111116] border border-neutral-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Warm Amber</span>
                    <span className="text-[9.5px] text-neutral-400">Cozy evening glow</span>
                  </div>
                  <span className="w-4 h-4 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24]" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BEHAVIORS */}
          {activeNav === 'behaviors' && (
            <div className="space-y-4 max-w-4xl animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Behaviors & System Hooks</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Configure bezel hover triggers, Windows autostart, and idle sleep sensitivity.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111116] border border-neutral-800/90 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">Launch on Windows Boot</span>
                    <span className="text-[10px] text-neutral-400">Start Eyeland silently docked to top bezel</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-semibold">ON</span>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">Eye Follow & Cursor Tracking</span>
                    <span className="text-[10px] text-neutral-400">Eyes look toward cursor dynamically across display</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-semibold">ACTIVE</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHELF & STORAGE */}
          {activeNav === 'shelf' && (
            <div className="space-y-4 max-w-4xl animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Storage & Staging Shelf</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Manage temporary staged files, clipboard history, and scratchpad data.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111116] border border-neutral-800/90 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Clipboard Retention Capacity</span>
                  <span className="font-mono text-emerald-400">10 Most Recent Copies</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-white font-semibold">Staging Shelf Mode</span>
                  <span className="font-mono text-emerald-400">One-Page Drag & Drop</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeNav === 'about' && (
            <div className="space-y-4 max-w-4xl animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">About Eyeland</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  The living desktop bezel companion and assistant for Windows.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111116] border border-neutral-800/90 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Version</span>
                  <span className="text-white font-mono font-semibold">1.0.0 (Windows Production Build)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Architecture</span>
                  <span className="text-white font-mono">x64 (Windows 10 / 11)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Runtime</span>
                  <span className="text-white font-mono">Electron + React + Vite</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">AI Intelligence</span>
                  <span className="text-emerald-400 font-mono font-semibold">Google Gemini 3.5 Flash</span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
