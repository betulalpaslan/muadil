using System.ComponentModel;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using Muadil.Domain.Kurallar;
using Muadil.Infrastructure.IceAktarma;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Mcp;

// Her araç bir MCP "tool"u. Description'lar modelin aracı ne zaman ve nasıl kullanacağına karar verdiği metindir.
// MuadilDbContext ve IceAktarmaServisi gibi parametreler DI'dan gelir; diğerleri modelin dolduracağı argümanlardır.
[McpServerToolType]
public static class MuadilAraclari
{
    private static readonly JsonSerializerOptions JsonAyar = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping, // Türkçe karakterler ç gibi kaçmasın
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() }
    };

    private static string Json(object deger) => JsonSerializer.Serialize(deger, JsonAyar);

    // ---------- Okuma ----------

    [McpServerTool(Name = "parfum_ara", ReadOnly = true)]
    [Description("Orijinal parfümleri ada, markaya ya da muadil koduna göre arar. Her sonuç için muadil sayısını ve en uygun muadil fiyatını döner.")]
    public static async Task<string> ParfumAra(
        MuadilDbContext db,
        [Description("Aranacak metin, ör. 'sauvage', 'dior' ya da 'bargello 567'")] string sorgu,
        CancellationToken ct)
    {
        var desen = $"%{sorgu.Trim()}%";
        var sonuc = await db.Parfumler.AsNoTracking()
            .Where(p =>
                EF.Functions.ILike(p.Ad, desen) ||
                EF.Functions.ILike(p.Marka.Ad, desen) ||
                p.Muadiller.Any(m => EF.Functions.ILike(m.Kod, desen) || EF.Functions.ILike(m.Marka.Ad + " " + m.Kod, desen)))
            .OrderBy(p => p.Ad)
            .Take(25)
            .Select(p => new
            {
                Parfum = p.Ad,
                Marka = p.Marka.Ad,
                MuadilSayisi = p.Muadiller.Count(),
                EnUygunMuadil = p.Muadiller.Min(m => (decimal?)m.Fiyat)
            })
            .ToListAsync(ct);

        return sonuc.Count == 0 ? $"'{sorgu}' için parfüm bulunamadı." : Json(sonuc);
    }

    [McpServerTool(Name = "parfum_detay", ReadOnly = true)]
    [Description("Bir orijinal parfümün nota piramidini ve tüm muadillerini (marka, kod, 50 ml fiyat, kalıcılık, benzerlik, link) getirir.")]
    public static async Task<string> ParfumDetay(
        MuadilDbContext db,
        [Description("Orijinal parfümün markası, ör. 'Dior'")] string marka,
        [Description("Parfümün adı, ör. 'Sauvage'")] string parfum,
        CancellationToken ct)
    {
        var sonuc = await db.Parfumler.AsNoTracking()
            .Where(p => EF.Functions.ILike(p.Marka.Ad, marka.Trim()) && EF.Functions.ILike(p.Ad, parfum.Trim()))
            .Select(p => new
            {
                Parfum = p.Ad,
                Marka = p.Marka.Ad,
                Notalar = p.Notalar.OrderBy(n => n.Katman).ThenBy(n => n.Nota.Ad)
                    .Select(n => new { Nota = n.Nota.Ad, n.Katman }).ToList(),
                Muadiller = p.Muadiller.OrderByDescending(m => m.BenzerlikPuani).ThenBy(m => m.Fiyat)
                    .Select(m => new { Marka = m.Marka.Ad, m.Kod, m.Fiyat, Kalicilik = m.KalicilikPuani, Benzerlik = m.BenzerlikPuani, Link = m.UrunLinki })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        return sonuc is null
            ? $"'{marka} {parfum}' bulunamadı. Önce parfum_ara ile doğru adı bul."
            : Json(sonuc);
    }

    [McpServerTool(Name = "muadilleri_listele", ReadOnly = true)]
    [Description("Muadilleri orijinal parfümleriyle birlikte listeler; isteğe bağlı olarak bir muadil markasına göre filtreler. Toplu puan güncellerken hangi muadillerin kaldığını görmek için kullan.")]
    public static async Task<string> MuadilleriListele(
        MuadilDbContext db,
        [Description("İsteğe bağlı muadil markası, ör. 'Bargello'. Boş bırakılırsa hepsi.")] string? muadilMarka = null,
        CancellationToken ct = default)
    {
        var sorgu = db.MuadilParfumler.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(muadilMarka))
            sorgu = sorgu.Where(m => EF.Functions.ILike(m.Marka.Ad, muadilMarka.Trim()));

        var sonuc = await sorgu
            .OrderBy(m => m.Marka.Ad).ThenBy(m => m.Kod)
            .Select(m => new
            {
                Muadil = m.Marka.Ad + " " + m.Kod,
                Orijinal = m.Parfum.Marka.Ad + " " + m.Parfum.Ad,
                m.Fiyat,
                Kalicilik = m.KalicilikPuani,
                Benzerlik = m.BenzerlikPuani
            })
            .ToListAsync(ct);

        return sonuc.Count == 0 ? "Muadil bulunamadı." : Json(sonuc);
    }

    // ---------- Yazma (yalnızca kullanıcı açıkça istediğinde) ----------

    [McpServerTool(Name = "muadil_guncelle", Destructive = false, Idempotent = true)]
    [Description("Var olan bir muadilin kalıcılık puanını, benzerlik puanını, 50 ml fiyatını ya da ürün linkini günceller; yalnızca verilen alanlar değişir. Puanlar editörün kararıdır: kullanıcı söylemediği bir puanı önerme, tahmin etme ya da uydurma.")]
    public static async Task<string> MuadilGuncelle(
        MuadilDbContext db,
        [Description("Muadil markası, ör. 'Bargello'")] string muadilMarka,
        [Description("Muadil kodu, ör. '567'")] string kod,
        [Description("Yeni kalıcılık puanı, 1-10 arası tam sayı")] int? kalicilik = null,
        [Description("Yeni benzerlik puanı, 1-10 arası tam sayı")] int? benzerlik = null,
        [Description("Yeni 50 ml fiyatı (TL)")] decimal? fiyat = null,
        [Description("Yeni ürün linki, https:// ile başlamalı")] string? urunLinki = null,
        CancellationToken ct = default)
    {
        if (kalicilik is null && benzerlik is null && fiyat is null && urunLinki is null)
            return "Değiştirilecek bir alan verilmedi.";

        var hatalar = new List<string>();
        if (kalicilik is < 1 or > 10) hatalar.Add("Kalıcılık 1-10 arası olmalı.");
        if (benzerlik is < 1 or > 10) hatalar.Add("Benzerlik 1-10 arası olmalı.");
        if (fiyat is < 1m or > 100000m) hatalar.Add("Fiyat 1-100000 arası olmalı.");
        if (urunLinki is not null && !GecerliLink(urunLinki)) hatalar.Add("Link https:// ile başlayan geçerli bir adres olmalı.");
        if (hatalar.Count > 0) return "Güncellenmedi: " + string.Join(" ", hatalar);

        var muadil = await db.MuadilParfumler
            .Include(m => m.Marka)
            .Include(m => m.Parfum).ThenInclude(p => p.Marka)
            .FirstOrDefaultAsync(m => EF.Functions.ILike(m.Marka.Ad, muadilMarka.Trim()) && EF.Functions.ILike(m.Kod, kod.Trim()), ct);
        if (muadil is null)
            return $"'{muadilMarka} {kod}' bulunamadı. muadilleri_listele ile kontrol et.";

        if (kalicilik is not null) muadil.KalicilikPuani = kalicilik.Value;
        if (benzerlik is not null) muadil.BenzerlikPuani = benzerlik.Value;
        if (fiyat is not null) muadil.Fiyat = fiyat.Value;
        if (urunLinki is not null) muadil.UrunLinki = urunLinki.Trim();
        await db.SaveChangesAsync(ct);

        return $"Güncellendi: {muadil.Marka.Ad} {muadil.Kod} ({muadil.Parfum.Marka.Ad} {muadil.Parfum.Ad}) → " +
               $"kalıcılık {muadil.KalicilikPuani}, benzerlik {muadil.BenzerlikPuani}, fiyat {muadil.Fiyat} TL.";
    }

    [McpServerTool(Name = "muadil_ekle", Destructive = false, Idempotent = true)]
    [Description("Bir orijinal parfüme muadil ekler. Aynı muadil markası ve kodu zaten varsa bilgilerini günceller. Muadil markası sistemde yoksa oluşturulur. Puanlar editörün kararıdır: kullanıcı vermediyse sor, uydurma.")]
    public static async Task<string> MuadilEkle(
        IceAktarmaServisi servis,
        [Description("Orijinal parfümün markası, ör. 'Dior'")] string orijinalMarka,
        [Description("Orijinal parfümün adı, ör. 'Sauvage'")] string parfum,
        [Description("Muadil markası, ör. 'Bargello'")] string muadilMarka,
        [Description("Muadil kodu, ör. '567'")] string kod,
        [Description("50 ml fiyatı (TL)")] decimal fiyat,
        [Description("Kalıcılık puanı, 1-10")] int kalicilik,
        [Description("Benzerlik puanı, 1-10")] int benzerlik,
        [Description("Ürün linki, https:// ile başlamalı")] string urunLinki,
        CancellationToken ct)
    {
        var hatalar = new List<string>();
        if (string.IsNullOrWhiteSpace(kod) || kod.Trim().Length > 50) hatalar.Add("Kod boş olamaz, en fazla 50 karakter.");
        if (fiyat is < 1m or > 100000m) hatalar.Add("Fiyat 1-100000 arası olmalı.");
        if (kalicilik is < 1 or > 10) hatalar.Add("Kalıcılık 1-10 arası olmalı.");
        if (benzerlik is < 1 or > 10) hatalar.Add("Benzerlik 1-10 arası olmalı.");
        if (!GecerliLink(urunLinki)) hatalar.Add("Link https:// ile başlayan geçerli bir adres olmalı.");
        if (hatalar.Count > 0) return "Eklenmedi: " + string.Join(" ", hatalar);

        var satir = new MuadilSatiri(0, orijinalMarka.Trim(), parfum.Trim(), muadilMarka.Trim(), kod.Trim(),
            fiyat, kalicilik, benzerlik, urunLinki.Trim());
        var sonuc = await servis.UygulaAsync([], [satir], kaydet: true, ct);

        return sonuc.Ozet is null
            ? "Eklenmedi: " + string.Join(" ", sonuc.Hatalar.Select(h => h.Mesaj))
            : sonuc.Ozet.YeniMuadil > 0
                ? $"Eklendi: {muadilMarka} {kod} → {orijinalMarka} {parfum}." + YeniMarkaNotu(sonuc.Ozet)
                : $"Zaten vardı, güncellendi: {muadilMarka} {kod}.";
    }

    [McpServerTool(Name = "parfum_ekle", Destructive = false, Idempotent = true)]
    [Description("Orijinal parfüm ekler ya da var olanın nota piramidini değiştirir. Notalar virgülle ayrılır. Sistemde olmayan marka ve notalar oluşturulur; sonuçta yeni nota adları listelenir, yazım hatası olup olmadığını kullanıcıya göster. Nota bilgisi doğrulanmamışsa önce kullanıcıya onaylat.")]
    public static async Task<string> ParfumEkle(
        IceAktarmaServisi servis,
        [Description("Orijinal marka, ör. 'Dior'")] string marka,
        [Description("Parfüm adı, ör. 'Sauvage'")] string parfum,
        [Description("Üst notalar, virgülle: 'Bergamot, Biber'")] string ustNotalar,
        [Description("Orta notalar, virgülle")] string ortaNotalar,
        [Description("Alt notalar, virgülle")] string altNotalar,
        CancellationToken ct)
    {
        var ust = Notalar(ustNotalar);
        var orta = Notalar(ortaNotalar);
        var alt = Notalar(altNotalar);
        var hepsi = ust.Concat(orta).Concat(alt).ToList();

        if (string.IsNullOrWhiteSpace(marka) || string.IsNullOrWhiteSpace(parfum))
            return "Eklenmedi: marka ve parfüm adı boş olamaz.";
        if (hepsi.Count == 0)
            return "Eklenmedi: en az bir nota gerekli.";
        var tekrar = hepsi.GroupBy(n => n, Metin.TrKarsilastirici).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
        if (tekrar.Count > 0)
            return $"Eklenmedi: aynı nota birden fazla katmanda: {string.Join(", ", tekrar)}.";

        var satir = new ParfumSatiri(0, marka.Trim(), parfum.Trim(), ust, orta, alt);
        var sonuc = await servis.UygulaAsync([satir], [], kaydet: true, ct);

        if (sonuc.Ozet is null)
            return "Eklenmedi: " + string.Join(" ", sonuc.Hatalar.Select(h => h.Mesaj));

        var ne = sonuc.Ozet.YeniParfum > 0 ? "Eklendi" : "Güncellendi (notalar değişti)";
        return $"{ne}: {marka} {parfum}." + YeniMarkaNotu(sonuc.Ozet);
    }

    // ---------- Yardımcılar ----------

    private static string YeniMarkaNotu(IceAktarmaOzeti ozet)
    {
        var parcalar = new List<string>();
        if (ozet.YeniMarkalar.Count > 0) parcalar.Add($"Yeni marka: {string.Join(", ", ozet.YeniMarkalar)}.");
        if (ozet.YeniNotalar.Count > 0) parcalar.Add($"Yeni nota: {string.Join(", ", ozet.YeniNotalar)}.");
        return parcalar.Count == 0 ? "" : " " + string.Join(" ", parcalar);
    }

    private static List<string> Notalar(string metin) =>
        (metin ?? "").Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(NotaAdi.Normalize)
            .Where(n => n != "")
            .Distinct(Metin.TrKarsilastirici)
            .ToList();

    private static bool GecerliLink(string link) =>
        link.Length <= 500 &&
        Uri.TryCreate(link.Trim(), UriKind.Absolute, out var adres) &&
        (adres.Scheme == Uri.UriSchemeHttps || adres.Scheme == Uri.UriSchemeHttp);
}
