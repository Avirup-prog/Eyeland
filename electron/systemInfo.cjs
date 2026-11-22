const { exec, execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// CPU Load Tracker
function getCpuTimes() {
  return os.cpus().map((c) => c.times);
}

let previousCpuTimes = getCpuTimes();

function getLiveCpuLoad() {
  const currentTimes = getCpuTimes();
  let idleDiff = 0;
  let totalDiff = 0;

  for (let i = 0; i < currentTimes.length; i++) {
    const t1 = previousCpuTimes[i];
    const t2 = currentTimes[i];
    for (const type in t1) {
      const diff = t2[type] - t1[type];
      totalDiff += diff;
      if (type === 'idle') idleDiff += diff;
    }
  }

  previousCpuTimes = currentTimes;
  if (totalDiff === 0) return 12;
  const load = Math.round(100 - (100 * idleDiff) / totalDiff);
  return Math.max(1, Math.min(100, load));
}

// 1. Real Wi-Fi Query via netsh (with 15s cache and on-demand network scanning)
let cachedWifiData = null;
let lastWifiFetchTime = 0;
let isWifiFetchInFlight = false;

function getWifiData(scanAvailableNetworks = false) {
  const now = Date.now();
  if (!scanAvailableNetworks && cachedWifiData && (now - lastWifiFetchTime < 15000)) {
    return Promise.resolve(cachedWifiData);
  }
  if (isWifiFetchInFlight && cachedWifiData) {
    return Promise.resolve(cachedWifiData);
  }

  isWifiFetchInFlight = true;
  return new Promise((resolve) => {
    exec('netsh wlan show interfaces', (err, stdout) => {
      isWifiFetchInFlight = false;
      if (err || !stdout) {
        const fallback = {
          connected: false,
          ssid: 'Disconnected',
          signal: 0,
          speed: '0 Mbps',
          radioType: 'Wi-Fi',
          band: '2.4 GHz',
          adapter: 'Wireless Interface',
          availableNetworks: [],
        };
        cachedWifiData = fallback;
        lastWifiFetchTime = Date.now();
        return resolve(fallback);
      }

      const lines = stdout.split(/\r?\n/);
      const getVal = (key) => {
        const line = lines.find((l) => l.trim().toLowerCase().startsWith(key.toLowerCase()));
        if (!line) return null;
        const idx = line.indexOf(':');
        return idx !== -1 ? line.substring(idx + 1).trim() : null;
      };

      const state = getVal('State');
      const isConnected = state?.toLowerCase() === 'connected';
      const ssid = getVal('SSID') || (isConnected ? 'Connected Network' : 'Disconnected');
      const signalStr = getVal('Signal') || '0%';
      const signalInt = parseInt(signalStr.replace('%', ''), 10) || 0;
      const rxRate = getVal('Receive rate (Mbps)') || '0';
      const radioType = getVal('Radio type') || '802.11ax';
      const band = getVal('Band') || '2.4 GHz';
      const desc = getVal('Description') || 'MediaTek Wi-Fi 6';

      const baseResult = {
        connected: isConnected,
        ssid: isConnected ? ssid : 'Disconnected',
        signal: signalInt,
        speed: `${rxRate} Mbps`,
        radioType: radioType.includes('802.11ax') ? 'Wi-Fi 6 (802.11ax)' : radioType,
        band,
        adapter: desc,
        availableNetworks: cachedWifiData?.availableNetworks || [{ ssid, connected: isConnected }],
      };

      // Only perform heavy radio frequency scanning if user explicitly requested network scan
      if (!scanAvailableNetworks) {
        cachedWifiData = baseResult;
        lastWifiFetchTime = Date.now();
        return resolve(baseResult);
      }

      exec('netsh wlan show networks', (netErr, netStdout) => {
        const available = [];
        if (!netErr && netStdout) {
          const matches = [...netStdout.matchAll(/SSID\s+\d+\s+:\s+(.+)/g)];
          matches.forEach((m) => {
            const name = m[1]?.trim();
            if (name && !available.some((a) => a.ssid === name)) {
              available.push({
                ssid: name,
                connected: name === ssid,
                secure: true,
              });
            }
          });
        }

        baseResult.availableNetworks = available.length > 0 ? available : [{ ssid, connected: isConnected }];
        cachedWifiData = baseResult;
        lastWifiFetchTime = Date.now();
        resolve(baseResult);
      });
    });
  });
}

// 2. Real Bluetooth Query via PowerShell (Cached for 30s or invalidated on WM_DEVICECHANGE)
let cachedBluetoothData = null;
let lastBluetoothFetchTime = 0;
let isBluetoothFetchInFlight = false;

function invalidateBluetoothCache() {
  lastBluetoothFetchTime = 0;
}

function getBluetoothData(force = false) {
  const now = Date.now();
  if (!force && cachedBluetoothData && (now - lastBluetoothFetchTime < 30000)) {
    return Promise.resolve(cachedBluetoothData);
  }
  if (isBluetoothFetchInFlight && cachedBluetoothData) {
    return Promise.resolve(cachedBluetoothData);
  }

  isBluetoothFetchInFlight = true;
  return new Promise((resolve) => {
    const ps = `
      $bt = Get-PnpDevice -Class Bluetooth -Status OK -PresentOnly |
        Where-Object { $_.FriendlyName -and $_.InstanceId -match 'DEV_' } |
        ForEach-Object {
          $prop = Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName '{83da6326-97a6-4088-9453-a1923f573b29} 15' -ErrorAction SilentlyContinue
          $isConn = ($prop -and $prop.Data -eq $true)
          if ($isConn) {
            [PSCustomObject]@{
              FriendlyName = $_.FriendlyName
              Status = $_.Status
              Connected = $true
            }
          }
        }
      if ($bt) { @($bt) | ConvertTo-Json -Compress } else { '[]' }
    `;
    const encoded = Buffer.from(ps, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -EncodedCommand ${encoded}`, { timeout: 8000 }, (err, stdout) => {
      isBluetoothFetchInFlight = false;
      let adapterPresent = true;
      const devices = [];

      if (!err && stdout) {
        try {
          const list = JSON.parse(stdout.trim());
          const arr = Array.isArray(list) ? list : [list];

          for (const item of arr) {
            const name = item.FriendlyName || '';
            if (/Adapter/i.test(name)) {
              adapterPresent = true;
            }
            if (!/Enumerator|RFCOMM|Adapter|Avrcp/i.test(name) && name.trim()) {
              let type = 'bluetooth';
              if (/buds|airpod|headphone|wh-|ear|audio/i.test(name)) type = 'headphones';
              else if (/keyboard|k2|k3/i.test(name)) type = 'keyboard';
              else if (/mouse|mx/i.test(name)) type = 'mouse';
              else if (/gamepad|dualsense|controller/i.test(name)) type = 'gamepad';

              const cleanName = name.replace(/tr.ke/i, 'trüke').trim();
              if (!devices.some((d) => d.name === cleanName)) {
                devices.push({
                  id: devices.length + 1,
                  name: cleanName,
                  type,
                  connected: item.Connected === true,
                  status: item.Status || 'Connected',
                });
              }
            }
          }
        } catch {
          // Fallback if parsing error
        }
      }

      const result = {
        enabled: adapterPresent,
        adapter: 'MediaTek Bluetooth Adapter',
        devices: devices.length > 0 ? devices : (cachedBluetoothData?.devices || [
          { id: 1, name: 'WH-CH520', type: 'headphones', connected: false },
          { id: 2, name: 'Airdopes 311 Pro', type: 'headphones', connected: false },
        ]),
      };
      cachedBluetoothData = result;
      lastBluetoothFetchTime = Date.now();
      resolve(result);
    });
  });
}

// 3. Real Battery Query (Cached for 30s)
let cachedBatteryData = null;
let lastBatteryFetchTime = 0;
let isBatteryFetchInFlight = false;

function getBatteryData(force = false) {
  const now = Date.now();
  if (!force && cachedBatteryData && (now - lastBatteryFetchTime < 30000)) {
    return Promise.resolve(cachedBatteryData);
  }
  if (isBatteryFetchInFlight && cachedBatteryData) {
    return Promise.resolve(cachedBatteryData);
  }

  isBatteryFetchInFlight = true;
  return new Promise((resolve) => {
    const ps = 'Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json';
    const encoded = Buffer.from(ps, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -EncodedCommand ${encoded}`, { timeout: 4000 }, (err, stdout) => {
      isBatteryFetchInFlight = false;
      let percent = cachedBatteryData?.percent ?? 100;
      let isCharging = cachedBatteryData?.isCharging ?? true;
      let statusText = cachedBatteryData?.statusText ?? 'AC Powered';

      if (!err && stdout) {
        try {
          const raw = JSON.parse(stdout.trim());
          const bat = Array.isArray(raw) ? raw[0] : raw;
          if (bat) {
            percent = typeof bat.EstimatedChargeRemaining === 'number' ? bat.EstimatedChargeRemaining : 100;
            const s = bat.BatteryStatus;
            if (s === 1) {
              isCharging = false;
              statusText = 'On Battery';
            } else if (s === 6 || s === 7 || s === 8 || s === 9) {
              isCharging = true;
              statusText = percent >= 98 ? 'Fully Charged (AC)' : 'Fast Charging';
            } else if (s === 2 || s === 3) {
              isCharging = true;
              statusText = percent === 100 ? 'Fully Charged (AC)' : 'AC Powered';
            } else {
              isCharging = true;
              statusText = 'AC Powered';
            }
          }
        } catch {
          // default fallback
        }
      }

      const result = {
        percent,
        isCharging,
        statusText,
      };
      cachedBatteryData = result;
      lastBatteryFetchTime = Date.now();
      resolve(result);
    });
  });
}

const MIC_CHECK_BIN = (function() {
  const normalPath = path.join(__dirname, 'micCheck.exe');
  const unpackedPath = normalPath.replace('app.asar', 'app.asar.unpacked');
  if (fs.existsSync(unpackedPath)) return unpackedPath;
  return normalPath;
})();

function checkMicViaCoreAudio() {
  return new Promise((resolve) => {
    if (!fs.existsSync(MIC_CHECK_BIN)) {
      return resolve({ micInUse: false, apps: [] });
    }
    exec(`"${MIC_CHECK_BIN}"`, { timeout: 1500 }, (err, stdout) => {
      if (err || !stdout) return resolve({ micInUse: false, apps: [] });
      try {
        const data = JSON.parse(stdout.trim());
        resolve({
          micInUse: Boolean(data.micInUse),
          apps: Array.isArray(data.apps) ? data.apps : [],
        });
      } catch (_) {
        resolve({ micInUse: false, apps: [] });
      }
    });
  });
}

// 3.5. Real-Time Camera and Microphone Usage via Windows Registry & WASAPI (Zero-tasklist, Non-blocking)
let cachedPrivacyData = null;
let lastPrivacyFetchTime = 0;
let isPrivacyFetchInFlight = false;

function checkDeviceConsentStore(device) {
  return new Promise((resolve) => {
    exec(`reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\${device}" /s`, { timeout: 1500 }, (err, out) => {
      if (err || !out) return resolve(false);
      const blocks = out.split('\r\n\r\n');
      for (const block of blocks) {
        if (/LastUsedTimeStop\s+REG_QWORD\s+0x0(\r?\n|$)/i.test(block)) {
          const lines = block.split('\r\n');
          const keyLine = lines[0] || '';
          if (keyLine.includes('\\NonPackaged\\')) {
            const encodedPath = keyLine.split('\\NonPackaged\\')[1];
            if (encodedPath) {
              const rawPath = encodedPath.trim().replace(/#/g, '\\');
              if (fs.existsSync(rawPath)) {
                return resolve(true);
              }
            }
          } else {
            // Packaged UWP App: e.g. Microsoft.WindowsCamera...
            const pkgName = keyLine.split('\\').pop()?.trim();
            if (pkgName && pkgName.toLowerCase() !== device) {
              return resolve(true);
            }
          }
        }
      }
      resolve(false);
    });
  });
}

async function getCameraAndMicUsage() {
  const now = Date.now();
  if (cachedPrivacyData && (now - lastPrivacyFetchTime < 1200)) {
    return cachedPrivacyData;
  }
  if (isPrivacyFetchInFlight && cachedPrivacyData) {
    return cachedPrivacyData;
  }

  isPrivacyFetchInFlight = true;
  try {
    const [wasapiMic, consentMic, camInUse] = await Promise.all([
      checkMicViaCoreAudio(),
      checkDeviceConsentStore('microphone'),
      checkDeviceConsentStore('webcam'),
    ]);
    const result = {
      micInUse: wasapiMic.micInUse || consentMic,
      apps: wasapiMic.apps || [],
      camInUse,
    };
    cachedPrivacyData = result;
    lastPrivacyFetchTime = Date.now();
    return result;
  } catch (_) {
    return cachedPrivacyData || { micInUse: false, apps: [], camInUse: false };
  } finally {
    isPrivacyFetchInFlight = false;
  }
}

// 4. Full Real-Time System Telemetry
async function getFullTelemetry() {
  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model?.replace(/\s+/g, ' ').trim() || 'Multi-Core Processor';
  const cpuCores = cpus.length;
  const cpuLoad = getLiveCpuLoad();

  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;

  const totalMemGb = (totalMemBytes / 1024 ** 3).toFixed(1);
  const usedMemGb = (usedMemBytes / 1024 ** 3).toFixed(1);
  const freeMemGb = (freeMemBytes / 1024 ** 3).toFixed(1);
  const memPercent = Math.round((usedMemBytes / totalMemBytes) * 100);

  const uptimeSec = os.uptime();
  const uptimeHours = Math.floor(uptimeSec / 3600);
  const uptimeMins = Math.floor((uptimeSec % 3600) / 60);

  const [wifi, bluetooth, battery, privacy] = await Promise.all([
    getWifiData(),
    getBluetoothData(),
    getBatteryData(),
    getCameraAndMicUsage(),
  ]);

  return {
    cpu: {
      model: cpuModel,
      cores: cpuCores,
      loadPercent: cpuLoad,
    },
    memory: {
      totalGb: totalMemGb,
      usedGb: usedMemGb,
      freeGb: freeMemGb,
      percent: memPercent,
    },
    battery,
    wifi,
    bluetooth,
    privacy,
    system: {
      uptimeHours,
      uptimeMins,
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
    },
  };
}

module.exports = {
  getWifiData,
  getBluetoothData,
  getBatteryData,
  getCameraAndMicUsage,
  getFullTelemetry,
  invalidateBluetoothCache,
};
