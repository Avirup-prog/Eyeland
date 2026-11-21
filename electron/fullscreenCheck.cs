using System;
using System.Runtime.InteropServices;
using System.Text;

class FullscreenCheck {
    [StructLayout(LayoutKind.Sequential)]
    struct RECT {
        public int Left, Top, Right, Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct MONITORINFO {
        public int cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;
    }

    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);

    [DllImport("user32.dll")]
    static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("shell32.dll")]
    static extern int SHQueryUserNotificationState(out int pquns);

    const uint MONITOR_DEFAULTTOPRIMARY = 1;
    const uint MONITORINFOF_PRIMARY = 1;
    const int GWL_STYLE = -16;
    const int WS_CAPTION = 0x00C00000;
    const int WS_THICKFRAME = 0x00040000;

    static void Main(string[] args) {
        uint ignorePid = 0;
        if (args.Length > 0) {
            uint.TryParse(args[0], out ignorePid);
        }

        // 1. Official Windows notification state (3 = Exclusive D3D Fullscreen Game, 4 = Presentation Mode)
        try {
            int state = 0;
            if (SHQueryUserNotificationState(out state) == 0) {
                if (state == 3 || state == 4) {
                    Console.Write("1");
                    return;
                }
            }
        } catch {}

        // 2. Foreground window fullscreen check on primary monitor (catches borderless games, YouTube/Netflix/VLC fullscreen)
        try {
            IntPtr fg = GetForegroundWindow();
            if (fg == IntPtr.Zero || !IsWindowVisible(fg)) {
                Console.Write("0");
                return;
            }

            uint fgPid = 0;
            GetWindowThreadProcessId(fg, out fgPid);
            if (ignorePid != 0 && fgPid == ignorePid) {
                Console.Write("0");
                return;
            }

            StringBuilder cls = new StringBuilder(256);
            GetClassName(fg, cls, cls.Capacity);
            string className = cls.ToString();
            if (className == "Progman" ||
                className == "WorkerW" ||
                className == "Shell_TrayWnd" ||
                className == "Shell_SecondaryTrayWnd" ||
                className == "Windows.UI.Core.CoreWindow") {
                Console.Write("0");
                return;
            }

            RECT winRect;
            if (!GetWindowRect(fg, out winRect)) {
                Console.Write("0");
                return;
            }

            IntPtr mon = MonitorFromWindow(fg, MONITOR_DEFAULTTOPRIMARY);
            MONITORINFO mi = new MONITORINFO();
            mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
            if (!GetMonitorInfo(mon, ref mi)) {
                Console.Write("0");
                return;
            }

            // Only hide Eyeland if fullscreen app covers the primary monitor (where Eyeland lives)
            if ((mi.dwFlags & MONITORINFOF_PRIMARY) == 0) {
                Console.Write("0");
                return;
            }

            bool coversFullMonitor =
                winRect.Left <= mi.rcMonitor.Left &&
                winRect.Top <= mi.rcMonitor.Top &&
                winRect.Right >= mi.rcMonitor.Right &&
                winRect.Bottom >= mi.rcMonitor.Bottom;

            if (!coversFullMonitor) {
                Console.Write("0");
                return;
            }

            // Distinguish real fullscreen from normal maximized windows (even if taskbar auto-hides)
            bool taskbarTakesSpace =
                (mi.rcWork.Bottom < mi.rcMonitor.Bottom) ||
                (mi.rcWork.Top > mi.rcMonitor.Top) ||
                (mi.rcWork.Left > mi.rcMonitor.Left) ||
                (mi.rcWork.Right < mi.rcMonitor.Right);

            int style = GetWindowLong(fg, GWL_STYLE);
            bool isBorderless = (style & WS_CAPTION) != WS_CAPTION || (style & WS_THICKFRAME) == 0;

            Console.Write((taskbarTakesSpace || isBorderless) ? "1" : "0");
        } catch {
            Console.Write("0");
        }
    }
}
