/**
 * Eyeland Dynamic Island Replica
 * Pixel-perfect match to all user screenshots:
 * 1. Collapsed state (19:37 | ● ● | ⚡)
 * 2. Home tab (BIO-CORE, 4 Telemetry tiles, Pet Buddy)
 * 3. AI Tools tab (6-Tool grid with SNIP, CLIPBOARD, VISION badges)
 * 4. Music tab (Spotify blue, beach cover, animated EQ, lyrics bar)
 * 5. Eyeland AI (Welcome screen + automated demo inquiry)
 * 6. Focus tab (25:00 circular Pomodoro, Deep Focus categories, Start Focus button)
 * 7. Staging Shelf (Dashed drop container, Auto-switches on drag, Drag out to any window)
 * 8. Clipboard tab (SMART CLIPBOARD, LIVE SYNC, generic dummy cards)
 * 9. Scratchpad tab (General, Tasks, Snippets, Insert Bullets/Tasks, Saved indicator)
 *
 * Hover behavior: Opens on mouse enter, closes after mouse leaves!
 */

(function () {
  'use strict';

  // State
  const state = {
    isExpanded: false,
    activeTab: 'home', // 'home' | 'features' | 'music' | 'ai' | 'focus' | 'shelf' | 'clipboard' | 'notes'
    isSoundMuted: false,
    isPlayingMusic: false,
    audioContext: null,
    musicInterval: null,
    currentNoteIndex: 0,
    aiDemoPhase: 'welcome', // 'welcome' | 'typing' | 'answered'
    activeToolDetail: null,
    // Focus Timer State
    focusTimeLeft: 25 * 60,
    isFocusRunning: false,
    focusInterval: null,
    focusMode: 'work', // 'work' | 'break' | 'long'
    focusCategory: 'coding', // 'coding' | 'writing' | 'study' | 'design' | 'sprint'
    // Staging Shelf Files
    stagedFiles: [],
    desktopFiles: [
      { id: 'd1', name: 'Q3_Financial_Brief.pdf', size: '2.4 MB', ext: 'pdf' },
      { id: 'd2', name: 'Eyeland_Concept_Art.png', size: '4.1 MB', ext: 'png' }
    ]
  };

  // DOM References
  const islandWrap = document.getElementById('replica-island-wrap');
  const collapsedPill = document.getElementById('replica-collapsed-pill');
  const expandedWindow = document.getElementById('replica-expanded-window');
  const windowContent = document.getElementById('replica-window-content');
  const miniEyeLeft = document.getElementById('replica-mini-eye-left');
  const miniEyeRight = document.getElementById('replica-mini-eye-right');
  const desktopDropZone = document.getElementById('desktop-drop-zone');

  let collapseTimer = null;

  // ---------------------------------------------------------------------------
  // Web Audio Synthesizer (Lofi Music & Sound FX)
  // ---------------------------------------------------------------------------
  function getAudioCtx() {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
    return state.audioContext;
  }

  function playTone(freq, type = 'sine', duration = 0.25, volume = 0.08) {
    if (state.isSoundMuted) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  const yungKaiChords = [293.66, 369.99, 440.00, 587.33, 440.00, 369.99, 261.63, 329.63, 392.00, 523.25];
  function startMusicPlayback() {
    state.isPlayingMusic = true;
    renderTabContent();
    playNextChord();
    state.musicInterval = setInterval(playNextChord, 450);
  }

  function playNextChord() {
    if (!state.isPlayingMusic || state.isSoundMuted) return;
    const note = yungKaiChords[state.currentNoteIndex % yungKaiChords.length];
    state.currentNoteIndex++;
    playTone(note, 'triangle', 0.5, 0.07);
  }

  function stopMusicPlayback() {
    state.isPlayingMusic = false;
    if (state.musicInterval) clearInterval(state.musicInterval);
    renderTabContent();
  }

  function toggleMusic() {
    if (state.isPlayingMusic) {
      stopMusicPlayback();
    } else {
      startMusicPlayback();
    }
  }

  // ---------------------------------------------------------------------------
  // Hover to Open & Mouse Leave to Close (Just like original island!)
  // ---------------------------------------------------------------------------
  function expand() {
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
    state.isExpanded = true;
    if (collapsedPill) collapsedPill.style.display = 'none';
    if (expandedWindow) {
      expandedWindow.style.display = 'flex';
      renderTabContent();
    }
  }

  function collapse() {
    state.isExpanded = false;
    if (expandedWindow) expandedWindow.style.display = 'none';
    if (collapsedPill) collapsedPill.style.display = 'flex';
  }

  if (islandWrap) {
    islandWrap.addEventListener('mouseenter', () => {
      expand();
    });

    islandWrap.addEventListener('mouseleave', () => {
      collapseTimer = setTimeout(() => {
        collapse();
      }, 350);
    });
  }

  if (collapsedPill) {
    collapsedPill.addEventListener('click', expand);
  }

  // ---------------------------------------------------------------------------
  // Gaze Tracking for Round Eyes
  // ---------------------------------------------------------------------------
  const screenArea = document.getElementById('computer-screen-area');
  if (screenArea) {
    screenArea.addEventListener('mousemove', (e) => {
      const rect = screenArea.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Track Mini Eyes in Collapsed State
      trackGaze(miniEyeLeft, miniEyeRight, cursorX, cursorY, rect, 2.5);

      // Track Bio-Core Round Eyes in Home Tab
      const homeEyeL = document.getElementById('home-biocore-eye-l');
      const homeEyeR = document.getElementById('home-biocore-eye-r');
      if (homeEyeL && homeEyeR) {
        trackGaze(homeEyeL, homeEyeR, cursorX, cursorY, rect, 4.5);
      }

      // Track Eyeland AI Round Eyes in Chat Tab
      const chatEyeL = document.getElementById('chat-welcome-eye-l');
      const chatEyeR = document.getElementById('chat-welcome-eye-r');
      if (chatEyeL && chatEyeR) {
        trackGaze(chatEyeL, chatEyeR, cursorX, cursorY, rect, 4.5);
      }
    });
  }

  function trackGaze(leftEye, rightEye, cursorX, cursorY, containerRect, maxOffset = 3) {
    if (!leftEye || !rightEye) return;
    const eyeRect = leftEye.getBoundingClientRect();
    const eyeCenterX = eyeRect.left + eyeRect.width / 2 - containerRect.left;
    const eyeCenterY = eyeRect.top + eyeRect.height / 2 - containerRect.top;

    const angle = Math.atan2(cursorY - eyeCenterY, cursorX - eyeCenterX);
    const dist = Math.min(maxOffset, Math.hypot(cursorX - eyeCenterX, cursorY - eyeCenterY) / 50);

    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;

    leftEye.style.transform = `translate(${x}px, ${y}px)`;
    rightEye.style.transform = `translate(${x}px, ${y}px)`;
  }

  // ---------------------------------------------------------------------------
  // Top Header Bar (Exact across All Tabs)
  // ---------------------------------------------------------------------------
  function renderHeaderBarHtml() {
    return `
      <div class="flex items-center justify-between pb-1 px-1 border-b border-neutral-800/80 mb-1 select-none">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-white font-bold text-xs">Eyeland AI</span>
            <span class="text-neutral-500 text-[10px]">•</span>
            <span class="text-neutral-400 font-mono text-[10px]">Sat 7 Nov 2026 7:56 PM</span>
          </div>
          <a href="#" class="text-rose-400 text-[9px] underline decoration-rose-500/50 hover:text-rose-300 block leading-tight">
            Connect Claude Code or Codex
          </a>
        </div>

        <!-- System Status Tray Icons (Wi-Fi, Bluetooth, Airplane, Wave, More) -->
        <div class="flex items-center gap-2.5 text-xs text-neutral-400">
          <svg class="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
          <svg class="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
          </svg>
          <svg class="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>
          </svg>
          <span class="text-xs">👋</span>
          <span class="text-neutral-500 font-bold tracking-widest text-[11px] cursor-pointer hover:text-white">•••</span>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tab 1: HOME (Screenshot 2)
  // ---------------------------------------------------------------------------
  function renderHomeTabHtml() {
    return `
      <div class="flex-1 flex gap-2.5 overflow-hidden my-1">
        <div class="w-[168px] h-full bg-[#12131a]/95 border border-neutral-800/90 rounded-2xl p-2.5 flex flex-col items-center justify-between shadow-inner relative overflow-hidden group">
          <div class="flex items-center gap-1.5 z-10">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            <span class="text-[9px] font-mono tracking-wider text-neutral-300 uppercase font-semibold">BIO-CORE</span>
          </div>

          <div class="relative w-24 h-24 flex items-center justify-center my-auto">
            <div class="absolute inset-0 rounded-full border border-dashed border-emerald-500/30 animate-spin" style="animation-duration: 20s;"></div>
            <div class="w-20 h-20 rounded-full bg-emerald-500/15 blur-[10px] absolute"></div>
            
            <div class="relative flex items-center gap-3 z-10">
              <div id="home-biocore-eye-l" class="w-3.5 h-3.5 rounded-full bg-[#c5f8d6] shadow-[0_0_10px_#c5f8d6] transition-transform"></div>
              <div id="home-biocore-eye-r" class="w-3.5 h-3.5 rounded-full bg-[#c5f8d6] shadow-[0_0_10px_#c5f8d6] transition-transform"></div>
            </div>
            
            <div id="reactor-heart-slot" class="absolute inset-0 flex items-center justify-center pointer-events-none"></div>
          </div>

          <button id="pet-buddy-btn" type="button" class="z-10 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-700/70 hover:border-rose-500/50 text-[10px] font-medium text-neutral-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm">
            <span class="text-rose-400">❤️</span>
            <span>Pet Buddy</span>
          </button>

          <div class="z-10 text-center">
            <span class="text-[8.5px] font-mono text-emerald-400/90 tracking-wider">SYNC 100% • 60 FPS</span>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-between">
          <div class="grid grid-cols-2 gap-2">
            
            <div class="bg-[#12131a]/95 border border-neutral-800/90 rounded-2xl p-2.5 shadow-inner">
              <div class="flex items-center justify-between text-[10px] mb-1.5">
                <span class="font-bold text-neutral-300 flex items-center gap-1">
                  <span class="text-amber-400">⚡</span> CPU LOAD
                </span>
                <span class="font-mono text-cyan-400 font-bold">27%</span>
              </div>
              <div class="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-1.5">
                <div class="w-[27%] h-full bg-cyan-400 rounded-full"></div>
              </div>
              <div class="flex justify-between text-[8.5px] font-mono text-neutral-500">
                <span>Ryzen 7 4800H</span>
                <span>16T</span>
              </div>
            </div>

            <div class="bg-[#12131a]/95 border border-neutral-800/90 rounded-2xl p-2.5 shadow-inner">
              <div class="flex items-center justify-between text-[10px] mb-1.5">
                <span class="font-bold text-neutral-300 flex items-center gap-1">
                  <span class="text-pink-400">🧠</span> MEMORY
                </span>
                <span class="font-mono text-pink-400 font-bold">89%</span>
              </div>
              <div class="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-1.5">
                <div class="w-[89%] h-full bg-pink-500 rounded-full"></div>
              </div>
              <div class="flex justify-between text-[8.5px] font-mono text-neutral-500">
                <span>13.8 GB</span>
                <span>/ 15.4 GB</span>
              </div>
            </div>

            <div class="bg-[#12131a]/95 border border-neutral-800/90 rounded-2xl p-2.5 shadow-inner">
              <div class="flex items-center justify-between text-[10px] mb-1.5">
                <span class="font-bold text-neutral-300 flex items-center gap-1">
                  <span class="text-blue-400">📶</span> Airtel_avir_6288
                </span>
                <span class="font-mono text-blue-400 font-bold">79%</span>
              </div>
              <div class="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-1.5">
                <div class="w-[79%] h-full bg-blue-500 rounded-full"></div>
              </div>
              <div class="flex justify-between text-[8.5px] font-mono text-neutral-500">
                <span>1201 Mbps</span>
                <span>Wi-Fi</span>
              </div>
            </div>

            <div class="bg-[#12131a]/95 border border-neutral-800/90 rounded-2xl p-2.5 shadow-inner">
              <div class="flex items-center justify-between text-[10px] mb-1.5">
                <span class="font-bold text-neutral-300 flex items-center gap-1">
                  <span class="text-amber-400">⚡</span> POWER
                </span>
                <span class="font-mono text-emerald-400 font-bold">100%</span>
              </div>
              <div class="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-1.5">
                <div class="w-full h-full bg-emerald-400 rounded-full"></div>
              </div>
              <div class="flex justify-between text-[8.5px] font-mono text-emerald-400">
                <span>Fully Charged (AC)</span>
                <span class="text-neutral-500">Optimum</span>
              </div>
            </div>

          </div>

          <div class="flex items-center justify-between pt-1 text-[9px] font-mono text-neutral-400 px-1">
            <span>NODE: <strong class="text-neutral-200">LAPTOP-98KKH4RP</strong> • UP: <span class="text-emerald-400">8h 3m</span></span>
            <div class="flex items-center gap-1.5">
              <button type="button" class="dock-tab-btn px-2.5 py-1 rounded-full bg-neutral-900 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 hover:bg-neutral-800 cursor-pointer" data-tab="ai">
                <span>💬</span>
                <span>Eyeland AI</span>
              </button>
              <button type="button" class="dock-tab-btn px-2 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 flex items-center gap-1 hover:bg-neutral-800 cursor-pointer" data-tab="features">
                <span>📷</span>
                <span>Scan</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tab 2: AI TOOLS TAB (Screenshot 3)
  // ---------------------------------------------------------------------------
  function renderFeaturesTabHtml() {
    if (state.activeToolDetail) {
      return renderToolDetailCardHtml(state.activeToolDetail);
    }

    return `
      <div class="flex-1 flex flex-col justify-between my-1">
        <div class="flex items-center justify-between mb-2 px-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
              <span class="text-amber-400">✱</span>
              <span>AI NEURAL SUITE</span>
            </span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono flex items-center gap-1">
              <span>⚡</span> Built-in Gemini
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-[9px] font-mono">
            <button class="tool-launcher-btn px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 flex items-center gap-1 hover:bg-sky-500/25 cursor-pointer" data-tool="snip">
              <span>+</span>
              <span>Snip Screen</span>
            </button>
            <button class="tool-launcher-btn px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1 hover:bg-neutral-800 cursor-pointer" data-tool="polish">
              <span>📋</span>
              <span>Clipboard</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 grid-rows-2 gap-2.5 flex-1">
          <div class="tool-card p-2.5 rounded-2xl bg-[#12131a] hover:bg-[#181924] border border-neutral-800/90 hover:border-sky-500/50 flex flex-col justify-between cursor-pointer transition-all active:scale-95" data-tool="explain">
            <div class="flex items-center justify-between">
              <span class="text-base">💡</span>
              <span class="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold">SNIP</span>
            </div>
            <div>
              <span class="text-xs font-bold text-neutral-100 block">Explain</span>
              <span class="text-[8.5px] text-neutral-400 block truncate">ELI5 & concept breakdown</span>
            </div>
          </div>

          <div class="tool-card p-2.5 rounded-2xl bg-[#12131a] hover:bg-[#181924] border border-neutral-800/90 hover:border-emerald-500/50 flex flex-col justify-between cursor-pointer transition-all active:scale-95" data-tool="polish">
            <div class="flex items-center justify-between">
              <span class="text-base">✨</span>
              <span class="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">CLIPBOARD</span>
            </div>
            <div>
              <span class="text-xs font-bold text-neutral-100 block">Polish</span>
              <span class="text-[8.5px] text-neutral-400 block truncate">Tone, grammar & diffs</span>
            </div>
          </div>

          <div class="tool-card p-2.5 rounded-2xl bg-[#12131a] hover:bg-[#181924] border border-neutral-800/90 hover:border-cyan-500/50 flex flex-col justify-between cursor-pointer transition-all active:scale-95" data-tool="translate">
            <div class="flex items-center justify-between">
              <span class="text-base">🌐</span>
              <span class="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold">SNIP</span>
            </div>
            <div>
              <span class="text-xs font-bold text-neutral-100 block">Translate</span>
              <span class="text-[8.5px] text-neutral-400 block truncate">40+ Languages & Audio</span>
            </div>
          </div>

          <div class="tool-card p-2.5 rounded-2xl bg-[#12131a] hover:bg-[#181924] border border-neutral-800/90 hover:border-purple-500/50 flex flex-col justify-between cursor-pointer transition-all active:scale-95" data-tool="summarize">
            <div class="flex items-center justify-between">
              <span class="text-base">≡</span>
              <span class="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">SNIP</span>
            </div>
            <div>
              <span class="text-xs font-bold text-neutral-100 block">Summarize</span>
              <span class="text-[8.5px] text-neutral-400 block truncate">TL;DR & task checklists</span>
            </div>
          </div>

          <div class="tool-card p-2.5 rounded-2xl bg-[#12131a] hover:bg-[#181924] border border-neutral-800/90 hover:border-amber-500/50 flex flex-col justify-between cursor-pointer transition-all active:scale-95" data-tool="code">
            <div class="flex items-center justify-between">
              <span class="text-base">🛠️</span>
              <span class="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">CLIPBOARD</span>
            </div>
            <div>
              <span class="text-xs font-bold text-neutral-100 block">Fix Code</span>
              <span class="text-[8.5px] text-neutral-400 block truncate">Debug syntax & errors</span>
            </div>
          </div>

          <div class="tool-card p-2.5 rounded-2xl bg-[#12131a] hover:bg-[#181924] border border-neutral-800/90 hover:border-rose-500/50 flex flex-col justify-between cursor-pointer transition-all active:scale-95" data-tool="snip">
            <div class="flex items-center justify-between">
              <span class="text-base">✂️</span>
              <span class="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">VISION</span>
            </div>
            <div>
              <span class="text-xs font-bold text-neutral-100 block">Snip & Ask</span>
              <span class="text-[8.5px] text-neutral-400 block truncate">Marquee crop any UI</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderToolDetailCardHtml(tool) {
    return `
      <div class="flex-1 flex flex-col justify-between bg-neutral-900/80 rounded-2xl p-3 border border-neutral-800 my-1">
        <div class="flex items-center justify-between pb-1.5 border-b border-neutral-800">
          <div class="flex items-center gap-2">
            <button id="close-tool-detail" class="px-2 py-0.5 rounded-lg bg-neutral-800 text-[10px] text-neutral-300 hover:text-white cursor-pointer">← Back</button>
            <span class="text-xs font-bold text-white uppercase">${tool} Live Result</span>
          </div>
          <span class="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">OCR Ready</span>
        </div>

        <div class="flex-1 my-2 overflow-y-auto text-xs leading-relaxed text-neutral-200">
          <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-neutral-200 mb-2">
            <span class="font-bold text-amber-400 block mb-0.5">💡 In Plain English (ELI5):</span>
            Eyeland transforms your top monitor bezel into an interactive companion. Dragging files to the notch buffers them into your staging shelf across all displays.
          </div>
          <div class="space-y-1 text-[10px]">
            <span class="font-mono text-neutral-400 uppercase tracking-wider font-semibold">Key Takeaways:</span>
            <p class="text-neutral-300">✓ 1-Click OCR extraction with Gemini 3.5 Flash</p>
            <p class="text-neutral-300">✓ Frictionless drag & drop buffer across monitors</p>
          </div>
        </div>

        <div class="flex justify-between items-center text-[10px] pt-1 border-t border-neutral-800">
          <span class="text-neutral-500 font-mono">Processed in 160ms</span>
          <button id="close-tool-detail-2" class="text-sky-400 hover:underline cursor-pointer">Done</button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tab 3: MUSIC TAB (Screenshot 4)
  // ---------------------------------------------------------------------------
  function renderMusicTabHtml() {
    return `
      <div class="flex-1 flex flex-col justify-between my-1 relative select-none">
        <div class="absolute -top-4 -left-4 w-52 h-44 bg-[#c49f47]/20 rounded-full blur-[40px] pointer-events-none"></div>

        <div class="flex items-center justify-between mb-2 z-10">
          <div class="flex items-center gap-1.5 text-[9.5px] font-mono font-medium">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
              <span class="text-emerald-400">●</span> SPOTIFY DESKTOP
            </span>
            <span class="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
              <span class="text-cyan-400 animate-ping w-1.5 h-1.5 rounded-full bg-cyan-400"></span> LIVE SYNC
            </span>
            <span class="px-2 py-0.5 rounded-full bg-[#c49f47]/20 border border-[#c49f47]/30 text-[#e6c577] flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-[#c49f47]"></span> #C49F47
            </span>
          </div>

          <button id="music-sync-btn" class="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[9.5px] font-mono text-neutral-300 flex items-center gap-1 hover:text-white cursor-pointer">
            <span>🔄</span> Sync
          </button>
        </div>

        <div class="flex items-center gap-4 z-10 my-auto">
          <!-- Beach Album Art from Screenshot 4 -->
          <div class="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-xl relative bg-sky-900">
            <svg class="w-full h-full object-cover" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect width="100" height="50" fill="#a7c7e7" />
              <path d="M 10 20 Q 30 10 50 20 Q 70 30 90 20 L 90 45 L 10 45 Z" fill="#ffffff" opacity="0.6" />
              <rect y="40" width="100" height="35" fill="#3a75c4" />
              <path d="M 0 55 Q 30 48 60 55 Q 85 62 100 55 L 100 65 L 0 65 Z" fill="#6ba3e8" opacity="0.5" />
              <rect y="65" width="100" height="35" fill="#e2c88f" />
              <circle cx="48" cy="62" r="1.5" fill="#333" />
              <line x1="48" y1="63.5" x2="48" y2="70" stroke="#333" stroke-width="1.2" />
              <circle cx="53" cy="63" r="1.5" fill="#333" />
              <line x1="53" y1="64.5" x2="53" y2="70" stroke="#333" stroke-width="1.2" />
            </svg>
          </div>

          <div class="flex-1 min-w-0 flex flex-col justify-between">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-base font-extrabold text-white leading-tight">blue</h3>
                <p class="text-xs text-neutral-400">yung kai • blue</p>
              </div>

              <div class="flex items-end gap-1 h-5 pt-1">
                <div class="w-1 bg-[#c49f47] rounded-full eq-bar-1"></div>
                <div class="w-1 bg-[#c49f47] rounded-full eq-bar-2"></div>
                <div class="w-1 bg-[#c49f47] rounded-full eq-bar-3"></div>
                <div class="w-1 bg-[#c49f47] rounded-full eq-bar-4"></div>
              </div>
            </div>

            <div class="my-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200 truncate flex items-center gap-2">
              <span class="text-[#c49f47]">♪</span>
              <span class="truncate">Your morning eyes, I could stare like watching stars</span>
            </div>

            <div>
              <div class="flex justify-between text-[9px] font-mono text-neutral-400 mb-1">
                <span>00:19</span>
                <span class="text-neutral-500 uppercase">STREAMING HD</span>
                <span>03:34</span>
              </div>
              <div class="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div class="w-[20%] h-full bg-[#c49f47] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-7 z-10 pt-1 text-neutral-400 text-sm">
          <button class="hover:text-white transition-colors cursor-pointer text-xs">🔀</button>
          <button class="hover:text-white transition-colors cursor-pointer text-xs">⏮</button>
          
          <button id="music-play-toggle-btn" class="w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer">
            ${state.isPlayingMusic ? '⏸' : '▶'}
          </button>

          <button class="hover:text-white transition-colors cursor-pointer text-xs">⏭</button>
          <button class="hover:text-white transition-colors cursor-pointer text-xs">🔁</button>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tab 4: EYELAND AI TAB (Screenshot 5 + Automated Demo)
  // ---------------------------------------------------------------------------
  function renderAiTabHtml() {
    if (state.aiDemoPhase === 'answered') {
      return renderAiAnsweredHtml();
    }

    return `
      <div class="flex-1 flex flex-col justify-between my-1 select-none">
        <div class="flex items-center gap-2 px-1 mb-1">
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] flex items-center gap-1 font-semibold">
            <span>⚡</span> gemini-3.5-flash
          </span>
          <span class="text-[10px] font-mono text-neutral-400">LLM Chat</span>
        </div>

        <div class="my-auto flex flex-col items-center justify-center text-center px-4">
          <div class="relative flex items-center justify-center mb-3">
            <div class="absolute w-20 h-10 bg-emerald-400/25 rounded-full blur-[14px] pointer-events-none"></div>
            <div class="relative flex items-center gap-3">
              <div id="chat-welcome-eye-l" class="w-3.5 h-3.5 rounded-full bg-[#c5f8d6] shadow-[0_0_12px_#c5f8d6] transition-transform"></div>
              <div id="chat-welcome-eye-r" class="w-3.5 h-3.5 rounded-full bg-[#c5f8d6] shadow-[0_0_12px_#c5f8d6] transition-transform"></div>
            </div>
          </div>

          <h3 class="text-base font-extrabold text-white mb-1">What can I do for you today?</h3>
          <p class="text-xs text-neutral-400 max-w-sm mb-4">
            Ask anything, snip any screen area, or choose a quick lens below:
          </p>

          <div class="flex flex-wrap items-center justify-center gap-2">
            <button class="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10.5px] text-neutral-200 hover:border-neutral-700 flex items-center gap-1 cursor-pointer">
              <span>💡</span> Explain
            </button>
            <button class="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10.5px] text-neutral-200 hover:border-neutral-700 flex items-center gap-1 cursor-pointer">
              <span>✨</span> Polish
            </button>
            <button class="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10.5px] text-neutral-200 hover:border-neutral-700 flex items-center gap-1 cursor-pointer">
              <span>≡</span> Summarize
            </button>
            <button class="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10.5px] text-neutral-200 hover:border-neutral-700 flex items-center gap-1 cursor-pointer">
              <span>🛠️</span> Fix Code
            </button>
            <button class="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-[10.5px] text-sky-300 flex items-center gap-1 cursor-pointer">
              <span>📷</span> Snip Screen
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-[#121318] border border-neutral-800/90 rounded-full px-3.5 py-1.5 shadow-lg">
          <div class="flex items-center gap-2 text-neutral-400 text-xs">
            <span class="hover:text-white cursor-pointer">📷</span>
            <span class="hover:text-white cursor-pointer">📎</span>
            <span class="hover:text-white cursor-pointer">📋</span>
          </div>

          <div class="flex-1 text-xs text-neutral-500 px-1 truncate">
            <span id="ai-demo-input-text">Ask Eyeland anything...</span>
          </div>

          <div class="flex items-center gap-2 text-xs">
            <span class="text-neutral-400 hover:text-white cursor-pointer">🎤</span>
            <div class="w-6 h-6 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-bold">
              ↑
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAiAnsweredHtml() {
    return `
      <div class="flex-1 flex flex-col justify-between my-1">
        <div class="flex items-center justify-between px-1 mb-1 border-b border-neutral-800/60 pb-1">
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] font-semibold">
            ⚡ Gemini 3.5 Flash Active
          </span>
          <button id="reset-ai-demo-btn" class="text-[9px] font-mono text-neutral-400 hover:text-white underline cursor-pointer">
            Replay Query
          </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-2 pr-1 my-1 text-xs" style="scrollbar-width: thin;">
          <div class="flex justify-end">
            <div class="bg-neutral-800 text-neutral-100 px-3.5 py-1.5 rounded-2xl rounded-tr-sm max-w-[85%] border border-white/5 text-[11px]">
              How does the Staging Shelf work across multiple monitors?
            </div>
          </div>

          <div class="flex items-start gap-2">
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-[9px] font-bold shrink-0 mt-0.5">
              AI
            </div>
            <div class="bg-neutral-900/90 border border-neutral-800 text-neutral-200 p-2.5 rounded-2xl rounded-tl-sm text-[11px] leading-relaxed w-full">
              <p class="mb-1.5 text-white font-medium">Eyeland simplifies multi-screen drag-and-drop:</p>
              <div class="bg-black/50 border border-white/5 rounded-lg p-2 font-mono text-[10px] text-emerald-300 space-y-1">
                <p>• Drag any file to your primary monitor's top notch</p>
                <p>• The file stays buffered in your Staging Shelf</p>
                <p>• Drag it out directly into apps on secondary screens</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-[#121318] border border-neutral-800/90 rounded-full px-3 py-1.5 text-xs text-neutral-500">
          <span class="flex-1 text-[11px]">Automated demo session active...</span>
          <span class="text-[10px] font-mono text-emerald-400">Streamed</span>
        </div>
      </div>
    `;
  }

  function triggerAiAutomatedFlow() {
    if (state.aiDemoPhase === 'welcome') {
      setTimeout(() => {
        if (state.activeTab === 'ai' && state.aiDemoPhase === 'welcome') {
          const inputTxt = document.getElementById('ai-demo-input-text');
          if (inputTxt) {
            inputTxt.textContent = "How does the Staging Shelf work across multiple monitors?";
            inputTxt.classList.add('text-white');
            setTimeout(() => {
              state.aiDemoPhase = 'answered';
              playTone(680, 'sine', 0.2, 0.06);
              renderTabContent();
            }, 800);
          }
        }
      }, 1500);
    }
  }

  // ---------------------------------------------------------------------------
  // Tab 5: FOCUS TAB (Exact Focus Screenshot)
  // ---------------------------------------------------------------------------
  function renderFocusTabHtml() {
    const mins = Math.floor(state.focusTimeLeft / 60).toString().padStart(2, '0');
    const secs = (state.focusTimeLeft % 60).toString().padStart(2, '0');

    return `
      <div class="flex-1 flex gap-3 my-1 select-none items-center">
        <!-- Left Side: Circular Focus Clock & Mode Pills -->
        <div class="w-[185px] flex flex-col items-center justify-between h-full py-1">
          
          <!-- Circular Clock Ring -->
          <div class="relative w-32 h-32 flex flex-col items-center justify-center my-auto">
            <!-- Orange Gauge Ring -->
            <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#222" stroke-width="5" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" stroke-width="5" stroke-dasharray="264" stroke-dashoffset="40" stroke-linecap="round" />
            </svg>
            
            <div class="z-10 text-center flex flex-col items-center">
              <span class="text-[9px] font-mono text-amber-400 font-bold flex items-center gap-1 mb-0.5">
                <span>🎯</span> WORK
              </span>
              <span id="focus-time-num" class="font-mono text-2xl font-extrabold text-white tracking-tight leading-none">${mins}:${secs}</span>
              <!-- 4 Dots (Cycle 1 of 4) -->
              <div class="flex items-center gap-1.5 mt-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>
              </div>
            </div>
          </div>

          <!-- Mode Pills Below Circle -->
          <div class="flex items-center gap-2">
            <button class="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer">
              <span>🎯</span> Work
            </button>
            <button class="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] flex items-center gap-1 cursor-pointer">
              <span>☕</span> Break
            </button>
            <button class="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] flex items-center gap-1 cursor-pointer">
              <span>🌴</span> Long
            </button>
          </div>
        </div>

        <!-- Right Side: Current Target & Controls -->
        <div class="flex-1 flex flex-col justify-between h-full py-1">
          <div>
            <div class="flex items-center justify-between text-[10px] font-mono mb-1">
              <span class="text-amber-400 font-bold flex items-center gap-1">
                <span>●</span> CURRENT TARGET
              </span>
              <span class="text-neutral-500">Cycle 1 of 4</span>
            </div>

            <h3 class="text-base font-bold text-white mb-2">Deep Focus</h3>

            <!-- Categories Pills -->
            <div class="flex flex-wrap items-center gap-1.5 mb-3">
              <button class="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] flex items-center gap-1 font-medium cursor-pointer">
                <span>💻</span> Coding
              </button>
              <button class="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] flex items-center gap-1 cursor-pointer">
                <span>📄</span> Writing
              </button>
              <button class="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] flex items-center gap-1 cursor-pointer">
                <span>📚</span> Study
              </button>
              <button class="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] flex items-center gap-1 cursor-pointer">
                <span>🎨</span> Design
              </button>
              <button class="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] flex items-center gap-1 cursor-pointer">
                <span>⚡</span> Sprint
              </button>
            </div>
          </div>

          <!-- Large White Start Focus Button + Skip & Reset -->
          <div class="flex items-center gap-2">
            <button id="focus-start-btn" class="flex-1 py-2 rounded-2xl bg-white hover:bg-neutral-100 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer">
              <span>${state.isFocusRunning ? '⏸ Pause Focus' : '▶ Start Focus'}</span>
            </button>
            <button id="focus-skip-btn" class="w-9 h-9 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 flex items-center justify-center text-xs cursor-pointer">
              ⏭
            </button>
            <button id="focus-reset-btn" class="w-9 h-9 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 flex items-center justify-center text-xs cursor-pointer">
              🔄
            </button>
          </div>

          <!-- Bottom Sub-Bar -->
          <div class="flex items-center justify-between text-[9.5px] font-mono text-neutral-500 pt-1 border-t border-neutral-800/80">
            <div class="flex items-center gap-3">
              <span class="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold">25/5 Classic</span>
              <span>50/10 Deep</span>
              <span>15/3 Sprint</span>
            </div>
            <div class="flex items-center gap-2">
              <span>🔔</span>
              <span>🔥 0 days</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tab 6: STAGING SHELF (Exact Staging Shelf Screenshot)
  // ---------------------------------------------------------------------------
  function renderShelfTabHtml() {
    return `
      <div class="flex-1 flex flex-col justify-between my-1 select-none">
        <!-- Sub-header -->
        <div class="flex items-center justify-between mb-2 px-1">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono flex items-center gap-1 font-semibold">
              <span>📥</span> STAGING SHELF
            </span>
            <span class="text-[10px] font-mono text-neutral-400">
              ${state.stagedFiles.length === 0 ? 'Empty' : `${state.stagedFiles.length} item(s)`}
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-[9.5px] font-mono">
            <button class="px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1 hover:text-white cursor-pointer">
              <span>📄</span> + File
            </button>
            <button class="px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1 hover:text-white cursor-pointer">
              <span class="text-amber-400">📁</span> + Folder
            </button>
          </div>
        </div>

        <!-- Main Dashed Drop Container from Screenshot 3 -->
        <div class="flex-1 border border-dashed border-neutral-800 hover:border-indigo-500/50 rounded-2xl bg-neutral-950/40 p-4 flex flex-col items-center justify-center text-center transition-colors my-1">
          
          <div class="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 text-lg mb-2">
            📥
          </div>

          <h4 class="text-sm font-bold text-white mb-1">Drag any file or folder here</h4>
          <p class="text-[11px] text-neutral-400 max-w-sm mb-3">
            Drag files from Explorer or Desktop to hold them, then drag them straight out into any other app!
          </p>

          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300 flex items-center gap-1">
              <span class="text-amber-400">⚡</span> Auto-switches on drag
            </span>
            <span class="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300 flex items-center gap-1">
              <span>🪟</span> Drag out to any window
            </span>
          </div>
        </div>

        <!-- Bottom Hint from Screenshot 3 -->
        <div class="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1 pt-1">
          <span class="text-amber-400">💡</span>
          <span>Drag any card out to drop into Explorer, Browser, Slack, Word, etc.</span>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tab 7: CLIPBOARD TAB (Exact Screenshot 4 layout, Generic Data)
  // ---------------------------------------------------------------------------
  function renderClipboardTabHtml() {
    return `
      <div class="flex-1 flex flex-col justify-between my-1 select-none">
        <!-- Sub-header -->
        <div class="flex items-center justify-between mb-2 px-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
              <span>📋</span> SMART CLIPBOARD
            </span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-mono flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> LIVE SYNC
            </span>
          </div>

          <div class="flex items-center gap-3 text-[10px] font-mono">
            <span class="text-neutral-500">10/10 stored</span>
            <button class="text-neutral-400 hover:text-white cursor-pointer">Clear All</button>
          </div>
        </div>

        <!-- Scrollable List of Clipboard Cards (Exact Screenshot 4 format) -->
        <div class="flex-1 overflow-y-auto space-y-2 pr-1 my-1 text-xs" style="scrollbar-width: thin;">
          
          <!-- Card 1 -->
          <div class="p-3 rounded-2xl bg-[#12131a] border border-neutral-800/90 hover:border-neutral-700 transition-colors">
            <div class="flex items-center justify-between text-[9px] font-mono text-neutral-500 mb-1.5">
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold uppercase">TEXT</span>
                <span>6h ago</span>
              </div>
              <span>24 chars</span>
            </div>
            <p class="font-mono text-neutral-200 text-xs">https://eyeland.app/release</p>
          </div>

          <!-- Card 2 -->
          <div class="p-3 rounded-2xl bg-[#12131a] border border-neutral-800/90 hover:border-neutral-700 transition-colors">
            <div class="flex items-center justify-between text-[9px] font-mono text-neutral-500 mb-1.5">
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold uppercase">TEXT</span>
                <span>7h ago</span>
              </div>
              <span>111 chars</span>
            </div>
            <p class="font-sans text-neutral-200 text-xs leading-relaxed">
              Living OLED desktop dynamic island companion for Windows and macOS. Seamless intelligence right at your top edge.
            </p>
          </div>

        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tab 8: SCRATCHPAD / NOTES TAB (Exact Screenshot 5)
  // ---------------------------------------------------------------------------
  function renderNotesTabHtml() {
    return `
      <div class="flex-1 flex flex-col justify-between my-1 select-none">
        <!-- Sub-header -->
        <div class="flex items-center justify-between mb-1.5 px-1">
          <div class="flex items-center gap-2">
            <span class="text-neutral-400 text-xs">📄</span>
            <div class="flex items-center gap-1.5 text-[10px] font-mono">
              <button class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer">
                <span>📄</span> General
              </button>
              <button class="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-1 cursor-pointer">
                <span>🎯</span> Tasks
              </button>
              <button class="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-1 cursor-pointer">
                <span>💡</span> Snippets
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 text-[9px] font-mono text-neutral-400">
            <span>0w • 0c</span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Saved
            </span>
          </div>
        </div>

        <!-- Formatting Action Bar from Screenshot 5 -->
        <div class="flex items-center justify-between text-[9px] font-mono text-neutral-400 mb-1.5 px-1">
          <div class="flex items-center gap-1.5">
            <span class="text-neutral-500 mr-0.5">Insert:</span>
            <button class="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:text-white cursor-pointer">
              • Bullet
            </button>
            <button class="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:text-white cursor-pointer">
              [ ] Task
            </button>
            <button class="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:text-white cursor-pointer flex items-center gap-1">
              <span>🕒</span> Time
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <button class="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:text-white cursor-pointer">
              { } Mono
            </button>
            <button class="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:text-white cursor-pointer flex items-center gap-1">
              <span>📋</span> Copy
            </button>
            <button class="p-1 rounded bg-neutral-900 border border-neutral-800 hover:text-white cursor-pointer">
              🎨
            </button>
            <button class="p-1 rounded bg-neutral-900 border border-neutral-800 hover:text-rose-400 cursor-pointer">
              🗑️
            </button>
          </div>
        </div>

        <!-- Main Textarea Container -->
        <div class="flex-1 bg-black/50 border border-neutral-800/90 rounded-2xl p-3 flex flex-col">
          <textarea class="w-full flex-1 bg-transparent text-neutral-300 text-xs outline-none resize-none font-sans leading-relaxed placeholder-neutral-600" placeholder="Jot down quick thoughts, brainstorm ideas, or drafts...&#10;&#10;(Tip: Press Tab to indent, Enter to continue bullets)"></textarea>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Bottom Dock across All Tabs
  // ---------------------------------------------------------------------------
  function renderBottomDockHtml() {
    return `
      <div class="w-full flex items-center justify-between px-3 py-1 rounded-full bg-[#131316] border border-[#222226] shadow-lg select-none">
        
        <div class="flex items-center justify-between flex-1 pr-2 gap-1">
          
          <!-- 1. Home -->
          <button type="button" class="dock-tab-btn p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            state.activeTab === 'home'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
          }" data-tab="home" title="Home Cockpit & Telemetry">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>

          <!-- 2. Star / AI Neural Suite -->
          <button type="button" class="dock-tab-btn p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            state.activeTab === 'features'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
          }" data-tab="features" title="AI Tools & Features Suite">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>

          <!-- 3. Music -->
          <button type="button" class="dock-tab-btn p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            state.activeTab === 'music'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
          }" data-tab="music" title="Music Player">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </button>

          <!-- 4. Eyeland AI Chat Pill -->
          <button type="button" class="dock-tab-btn px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
            state.activeTab === 'ai'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
          }" data-tab="ai" title="Eyeland AI Assistant">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Eyeland</span>
          </button>

          <!-- 5. Focus Timer -->
          <button type="button" class="dock-tab-btn p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
            state.activeTab === 'focus'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
          }" data-tab="focus" title="Focus Mode">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>

          <!-- 6. Staging Shelf -->
          <button type="button" class="dock-tab-btn p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
            state.activeTab === 'shelf'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
          }" data-tab="shelf" title="Staging Shelf">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>
          </button>

          <!-- 7. Clipboard with Green Badge 10 -->
          <button type="button" class="dock-tab-btn p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
            state.activeTab === 'clipboard'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
          }" data-tab="clipboard" title="Clipboard History">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 text-[7px] font-bold text-black flex items-center justify-center pointer-events-none shadow-sm">
              10
            </span>
          </button>

          <!-- 8. Notes -->
          <button type="button" class="dock-tab-btn p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
            state.activeTab === 'notes'
              ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
          }" data-tab="notes" title="Notes">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </button>
        </div>

        <div class="h-4 w-px bg-neutral-800/90 flex-shrink-0"></div>

        <!-- Far Right: Volume / Sound Mute Button -->
        <button type="button" id="mute-sound-btn" class="p-1.5 rounded-xl transition-all cursor-pointer ml-1.5 flex items-center justify-center ${
          state.isSoundMuted
            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/25'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
        }" title="${state.isSoundMuted ? 'Sound Muted' : 'Sound Active'}">
          ${
            state.isSoundMuted
              ? '<span class="text-xs">🔇</span>'
              : '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'
          }
        </button>

      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Master Render Function
  // ---------------------------------------------------------------------------
  function renderTabContent() {
    if (!windowContent) return;

    let body = '';
    if (state.activeTab === 'home') body = renderHomeTabHtml();
    else if (state.activeTab === 'features') body = renderFeaturesTabHtml();
    else if (state.activeTab === 'music') body = renderMusicTabHtml();
    else if (state.activeTab === 'ai') body = renderAiTabHtml();
    else if (state.activeTab === 'focus') body = renderFocusTabHtml();
    else if (state.activeTab === 'shelf') body = renderShelfTabHtml();
    else if (state.activeTab === 'clipboard') body = renderClipboardTabHtml();
    else if (state.activeTab === 'notes') body = renderNotesTabHtml();

    windowContent.innerHTML = `
      ${renderHeaderBarHtml()}
      ${body}
      ${renderBottomDockHtml()}
    `;

    attachEvents();

    if (state.activeTab === 'ai') {
      triggerAiAutomatedFlow();
    }
  }

  function attachEvents() {
    // Dock tab switching
    document.querySelectorAll('.dock-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          state.activeTab = tab;
          state.activeToolDetail = null;
          playTone(520, 'sine', 0.1, 0.05);
          renderTabContent();
        }
      });
    });

    // Mute toggle
    const muteBtn = document.getElementById('mute-sound-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.isSoundMuted = !state.isSoundMuted;
        renderTabContent();
      });
    }

    // Pet Buddy Button
    const petBtn = document.getElementById('pet-buddy-btn');
    if (petBtn) {
      petBtn.addEventListener('click', () => {
        playTone(720, 'sine', 0.3, 0.1);
        const slot = document.getElementById('reactor-heart-slot');
        if (slot) {
          const heart = document.createElement('span');
          heart.className = 'floating-heart';
          heart.textContent = '💖';
          slot.appendChild(heart);
          setTimeout(() => heart.remove(), 850);
        }
      });
    }

    // Tool Detail triggers
    document.querySelectorAll('.tool-card').forEach((card) => {
      card.addEventListener('click', () => {
        const tool = card.getAttribute('data-tool');
        state.activeToolDetail = tool;
        playTone(620, 'sine', 0.12, 0.06);
        renderTabContent();
      });
    });

    const closeTool = document.getElementById('close-tool-detail');
    const closeTool2 = document.getElementById('close-tool-detail-2');
    if (closeTool) {
      closeTool.addEventListener('click', () => {
        state.activeToolDetail = null;
        renderTabContent();
      });
    }
    if (closeTool2) {
      closeTool2.addEventListener('click', () => {
        state.activeToolDetail = null;
        renderTabContent();
      });
    }

    // Music Play Toggle
    const musicBtn = document.getElementById('music-play-toggle-btn');
    if (musicBtn) {
      musicBtn.addEventListener('click', toggleMusic);
    }

    // Focus Start/Pause Toggle
    const focusStartBtn = document.getElementById('focus-start-btn');
    if (focusStartBtn) {
      focusStartBtn.addEventListener('click', () => {
        state.isFocusRunning = !state.isFocusRunning;
        if (state.isFocusRunning) {
          playTone(600, 'sine', 0.2, 0.08);
          state.focusInterval = setInterval(() => {
            if (state.focusTimeLeft > 0) {
              state.focusTimeLeft--;
              const numEl = document.getElementById('focus-time-num');
              if (numEl) {
                const mins = Math.floor(state.focusTimeLeft / 60).toString().padStart(2, '0');
                const secs = (state.focusTimeLeft % 60).toString().padStart(2, '0');
                numEl.textContent = `${mins}:${secs}`;
              }
            } else {
              clearInterval(state.focusInterval);
              state.isFocusRunning = false;
              playTone(880, 'sine', 0.8, 0.15);
            }
          }, 1000);
        } else {
          clearInterval(state.focusInterval);
        }
        renderTabContent();
      });
    }

    const focusReset = document.getElementById('focus-reset-btn');
    if (focusReset) {
      focusReset.addEventListener('click', () => {
        clearInterval(state.focusInterval);
        state.isFocusRunning = false;
        state.focusTimeLeft = 25 * 60;
        renderTabContent();
      });
    }

    // Replay AI Demo
    const resetAiDemo = document.getElementById('reset-ai-demo-btn');
    if (resetAiDemo) {
      resetAiDemo.addEventListener('click', () => {
        state.aiDemoPhase = 'welcome';
        renderTabContent();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Draggable Desktop Files (Real Windows desktop shortcuts on the wallpaper)
  // ---------------------------------------------------------------------------
  function renderDesktopFiles() {
    if (!desktopDropZone) return;
    desktopDropZone.innerHTML = '';

    state.desktopFiles.forEach((file) => {
      const el = document.createElement('div');
      el.className = 'desktop-icon-item select-none';
      el.setAttribute('draggable', 'true');
      el.setAttribute('data-id', file.id);

      el.innerHTML = `
        <span class="text-2xl mb-1">${file.ext === 'pdf' ? '📄' : '🖼️'}</span>
        <span class="text-[10px] font-medium text-neutral-200 block truncate w-full drop-shadow">${file.name}</span>
      `;

      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', file.id);
        el.style.opacity = '0.5';
        if (collapsedPill) collapsedPill.classList.add('island-drop-highlight');
      });

      el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        if (collapsedPill) collapsedPill.classList.remove('island-drop-highlight');
      });

      desktopDropZone.appendChild(el);
    });
  }

  // Drop listeners on island
  const dropTargets = [collapsedPill, expandedWindow].filter(Boolean);
  dropTargets.forEach((target) => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      target.classList.add('island-drop-highlight');
    });

    target.addEventListener('dragleave', () => {
      target.classList.remove('island-drop-highlight');
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('island-drop-highlight');
      const fileId = e.dataTransfer.getData('text/plain');
      const file = state.desktopFiles.find((f) => f.id === fileId);

      if (file) {
        state.desktopFiles = state.desktopFiles.filter((f) => f.id !== fileId);
        state.stagedFiles.push(file);
        state.activeTab = 'shelf';
        expand();
        renderDesktopFiles();
        playTone(740, 'triangle', 0.35, 0.1);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Live Clock Synchronization (Exact match to local time)
  // ---------------------------------------------------------------------------
  function updateLiveClocks() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const collapsedClock = document.getElementById('collapsed-clock-time');
    if (collapsedClock) collapsedClock.textContent = timeStr;

    const taskbarClock = document.getElementById('win11-taskbar-clock');
    if (taskbarClock) taskbarClock.textContent = timeStr;
  }
  updateLiveClocks();
  setInterval(updateLiveClocks, 1000);

  // Initialize
  renderDesktopFiles();
})();
