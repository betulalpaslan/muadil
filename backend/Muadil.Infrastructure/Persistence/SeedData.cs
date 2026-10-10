using Microsoft.EntityFrameworkCore;
using Muadil.Domain.Entities;

namespace Muadil.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task LoadAsync(MuadilDbContext db)
    {
        // Silinmişler dahil hiç parfüm varsa dokunma
        if (await db.Parfumler.IgnoreQueryFilters().AnyAsync())
            return;

        var markalar = await db.Markalar.ToDictionaryAsync(m => m.Ad, StringComparer.OrdinalIgnoreCase);
        var notalar = await db.Notalar.ToDictionaryAsync(n => n.Ad, StringComparer.OrdinalIgnoreCase);

        Marka MarkaGetir(string ad, MarkaTuru tur)
        {
            if (!markalar.TryGetValue(ad, out var marka))
            {
                marka = new Marka { Ad = ad, Tur = tur };
                db.Markalar.Add(marka);
                markalar[ad] = marka;
            }
            return marka;
        }

        Nota NotaGetir(string ad)
        {
            if (!notalar.TryGetValue(ad, out var nota))
            {
                nota = new Nota { Ad = ad };
                db.Notalar.Add(nota);
                notalar[ad] = nota;
            }
            return nota;
        }

        void ParfumEkle(
            string ad, Marka marka, decimal fiyat,
            (string Nota, NotaKatmani Katman)[] parfumNotalari,
            (Marka Marka, string Kod, decimal Fiyat, int Kalicilik, int Benzerlik)[] muadiller)
        {
            db.Parfumler.Add(new Parfum
            {
                Ad = ad,
                Marka = marka,
                Fiyat50ml = fiyat,
                Notalar = parfumNotalari
                    .Select(n => new ParfumNota { Nota = NotaGetir(n.Nota), Katman = n.Katman })
                    .ToList(),
                Muadiller = muadiller
                    .Select(m => new MuadilParfum
                    {
                        Marka = m.Marka,
                        Kod = m.Kod,
                        Fiyat = m.Fiyat,
                        KalicilikPuani = m.Kalicilik,
                        BenzerlikPuani = m.Benzerlik,
                        UrunLinki = $"https://example.com/{m.Kod.ToLower()}"
                    })
                    .ToList()
            });
        }

        var dior = MarkaGetir("Dior", MarkaTuru.Orijinal);
        var chanel = MarkaGetir("Chanel", MarkaTuru.Orijinal);
        var ysl = MarkaGetir("Yves Saint Laurent", MarkaTuru.Orijinal);
        var bargello = MarkaGetir("Bargello", MarkaTuru.Muadil);
        var mad = MarkaGetir("Mad", MarkaTuru.Muadil);
        var muscent = MarkaGetir("Muscent", MarkaTuru.Muadil);

        ParfumEkle("Sauvage", dior, 4200,
            [("Bergamot", NotaKatmani.Ust), ("Biber", NotaKatmani.Ust),
             ("Lavanta", NotaKatmani.Orta),
             ("Ambroksan", NotaKatmani.Alt), ("Sedir", NotaKatmani.Alt)],
            [(bargello, "ORNEK-1", 650, 8, 9), (mad, "ORNEK-2", 550, 7, 8), (muscent, "ORNEK-3", 600, 9, 8)]);

        ParfumEkle("Bleu de Chanel", chanel, 4500,
            [("Greyfurt", NotaKatmani.Ust), ("Bergamot", NotaKatmani.Ust),
             ("Yasemin", NotaKatmani.Orta),
             ("Sedir", NotaKatmani.Alt), ("Vetiver", NotaKatmani.Alt)],
            [(bargello, "ORNEK-4", 650, 7, 7)]);

        ParfumEkle("Black Opium", ysl, 4000,
            [("Portakal Çiçeği", NotaKatmani.Ust),
             ("Kahve", NotaKatmani.Orta), ("Yasemin", NotaKatmani.Orta),
             ("Vanilya", NotaKatmani.Alt), ("Paçuli", NotaKatmani.Alt)],
            [(mad, "ORNEK-5", 550, 8, 9)]);

        await db.SaveChangesAsync();
    }
}