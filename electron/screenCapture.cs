using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

class ScreenShot {
    [DllImport("user32.dll")]
    static extern bool SetProcessDPIAware();

    static int Main(string[] args) {
        try {
            try { SetProcessDPIAware(); } catch {}
            int x = int.Parse(args[0]);
            int y = int.Parse(args[1]);
            int w = int.Parse(args[2]);
            int h = int.Parse(args[3]);
            string outPath = args[4];

            if (w <= 0 || h <= 0) return 1;

            using (Bitmap bmp = new Bitmap(w, h)) {
                using (Graphics g = Graphics.FromImage(bmp)) {
                    g.CopyFromScreen(x, y, 0, 0, new Size(w, h), CopyPixelOperation.SourceCopy);
                }
                bmp.Save(outPath, ImageFormat.Png);
            }
            return 0;
        } catch (Exception ex) {
            Console.Error.WriteLine(ex.ToString());
            return 1;
        }
    }
}
