using System;
using System.IO;
using System.Management;
using System.Runtime.InteropServices;
using System.Threading;

namespace EyelandHardware {
    [Guid("657804FA-D6AD-4496-8A60-352752AF4F89")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolumeCallback {
        [PreserveSig]
        int OnNotify(IntPtr pNotify);
    }

    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int RegisterControlChangeNotify(IAudioEndpointVolumeCallback pNotify);
        int UnregisterControlChangeNotify(IAudioEndpointVolumeCallback pNotify);
        int GetChannelCount(out uint pnChannelCount);
        int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
        int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        int GetMasterVolumeLevel(out float pfLevelDB);
        int GetMasterVolumeLevelScalar(out float pfLevel);
        int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
        int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, ref Guid pguidEventContext);
        int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
        int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
        int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid id, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object aev);
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr ppDevices);
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
    }

    [ComImport]
    [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDeviceEnumeratorComObject { }

    [StructLayout(LayoutKind.Sequential)]
    public struct AUDIO_VOLUME_NOTIFICATION_DATA {
        public Guid guidEventContext;
        public bool bMuted;
        public float fMasterVolume;
        public uint nChannels;
    }

    public class VolumeCallback : IAudioEndpointVolumeCallback {
        public Action<int, bool> OnChange;

        public int OnNotify(IntPtr pNotify) {
            try {
                if (pNotify != IntPtr.Zero) {
                    var data = (AUDIO_VOLUME_NOTIFICATION_DATA)Marshal.PtrToStructure(pNotify, typeof(AUDIO_VOLUME_NOTIFICATION_DATA));
                    int vol = (int)Math.Round(data.fMasterVolume * 100);
                    if (OnChange != null) {
                        OnChange(vol, data.bMuted);
                    }
                }
            } catch { }
            return 0;
        }
    }

    class Program {
        private static IAudioEndpointVolume _aev;
        private static VolumeCallback _callback;
        private static int _lastBrightness = -1;
        private static int _lastVolume = -1;
        private static bool _lastMuted = false;
        private static readonly object _syncLock = new object();

        static void InitAudio() {
            try {
                var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObject();
                IMMDevice dev = null;
                enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
                if (dev != null) {
                    var iid = typeof(IAudioEndpointVolume).GUID;
                    object aevObj = null;
                    dev.Activate(ref iid, 23, IntPtr.Zero, out aevObj);
                    _aev = (IAudioEndpointVolume)aevObj;

                    if (_aev != null) {
                        float v = 0;
                        bool m = false;
                        _aev.GetMasterVolumeLevelScalar(out v);
                        _aev.GetMute(out m);
                        _lastVolume = (int)Math.Round(v * 100);
                        _lastMuted = m;

                        _callback = new VolumeCallback();
                        _callback.OnChange = (vol, muted) => {
                            bool changed = false;
                            lock (_syncLock) {
                                if (vol != _lastVolume || muted != _lastMuted) {
                                    _lastVolume = vol;
                                    _lastMuted = muted;
                                    changed = true;
                                }
                            }
                            if (changed) {
                                Emit("{\"type\":\"volume\",\"value\":" + vol + ",\"muted\":" + (muted ? "true" : "false") + "}");
                            }
                        };
                        _aev.RegisterControlChangeNotify(_callback);
                        Emit("{\"type\":\"volume_init\",\"value\":" + _lastVolume + ",\"muted\":" + (_lastMuted ? "true" : "false") + "}");
                    }
                }
            } catch (Exception ex) {
                Emit("{\"type\":\"error\",\"module\":\"audio\",\"message\":\"" + ex.Message.Replace("\"", "'") + "\"}");
            }
        }

        static void SetVolume(int vol) {
            try {
                if (_aev != null) {
                    vol = Math.Max(0, Math.Min(100, vol));
                    float scalar = vol / 100f;
                    Guid g = Guid.Empty;
                    _aev.SetMasterVolumeLevelScalar(scalar, ref g);
                }
            } catch { }
        }

        static void SetMute(bool mute) {
            try {
                if (_aev != null) {
                    Guid g = Guid.Empty;
                    _aev.SetMute(mute, ref g);
                }
            } catch { }
        }

        static void SetBrightness(int target) {
            try {
                target = Math.Max(0, Math.Min(100, target));
                using (var mclass = new ManagementClass(@"root\WMI", "WmiMonitorBrightnessMethods", null)) {
                    using (var instances = mclass.GetInstances()) {
                        foreach (ManagementObject inst in instances) {
                            inst.InvokeMethod("WmiSetBrightness", new object[] { (uint)1, (byte)target });
                            break;
                        }
                    }
                }
            } catch { }
        }

        static void Main(string[] args) {
            Console.OutputEncoding = System.Text.Encoding.UTF8;

            // 1. Audio Setup
            InitAudio();

            // 2. Brightness Monitoring Thread
            var brightnessThread = new Thread(() => {
                while (true) {
                    try {
                        using (var searcher = new ManagementObjectSearcher(@"root\WMI", "SELECT CurrentBrightness FROM WmiMonitorBrightness")) {
                            foreach (ManagementObject obj in searcher.Get()) {
                                int cur = Convert.ToInt32(obj["CurrentBrightness"]);
                                bool changed = false;
                                lock (_syncLock) {
                                    if (_lastBrightness == -1) {
                                        _lastBrightness = cur;
                                        Emit("{\"type\":\"brightness_init\",\"value\":" + cur + "}");
                                    } else if (cur != _lastBrightness) {
                                        _lastBrightness = cur;
                                        changed = true;
                                    }
                                }
                                if (changed) {
                                    Emit("{\"type\":\"brightness\",\"value\":" + cur + "}");
                                }
                                break;
                            }
                        }
                    } catch { }
                    Thread.Sleep(200);
                }
            });
            brightnessThread.IsBackground = true;
            brightnessThread.Start();

            // 3. Stdin Command Listener
            try {
                string line;
                while ((line = Console.ReadLine()) != null) {
                    line = line.Trim();
                    if (string.IsNullOrEmpty(line)) continue;
                    if (line.Equals("quit", StringComparison.OrdinalIgnoreCase)) break;

                    if (line.StartsWith("set_volume ", StringComparison.OrdinalIgnoreCase)) {
                        int v;
                        if (int.TryParse(line.Substring(11).Trim(), out v)) {
                            SetVolume(v);
                        }
                    } else if (line.StartsWith("set_mute ", StringComparison.OrdinalIgnoreCase)) {
                        bool m;
                        if (bool.TryParse(line.Substring(9).Trim(), out m)) {
                            SetMute(m);
                        }
                    } else if (line.StartsWith("set_brightness ", StringComparison.OrdinalIgnoreCase)) {
                        int b;
                        if (int.TryParse(line.Substring(15).Trim(), out b)) {
                            SetBrightness(b);
                        }
                    }
                }
            } catch { }

            // Cleanup
            if (_aev != null && _callback != null) {
                try { _aev.UnregisterControlChangeNotify(_callback); } catch { }
            }
        }

        private static void Emit(string json) {
            try {
                Console.WriteLine(json);
            } catch { }
        }
    }
}
