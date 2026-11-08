const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const DAEMON_BIN = path.join(__dirname, 'hardwareDaemon.exe');

let daemonProcess = null;
let hardwareListeners = new Set();
let hardwareState = {
  volume: 100,
  muted: false,
  brightness: 80,
  initialized: false,
};

function startHardwareDaemon() {
  if (daemonProcess || !fs.existsSync(DAEMON_BIN)) return;

  try {
    daemonProcess = spawn(DAEMON_BIN, [], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    const rl = readline.createInterface({
      input: daemonProcess.stdout,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      if (!line || !line.trim()) return;
      try {
        const evt = JSON.parse(line.trim());
        if (evt.type === 'volume_init') {
          hardwareState.volume = evt.value;
          hardwareState.muted = Boolean(evt.muted);
          hardwareState.initialized = true;
        } else if (evt.type === 'brightness_init') {
          hardwareState.brightness = evt.value;
          hardwareState.initialized = true;
        } else if (evt.type === 'volume') {
          hardwareState.volume = evt.value;
          hardwareState.muted = Boolean(evt.muted);
          notifyListeners({
            type: 'volume',
            value: evt.value,
            muted: Boolean(evt.muted),
          });
        } else if (evt.type === 'brightness') {
          hardwareState.brightness = evt.value;
          notifyListeners({
            type: 'brightness',
            value: evt.value,
          });
        }
      } catch (_) {}
    });

    daemonProcess.on('error', (err) => {
      console.warn('[hardwareDaemon] Error:', err);
    });

    daemonProcess.on('exit', () => {
      daemonProcess = null;
      // Auto-restart with safe debounce
      setTimeout(() => {
        if (!daemonProcess) startHardwareDaemon();
      }, 2500);
    });
  } catch (err) {
    console.error('[startHardwareDaemon] Failed:', err);
  }
}

function notifyListeners(data) {
  for (const listener of hardwareListeners) {
    try {
      listener(data);
    } catch (_) {}
  }
}

function onHardwareHud(callback) {
  hardwareListeners.add(callback);
  return () => hardwareListeners.delete(callback);
}

function setVolume(level) {
  if (daemonProcess && daemonProcess.stdin && !daemonProcess.stdin.destroyed) {
    const val = Math.max(0, Math.min(100, Math.round(level)));
    daemonProcess.stdin.write(`set_volume ${val}\n`);
    hardwareState.volume = val;
    return true;
  }
  return false;
}

function setMute(muted) {
  if (daemonProcess && daemonProcess.stdin && !daemonProcess.stdin.destroyed) {
    daemonProcess.stdin.write(`set_mute ${Boolean(muted)}\n`);
    hardwareState.muted = Boolean(muted);
    return true;
  }
  return false;
}

function setBrightness(level) {
  if (daemonProcess && daemonProcess.stdin && !daemonProcess.stdin.destroyed) {
    const val = Math.max(0, Math.min(100, Math.round(level)));
    daemonProcess.stdin.write(`set_brightness ${val}\n`);
    hardwareState.brightness = val;
    return true;
  }
  return false;
}

function getHardwareState() {
  return { ...hardwareState };
}

function stopHardwareDaemon() {
  if (daemonProcess) {
    try {
      if (daemonProcess.stdin && !daemonProcess.stdin.destroyed) {
        daemonProcess.stdin.write('quit\n');
      }
      daemonProcess.kill();
    } catch (_) {}
    daemonProcess = null;
  }
}

// Start immediately on module load
startHardwareDaemon();

module.exports = {
  startHardwareDaemon,
  stopHardwareDaemon,
  onHardwareHud,
  setVolume,
  setMute,
  setBrightness,
  getHardwareState,
};
