using SkiaSharp;

namespace Muadil.Api.Goruntu;

// Parfüm görselinin tam ortasındaki rengi örnekler; Renk alanı boşsa görselden otomatik önerilir.
public static class RenkAlgilama
{
    public static string? OrtadakiRengiAl(Stream gorsel)
    {
        using var bitmap = SKBitmap.Decode(gorsel);
        if (bitmap is null) return null;

        var merkezX = bitmap.Width / 2;
        var merkezY = bitmap.Height / 2;
        var yaricap = Math.Max(1, Math.Min(bitmap.Width, bitmap.Height) / 10);

        long r = 0, g = 0, b = 0;
        var sayac = 0;

        for (var y = Math.Max(0, merkezY - yaricap); y < Math.Min(bitmap.Height, merkezY + yaricap); y++)
        for (var x = Math.Max(0, merkezX - yaricap); x < Math.Min(bitmap.Width, merkezX + yaricap); x++)
        {
            var piksel = bitmap.GetPixel(x, y);
            if (piksel.Alpha < 10) continue; // şeffaf alanları say(ma)
            r += piksel.Red;
            g += piksel.Green;
            b += piksel.Blue;
            sayac++;
        }

        if (sayac == 0) return null;
        return $"#{(byte)(r / sayac):X2}{(byte)(g / sayac):X2}{(byte)(b / sayac):X2}";
    }
}
