namespace Muadil.Domain.Kurallar;

public static class NotaAdi
{
    // " pembe   BİBER " -> "Pembe biber"
    public static string Normalize(string ad)
    {
        var temiz = string.Join(' ', ad.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        if (temiz.Length == 0) return temiz;
        return char.ToUpper(temiz[0], Metin.Tr) + temiz[1..].ToLower(Metin.Tr);
    }
}
