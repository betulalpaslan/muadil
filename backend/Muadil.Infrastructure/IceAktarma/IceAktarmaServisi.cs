using Microsoft.EntityFrameworkCore;
using Muadil.Domain.Entities;
using Muadil.Domain.Kurallar;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Infrastructure.IceAktarma;

// Satırları veritabanına uygular: marka ve notayı bul ya da oluştur, parfüm ve muadili ekle ya da güncelle.
// Excel yüklemesi bugün, MCP araçları ileride bu servisi kullanır.
public class IceAktarmaServisi(MuadilDbContext db)
{
    public async Task<IceAktarmaSonucu> UygulaAsync(
        IReadOnlyList<ParfumSatiri> parfumSatirlari,
        IReadOnlyList<MuadilSatiri> muadilSatirlari,
        bool kaydet,
        CancellationToken ct = default)
    {
        var k = Metin.TrKarsilastirici;
        var hatalar = new List<SatirHatasi>();
        var yeniMarkalar = new List<string>();
        var yeniNotalar = new List<string>();
        int yeniParfum = 0, guncellenenParfum = 0, yeniMuadil = 0, guncellenenMuadil = 0;

        static string Anahtar(string a, string b) => $"{a}\u001f{b}";

        // Mevcut veriyi bir kez belleğe al (yüzlerce kayıt için hızlı ve basit)
        var markalar = new Dictionary<string, Marka>(k);
        foreach (var m in await db.Markalar.ToListAsync(ct)) markalar.TryAdd(m.Ad, m);

        var notalar = new Dictionary<string, Nota>(k);
        foreach (var n in await db.Notalar.ToListAsync(ct)) notalar.TryAdd(n.Ad, n);

        var parfumler = new Dictionary<string, Parfum>(k);
        foreach (var p in await db.Parfumler.Include(p => p.Notalar).ToListAsync(ct))
            parfumler.TryAdd(Anahtar(p.Marka.Ad, p.Ad), p);

        // Silinmiş parfüme bağlı ama kendisi silinmemiş muadiller de tekil kod kuralına dahil
        var muadiller = new Dictionary<string, MuadilParfum>(k);
        foreach (var m in await db.MuadilParfumler.IgnoreQueryFilters().Where(m => m.SilinmeTarihi == null).ToListAsync(ct))
            muadiller.TryAdd(Anahtar(m.Marka.Ad, m.Kod), m);

        Marka? MarkaBulVeyaOlustur(string ad, MarkaTuru tur, string sayfa, int satir)
        {
            if (markalar.TryGetValue(ad, out var marka))
            {
                if (marka.Tur == tur) return marka;
                var kayitli = marka.Tur == MarkaTuru.Orijinal ? "orijinal" : "muadil";
                hatalar.Add(new(sayfa, satir, $"\"{marka.Ad}\" sistemde {kayitli} marka olarak kayıtlı."));
                return null;
            }

            marka = new Marka { Ad = ad, Tur = tur };
            db.Markalar.Add(marka);
            markalar[ad] = marka;
            yeniMarkalar.Add(ad);
            return marka;
        }

        Nota NotaBulVeyaOlustur(string ad)
        {
            if (notalar.TryGetValue(ad, out var nota)) return nota;

            nota = new Nota { Ad = ad };
            db.Notalar.Add(nota);
            notalar[ad] = nota;
            yeniNotalar.Add(ad);
            return nota;
        }

        // 1) Parfümler
        var dosyadakiParfumler = new HashSet<string>(k);
        foreach (var s in parfumSatirlari)
        {
            var anahtar = Anahtar(s.Marka, s.Ad);
            if (!dosyadakiParfumler.Add(anahtar))
            {
                hatalar.Add(new(ExcelOkuyucu.ParfumSayfasi, s.Satir, $"{s.Marka} {s.Ad} dosyada birden fazla kez var."));
                continue;
            }

            var marka = MarkaBulVeyaOlustur(s.Marka, MarkaTuru.Orijinal, ExcelOkuyucu.ParfumSayfasi, s.Satir);
            if (marka is null) continue;

            var hedef = s.Ust.Select(n => (Nota: NotaBulVeyaOlustur(n), Katman: NotaKatmani.Ust))
                .Concat(s.Orta.Select(n => (Nota: NotaBulVeyaOlustur(n), Katman: NotaKatmani.Orta)))
                .Concat(s.Alt.Select(n => (Nota: NotaBulVeyaOlustur(n), Katman: NotaKatmani.Alt)))
                .ToList();

            if (parfumler.TryGetValue(anahtar, out var mevcut))
            {
                mevcut.Fiyat50ml = s.Fiyat50ml;
                NotalariGuncelle(mevcut, hedef);
                guncellenenParfum++;
            }
            else
            {
                var yeni = new Parfum
                {
                    Ad = s.Ad,
                    Marka = marka,
                    Fiyat50ml = s.Fiyat50ml,
                    Notalar = hedef.Select(h => new ParfumNota { Nota = h.Nota, Katman = h.Katman }).ToList()
                };
                db.Parfumler.Add(yeni);
                parfumler[anahtar] = yeni;
                yeniParfum++;
            }
        }

        // 2) Muadiller (parfüm dosyada ya da veritabanında olmalı)
        var dosyadakiMuadiller = new HashSet<string>(k);
        foreach (var s in muadilSatirlari)
        {
            if (!parfumler.TryGetValue(Anahtar(s.OrijinalMarka, s.Parfum), out var parfum))
            {
                hatalar.Add(new(ExcelOkuyucu.MuadilSayfasi, s.Satir,
                    $"\"{s.OrijinalMarka} {s.Parfum}\" bulunamadı. Parfümler sayfasına ekle ya da adını kontrol et."));
                continue;
            }

            var marka = MarkaBulVeyaOlustur(s.MuadilMarka, MarkaTuru.Muadil, ExcelOkuyucu.MuadilSayfasi, s.Satir);
            if (marka is null) continue;

            var anahtar = Anahtar(marka.Ad, s.Kod);
            if (!dosyadakiMuadiller.Add(anahtar))
            {
                hatalar.Add(new(ExcelOkuyucu.MuadilSayfasi, s.Satir, $"{marka.Ad} {s.Kod} dosyada birden fazla kez var."));
                continue;
            }

            if (muadiller.TryGetValue(anahtar, out var mevcut))
            {
                mevcut.Parfum = parfum;
                mevcut.Fiyat = s.Fiyat;
                mevcut.KalicilikPuani = s.Kalicilik;
                mevcut.BenzerlikPuani = s.Benzerlik;
                mevcut.UrunLinki = s.UrunLinki;
                guncellenenMuadil++;
            }
            else
            {
                var yeni = new MuadilParfum
                {
                    Parfum = parfum,
                    Marka = marka,
                    Kod = s.Kod,
                    Fiyat = s.Fiyat,
                    KalicilikPuani = s.Kalicilik,
                    BenzerlikPuani = s.Benzerlik,
                    UrunLinki = s.UrunLinki
                };
                db.MuadilParfumler.Add(yeni);
                muadiller[anahtar] = yeni;
                yeniMuadil++;
            }
        }

        // Tek bir hata bile varsa hiçbir şey kaydedilmez (ya hepsi ya hiçbiri)
        if (hatalar.Count > 0)
            return new IceAktarmaSonucu(null, hatalar);

        if (kaydet)
            await db.SaveChangesAsync(ct); // tek SaveChanges = tek transaction

        return new IceAktarmaSonucu(
            new IceAktarmaOzeti(yeniParfum, guncellenenParfum, yeniMuadil, guncellenenMuadil,
                yeniMarkalar.Count, yeniNotalar.Count, yeniMarkalar, yeniNotalar),
            []);
    }

    // Aynı (ParfumId, NotaId) anahtarını silip yeniden eklemek çakışır; bu yüzden farkla güncellenir
    private static void NotalariGuncelle(Parfum parfum, List<(Nota Nota, NotaKatmani Katman)> hedef)
    {
        parfum.Notalar.RemoveAll(pn => !hedef.Any(h => h.Nota.Id != 0 && h.Nota.Id == pn.NotaId));

        foreach (var pn in parfum.Notalar)
            pn.Katman = hedef.First(h => h.Nota.Id == pn.NotaId).Katman;

        foreach (var h in hedef)
            if (h.Nota.Id == 0 || !parfum.Notalar.Any(pn => pn.NotaId == h.Nota.Id))
                parfum.Notalar.Add(new ParfumNota { Nota = h.Nota, Katman = h.Katman });
    }
}
