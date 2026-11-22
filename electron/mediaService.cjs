const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

function resolveScript(name) {
  const normalPath = path.join(__dirname, name);
  const unpackedPath = normalPath.replace('app.asar', 'app.asar.unpacked');
  if (fs.existsSync(unpackedPath)) return unpackedPath;
  return normalPath;
}

const getMediaScriptPath = resolveScript('getMedia.ps1');
const mediaDaemonScriptPath = resolveScript('mediaDaemon.ps1');
const sendMediaScriptPath = resolveScript('sendMediaKey.ps1');

const { hasDevanagari, devanagariToHinglish } = require('./hindiRomanizer.cjs');

// Cache to prevent redundant artwork fetches
const artworkCache = new Map();
// Cache to prevent redundant lyrics fetches
const lyricsCache = new Map();

function parseLrc(lrcStr) {
  if (!lrcStr) return [];
  const lines = lrcStr.split('\n');
  const result = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)$/);
    if (match) {
      const time = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
      let text = match[3].trim();
      if (text) {
        if (hasDevanagari(text)) {
          text = devanagariToHinglish(text);
        }
        result.push({ time, text });
      }
    }
  }
  return result;
}

/**
 * Fetch synchronized timestamped lyrics from LRCLIB
 * Prioritizes native Roman/English script like Spotify (e.g. Rakhlo Tum Chupake)
 * Falls back to high-fidelity Romanized transliteration if only Devanagari exists (e.g. Nazar Lagi)
 */
async function getSongLyrics(artist, title) {
  if (!title || !artist) return [];
  const cacheKey = `${artist} - ${title}`.toLowerCase().trim();
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey);
  }

  const cleanTitle = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/- .*$/, '')
    .trim();

  // Primary artist name (handle multiple artists separated by commas or ampersands)
  const cleanArtist = artist
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
  const primaryArtist = cleanArtist.split(/[,&]/)[0].trim();

  const searchQueries = [
    { track: cleanTitle, artist: cleanArtist },
    { track: cleanTitle, artist: primaryArtist },
    { track: cleanTitle, artist: '' },
  ];

  for (const q of searchQueries) {
    try {
      const artistParam = q.artist ? `&artist_name=${encodeURIComponent(q.artist)}` : '';
      const sUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(q.track)}${artistParam}`;
      const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'Eyeland-Dynamic-Island/1.0' } });
      if (sRes.ok) {
        const arr = await sRes.json();
        if (Array.isArray(arr) && arr.length > 0) {
          // A. Look for an already-Romanized English script version (Latin letters, no Devanagari)
          const romanMatch = arr.find(
            (x) => x.syncedLyrics && /[a-zA-Z]/.test(x.syncedLyrics) && !hasDevanagari(x.syncedLyrics)
          );
          if (romanMatch) {
            const parsed = parseLrc(romanMatch.syncedLyrics);
            if (parsed.length > 0) {
              lyricsCache.set(cacheKey, parsed);
              return parsed;
            }
          }

          // B. Any synced version (Devanagari will be transliterated to Hinglish by parseLrc)
          const anySynced = arr.find((x) => x.syncedLyrics);
          if (anySynced) {
            const parsed = parseLrc(anySynced.syncedLyrics);
            if (parsed.length > 0) {
              lyricsCache.set(cacheKey, parsed);
              return parsed;
            }
          }
        }
      }
    } catch (err) {}
  }

  // Direct LRCLIB get fallback
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(primaryArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Eyeland-Dynamic-Island/1.0' } });
    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        const parsed = parseLrc(data.syncedLyrics);
        if (parsed.length > 0) {
          lyricsCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    }
  } catch (err) {}

  lyricsCache.set(cacheKey, []);
  return [];
}

/**
 * Search track metadata (high-res 600x600 album artwork, duration, preview audio)
 */
async function searchTrackMetadata(query) {
  if (!query || query.trim().length === 0) return null;
  const cacheKey = query.trim().toLowerCase();
  if (artworkCache.has(cacheKey)) {
    return artworkCache.get(cacheKey);
  }

  // 1. Direct query
  let result = await fetchItunesTrack(query);

  // 2. If direct query failed, clean extra fluff (feat, remaster, parentheses)
  if (!result) {
    const cleaned = query
      .replace(/\(feat\..*?\)/gi, '')
      .replace(/\(with.*?\)/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/- .*?(remaster|live|deluxe|version|edition).*$/gi, '')
      .replace(/[\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned && cleaned !== query) {
      result = await fetchItunesTrack(cleaned);
    }
  }

  if (result) {
    artworkCache.set(cacheKey, result);
    return result;
  }

  // Fallback placeholder with deterministic vibrant gradient
  const fallbackHue = Math.abs(query.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360;
  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="hsl(${fallbackHue},85%,45%)"/><stop offset="100%" stop-color="hsl(${(fallbackHue + 60) % 360},85%,25%)"/></linearGradient></defs><rect width="600" height="600" rx="40" fill="url(%23g)"/><text x="50%" y="46%" font-size="80" text-anchor="middle" fill="%23ffffff" font-family="sans-serif">🎵</text><text x="50%" y="60%" font-size="28" text-anchor="middle" fill="%23ffffff" opacity="0.9" font-family="sans-serif" font-weight="bold">SPOTIFY LIVE</text></svg>`;

  const fallback = {
    title: query,
    artist: 'Spotify Artist',
    album: 'Spotify Media',
    artwork: fallbackSvg,
    duration: 210,
    previewUrl: null,
    genre: 'Pop',
  };
  artworkCache.set(cacheKey, fallback);
  return fallback;
}

async function fetchItunesTrack(searchTerm) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const t = data.results[0];
      return {
        title: t.trackName,
        artist: t.artistName,
        album: t.collectionName,
        artwork: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '600x600bb') : null,
        duration: Math.round(t.trackTimeMillis / 1000),
        previewUrl: t.previewUrl || null,
        genre: t.primaryGenreName || 'Pop',
      };
    }
  } catch (err) {}
  return null;
}

// State for live media daemon
let daemonProcess = null;
let currentMediaState = { isPlaying: false, status: 'no_session', isNativeSpotify: false };
let currentTrackKey = '';
let mediaListeners = new Set();

/**
 * Start persistent media monitoring daemon for sub-20ms latency
 */
function startMediaDaemon() {
  if (daemonProcess) return;

  try {
    daemonProcess = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', mediaDaemonScriptPath
    ], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const rl = readline.createInterface({
      input: daemonProcess.stdout,
      crlfDelay: Infinity
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('{')) return;

      try {
        const raw = JSON.parse(trimmed);
        if (raw.title && raw.artist) {
          const trackKey = `${raw.artist} - ${raw.title}`.toLowerCase().trim();
          const trackChanged = trackKey !== currentTrackKey;

          if (trackChanged) {
            currentTrackKey = trackKey;
            // Kick off background fetch for high-res artwork & lyrics
            searchTrackMetadata(`${raw.artist} ${raw.title}`).then((meta) => {
              if (currentMediaState && currentMediaState.title === raw.title) {
                currentMediaState.artwork = meta?.artwork || currentMediaState.artwork;
                currentMediaState.album = meta?.album || currentMediaState.album;
                notifyMediaListeners();
              }
            });

            getSongLyrics(raw.artist, raw.title).then((lyrics) => {
              if (currentMediaState && currentMediaState.title === raw.title) {
                currentMediaState.lyrics = lyrics || [];
                notifyMediaListeners();
              }
            });
          }

          const cachedMeta = artworkCache.get(`${raw.artist} ${raw.title}`.trim().toLowerCase());
          const cachedLyrics = lyricsCache.get(trackKey);

          currentMediaState = {
            isPlaying: Boolean(raw.isPlaying),
            title: raw.title,
            artist: raw.artist,
            album: raw.album || cachedMeta?.album || 'Spotify Music',
            source: raw.source || 'Spotify',
            isNativeSpotify: Boolean(raw.isNativeSpotify),
            artwork: cachedMeta?.artwork || currentMediaState.artwork || null,
            duration: (typeof raw.duration === 'number' && raw.duration > 0) ? raw.duration : (cachedMeta?.duration || 210),
            position: typeof raw.position === 'number' ? raw.position : 0,
            previewUrl: cachedMeta?.previewUrl || null,
            lyrics: cachedLyrics || currentMediaState.lyrics || [],
          };

          notifyMediaListeners();
        } else if (raw.status === 'no_session') {
          if (currentMediaState.status !== 'no_session' || currentMediaState.isPlaying) {
            currentMediaState = { isPlaying: false, status: 'no_session', isNativeSpotify: false };
            currentTrackKey = '';
            notifyMediaListeners();
          }
        }
      } catch (err) {}
    });

    daemonProcess.stderr.on('data', () => {});

    daemonProcess.on('exit', () => {
      daemonProcess = null;
      // Auto-restart after 2s if process exits
      setTimeout(startMediaDaemon, 2000);
    });
  } catch (err) {
    console.error('Failed to spawn media daemon:', err);
  }
}

function notifyMediaListeners() {
  for (const listener of mediaListeners) {
    try {
      listener(currentMediaState);
    } catch (e) {}
  }
}

function onMediaChange(callback) {
  mediaListeners.add(callback);
  if (currentMediaState) {
    callback(currentMediaState);
  }
  return () => mediaListeners.delete(callback);
}

/**
 * Fallback one-shot media check
 */
function getLiveMedia() {
  if (currentMediaState && currentMediaState.title) {
    return Promise.resolve(currentMediaState);
  }
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${getMediaScriptPath}"`;
    exec(cmd, async (err, stdout) => {
      if (err || !stdout) {
        return resolve({ isPlaying: false, status: 'no_session', isNativeSpotify: false });
      }

      try {
        const raw = JSON.parse(stdout.trim());
        if (raw.title && raw.artist) {
          const meta = await searchTrackMetadata(`${raw.artist} ${raw.title}`);
          const lyrics = await getSongLyrics(raw.artist, raw.title);

          return resolve({
            isPlaying: Boolean(raw.isPlaying),
            title: raw.title,
            artist: raw.artist,
            album: raw.album || meta?.album || 'Spotify Music',
            source: raw.source || 'Spotify',
            isNativeSpotify: Boolean(raw.isNativeSpotify),
            artwork: meta?.artwork || null,
            duration: (typeof raw.duration === 'number' && raw.duration > 0) ? raw.duration : (meta?.duration || 210),
            position: typeof raw.position === 'number' ? raw.position : 0,
            previewUrl: meta?.previewUrl || null,
            lyrics: lyrics || [],
          });
        }
        return resolve({ isPlaying: false, status: 'no_session', isNativeSpotify: false });
      } catch (parseErr) {
        return resolve({ isPlaying: false, status: 'no_session', isNativeSpotify: false });
      }
    });
  });
}

/**
 * Send Windows hardware media key (play-pause, next, prev)
 */
function sendMediaControl(action) {
  return new Promise((resolve) => {
    const validActions = ['play-pause', 'next', 'prev', 'vol-up', 'vol-down', 'mute'];
    if (!validActions.includes(action)) {
      return resolve({ success: false, error: 'Invalid action' });
    }
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${sendMediaScriptPath}" -Action ${action}`;
    exec(cmd, (err) => {
      resolve({ success: !err });
    });
  });
}

function stopMediaDaemon() {
  if (daemonProcess) {
    try {
      daemonProcess.kill();
    } catch (e) {}
    daemonProcess = null;
  }
}

// Start persistent daemon immediately on module load
startMediaDaemon();

module.exports = {
  getLiveMedia,
  onMediaChange,
  sendMediaControl,
  searchTrackMetadata,
  getSongLyrics,
  stopMediaDaemon,
};
