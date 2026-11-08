import React, { useState, useEffect } from 'react';
import MinimalEyes from './MinimalEyes.jsx';

export default function DashboardApp() {
  const [activeNav, setActiveNav] = useState('home');
  const [isMaximized, setIsMaximized] = useState(false);
  const [userName, setUserName] = useState('Creator');
  const [currentTime, setCurrentTime] = useState({
    timeStr: '4:41 PM',
    dateStr: 'SUN 08 NOV',
    greeting: 'Good afternoon'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTheme, setActiveTheme] = useState('mint');

  // System & AI status
  const [systemInfo, setSystemInfo] = useState({
    cpu: { loadPercent: 12, model: 'Multi-Core CPU' },
    memory: { usedGb: '8.4', totalGb: '16.0', percent: 52 },
    battery: { percent: 100, isCharging: true },
  });
  const [aiStatus, setAiStatus] = useState({
    tier: 'bundled',
    activeModel: 'gemini-3.5-flash',
    hasKey: true,
  });

  // Live Clock & User Info
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;

      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const monthName = months[now.getMonth()];

      let greet = 'Good morning';
      if (hours >= 12 && hours < 17) greet = 'Good afternoon';
      else if (hours >= 17) greet = 'Good evening';

      setCurrentTime({
        timeStr: `${displayHours}:${minutes} ${ampm}`,
        dateStr: `${dayName} ${dayNum} ${monthName}`,
        greeting: greet
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch user info & telemetry
    if (window.electronAPI?.getUserInfo) {
      window.electronAPI.getUserInfo().then((info) => {
        if (info?.username) setUserName(info.username);
      }).catch(() => {});
    }
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

    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeDashboard?.();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeDashboard?.();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.closeDashboard?.();
  };

  // Categorized Navigation Items (Exactly structured like the Hub screenshot)
  const navGroups = [
    {
      group: 'EYELAND',
      items: [
        { id: 'home', label: 'Home', icon: '🏠', badge: null },
        { id: 'connections', label: 'Connections', icon: '🔌', badge: 'dot' },
        { id: 'ai_chat', label: 'AI & Chat', icon: '💬', badge: 'dot' },
        { id: 'apps', label: 'Apps & Tools', icon: '🎛️', badge: null },
      ]
    },
    {
      group: 'COMPANION',
      items: [
        { id: 'companion', label: 'Eyeland Buddy', icon: '🤖', badge: null },
        { id: 'wardrobe', label: 'Wardrobe', icon: '👕', badge: null },
      ]
    },
    {
      group: 'SETTINGS',
      items: [
        { id: 'account', label: 'Account', icon: '👤', badge: null },
        { id: 'general', label: 'General', icon: '⚙️', badge: null },
        { id: 'notifications', label: 'Notifications', icon: '🔔', badge: null },
        { id: 'island', label: 'Island Display', icon: '🏝️', badge: null },
        { id: 'focus_guard', label: 'Focus Guard', icon: '🛡️', badge: null },
        { id: 'news', label: 'News & Updates', icon: '📰', badge: null },
        { id: 'support', label: 'Support Eyeland', icon: '🤍', badge: null },
      ]
    }
  ];

  return (
    <div className="w-screen h-screen bg-[#07070a] text-neutral-100 flex flex-col font-sans select-none overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
      
      {/* =====================================================================
          1. WINDOW TITLEBAR (DRAGGABLE REGION)
          ===================================================================== */}
      <div 
        className="h-11 bg-[#0b0c10]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-3.5 shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
      >
        {/* Left Identity: Mini-eyes icon + Eyeland Hub + BETA */}
        <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center gap-1 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></div>
          </div>
          <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>Eyeland Hub</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-white/10 uppercase font-semibold">
              BETA
            </span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" title="Eyeland Bezel Connected" />
        </div>

        {/* Center Subtitle */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-500">
          <span>Companion Overlay • Bezel Docked</span>
        </div>

        {/* Right Window Controls (Standard Windows Actions) */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* Minimize */}
          <button
            type="button"
            onClick={handleMinimize}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
            title="Close Hub"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. HUB BODY (SIDEBAR + DYNAMIC CONTENT)
          ===================================================================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-56 bg-[#090a0f]/95 border-r border-white/[0.06] p-3 flex flex-col justify-between shrink-0 select-none overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-0.5">
                <div className="px-2.5 py-1">
                  <span className="text-[9.5px] font-mono text-neutral-500 uppercase tracking-wider font-bold">
                    {group.group}
                  </span>
                </div>

                {group.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800/80 border border-white/10 text-white shadow-sm font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className="text-xs truncate">{item.label}</span>
                      </div>
                      {item.badge === 'dot' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Companion Status Capsule */}
          <div className="mt-3 p-2 rounded-xl bg-neutral-900/80 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs">🤖</span>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-white truncate">Eyeland Buddy</div>
                <div className="text-[8.5px] font-mono text-emerald-400 truncate">Companion Active</div>
              </div>
            </div>
            <button 
              onClick={() => setActiveTheme(activeTheme === 'mint' ? 'amber' : 'mint')}
              className="w-6 h-6 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors"
              title="Theme Toggle"
            >
              🔆
            </button>
          </div>
        </aside>

        {/* MAIN DYNAMIC CONTENT CONTAINER */}
        <main className="flex-1 min-h-0 bg-[#060709] p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          
          {/* =================================================================
              TAB: HOME (Matching screenshot layout)
              ================================================================= */}
          {activeNav === 'home' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">
              
              {/* TOP VIBRANT GRADIENT HERO BANNER WITH MINI ISLAND NOTCH */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 p-6 pt-4 bg-gradient-to-r from-amber-600/30 via-rose-600/25 to-purple-800/30 shadow-xl">
                
                {/* Ambient dynamic lighting */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

                {/* Floating Top-Center Dynamic Island Notch Preview */}
                <div className="mx-auto w-64 h-11 bg-black/95 border border-neutral-700/80 rounded-2xl flex items-center justify-between px-3.5 shadow-2xl relative z-10 backdrop-blur-md">
                  <span className="text-[10px] font-mono text-neutral-400 font-semibold">{currentTime.dateStr}</span>
                  
                  {/* Glowing Animated Eyes */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_6px_#c5f8d6]"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_6px_#c5f8d6]"></div>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400">28° ☀️</span>
                </div>

                {/* Big Bold Clock */}
                <div className="text-center mt-2 mb-4 relative z-10">
                  <span className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md font-mono">
                    {currentTime.timeStr.replace(' AM', '').replace(' PM', '')}
                  </span>
                </div>

                {/* Banner Bottom Label */}
                <div className="relative z-10">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">Home</h1>
                </div>
              </div>

              {/* USER GREETING */}
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {currentTime.greeting}, <span className="text-emerald-400">{userName}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Eyeland keeps an eye on your workflow, tasks, and system performance.
                </p>
              </div>

              {/* "CONNECT YOUR AI" FEATURED CARD */}
              <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 flex items-center justify-between hover:border-emerald-500/30 transition-all shadow-md">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.08-.14L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.13-5.9 10.36z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white">Connect your AI</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Turn on Gemini 3.5 Flash, Claude Code, or Codex. Eyeland tells you when your AI finishes a task, and answers your questions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveNav('connections')}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shrink-0 shadow-sm cursor-pointer ml-4"
                >
                  Connect
                </button>
              </div>

              {/* 3 STATS / KPI CARDS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Tasks Done */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-sm shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">0</div>
                    <div className="text-xs text-neutral-400">tasks done</div>
                  </div>
                </div>

                {/* Today */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 text-sm shrink-0">
                    📅
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">0</div>
                    <div className="text-xs text-neutral-400">today</div>
                  </div>
                </div>

                {/* Days in a row */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 text-sm shrink-0">
                    🔥
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">0</div>
                    <div className="text-xs text-neutral-400">days in a row</div>
                  </div>
                </div>
              </div>

              {/* ACTIVITY & QUICK SHORTCUTS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Left 2 Cols: Activity Feed */}
                <div className="md:col-span-2 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Activity</span>
                    <input
                      type="text"
                      placeholder="Search your activity"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-1 text-xs rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 outline-none focus:border-emerald-500/50 w-44"
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/10 text-center flex flex-col items-center justify-center min-h-[140px]">
                    <span className="text-2xl mb-2 text-neutral-600">⚡</span>
                    <p className="text-xs text-neutral-400 max-w-sm">
                      Nothing yet. When your AI finishes a job, it shows up here.
                    </p>
                  </div>
                </div>

                {/* Right 1 Col: Quick Links */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Shortcuts</span>

                  <button
                    onClick={() => setActiveNav('wardrobe')}
                    className="w-full p-3 rounded-xl bg-neutral-900/70 border border-white/10 flex items-center justify-between text-left hover:border-purple-500/30 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center text-xs">
                        👕
                      </span>
                      <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">Wardrobe</span>
                    </div>
                    <span className="text-neutral-500 text-xs">›</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('connections')}
                    className="w-full p-3 rounded-xl bg-neutral-900/70 border border-white/10 flex items-center justify-between text-left hover:border-emerald-500/30 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs">
                        🔌
                      </span>
                      <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">Connections</span>
                    </div>
                    <span className="text-neutral-500 text-xs">›</span>
                  </button>

                  <button
                    onClick={() => setActiveNav('general')}
                    className="w-full p-3 rounded-xl bg-neutral-900/70 border border-white/10 flex items-center justify-between text-left hover:border-sky-500/30 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center text-xs">
                        ⚙️
                      </span>
                      <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">General</span>
                    </div>
                    <span className="text-neutral-500 text-xs">›</span>
                  </button>

                  <div className="p-2.5 rounded-xl bg-neutral-900/40 border border-white/5 flex items-center gap-2 text-neutral-400 text-[11px]">
                    <span>🖐️</span>
                    <span>Tip: Click companion eyes to pet!</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =================================================================
              DUMMY TABS (Configurable one by one later)
              ================================================================= */}
          {activeNav !== 'home' && (
            <div className="space-y-5 max-w-4xl animate-fadeIn">
              
              {/* Tab Header */}
              <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {navGroups.flatMap(g => g.items).find(i => i.id === activeNav)?.icon}
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {navGroups.flatMap(g => g.items).find(i => i.id === activeNav)?.label}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                      Configuring
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    This tab is ready for customization. Tell me what features or settings you'd like to configure here next!
                  </p>
                </div>

                <button
                  onClick={() => setActiveNav('home')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors cursor-pointer"
                >
                  ← Back to Home
                </button>
              </div>

              {/* Placeholder Card 1: Main Section */}
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⚡ Configuration Panel</span>
                  </h3>
                  <span className="text-xs font-mono text-neutral-500">Eyeland 1.0</span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  We have set up the complete layout and routing for the <strong>{navGroups.flatMap(g => g.items).find(i => i.id === activeNav)?.label}</strong> tab. 
                  When you are ready, let me know what specific controls, toggles, forms, or data you would like to display here!
                </p>

                {/* Mock Settings Switch Rows */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <div className="text-xs font-semibold text-white">Enable Feature</div>
                      <div className="text-[11px] text-neutral-400">Toggle this module for active background polling</div>
                    </div>
                    <div className="w-10 h-5 bg-emerald-500/30 border border-emerald-400/50 rounded-full flex items-center p-0.5 justify-end cursor-pointer">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full shadow"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <div className="text-xs font-semibold text-white">Auto-Sync Changes</div>
                      <div className="text-[11px] text-neutral-400">Broadcast state updates directly to top bezel island</div>
                    </div>
                    <div className="w-10 h-5 bg-emerald-500/30 border border-emerald-400/50 rounded-full flex items-center p-0.5 justify-end cursor-pointer">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full shadow"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Placeholder Card 2: Diagnostics & Tips */}
              <div className="p-4 rounded-2xl bg-neutral-900/30 border border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">●</span>
                  <span>Tab ID: <code className="text-neutral-300 font-mono">activeNav = "{activeNav}"</code></span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">Ready to populate</span>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
