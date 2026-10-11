using Muadil.Domain.Entities;

namespace Muadil.Domain.Kurallar;

public static class CinsiyetAdi
{
    // Boş metin Unisex sayılır; aksi "Kadın"/"Erkek"/"Unisex" olmalı (büyük/küçük harf duyarsız)
    public static bool TryAyristir(string? metin, out Cinsiyet cinsiyet)
    {
        cinsiyet = Cinsiyet.Unisex;
        var normal = (metin ?? "").Trim();
        if (normal == "") return true;

        var kucuk = normal.ToLower(Metin.Tr);
        if (kucuk is "kadın" or "kadin") { cinsiyet = Cinsiyet.Kadin; return true; }
        if (kucuk is "erkek") { cinsiyet = Cinsiyet.Erkek; return true; }
        if (kucuk is "unisex") { cinsiyet = Cinsiyet.Unisex; return true; }
        return false;
    }
}
