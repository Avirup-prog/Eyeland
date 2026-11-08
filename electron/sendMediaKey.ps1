param([string]$Action)

$code = @"
using System;
using System.Runtime.InteropServices;
using System.Diagnostics;

public class WinMediaController {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = false)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    private const uint WM_APPCOMMAND = 0x0319;
    private const long APPCOMMAND_MEDIA_PLAY_PAUSE = 14 * 65536;
    private const long APPCOMMAND_MEDIA_NEXTTRACK = 11 * 65536;
    private const long APPCOMMAND_MEDIA_PREVIOUSTRACK = 12 * 65536;
    private const long APPCOMMAND_VOLUME_MUTE = 8 * 65536;
    private const long APPCOMMAND_VOLUME_DOWN = 9 * 65536;
    private const long APPCOMMAND_VOLUME_UP = 10 * 65536;

    public static void SendAction(string action) {
        bool sentDirectly = false;
        try {
            Process[] spotProcs = Process.GetProcessesByName("Spotify");
            foreach (Process p in spotProcs) {
                if (p.MainWindowHandle != IntPtr.Zero && !string.IsNullOrEmpty(p.MainWindowTitle)) {
                    long cmd = 0;
                    if (action == "play-pause") cmd = APPCOMMAND_MEDIA_PLAY_PAUSE;
                    else if (action == "next") cmd = APPCOMMAND_MEDIA_NEXTTRACK;
                    else if (action == "prev") cmd = APPCOMMAND_MEDIA_PREVIOUSTRACK;
                    else if (action == "vol-up") cmd = APPCOMMAND_VOLUME_UP;
                    else if (action == "vol-down") cmd = APPCOMMAND_VOLUME_DOWN;
                    else if (action == "mute") cmd = APPCOMMAND_VOLUME_MUTE;

                    if (cmd != 0) {
                        SendMessage(p.MainWindowHandle, WM_APPCOMMAND, IntPtr.Zero, (IntPtr)cmd);
                        sentDirectly = true;
                    }
                }
            }
        } catch {}

        if (!sentDirectly) {
            byte vk = 0;
            if (action == "play-pause") vk = 0xB3;
            else if (action == "next") vk = 0xB0;
            else if (action == "prev") vk = 0xB1;
            else if (action == "vol-up") vk = 0xAF;
            else if (action == "vol-down") vk = 0xAE;
            else if (action == "mute") vk = 0xAD;

            if (vk != 0) {
                keybd_event(vk, 0, 0, UIntPtr.Zero);
                keybd_event(vk, 0, 2, UIntPtr.Zero);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $code
[WinMediaController]::SendAction($Action.ToLower())
Write-Output "OK"
