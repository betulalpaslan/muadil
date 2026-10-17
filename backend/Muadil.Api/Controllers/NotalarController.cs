using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Dtos;
using Muadil.Domain.Abstractions;
using Muadil.Domain.Entities;
using Muadil.Domain.Kurallar;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

[ApiController]
[Route("api/notalar")]
public class NotalarController(MuadilDbContext db, IGorselDeposu gorselDeposu) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NotaDto>>> Listele() =>
        await db.Notalar.AsNoTracking()
            .OrderBy(n => n.Ad)
            .Select(n => new NotaDto(n.Id, n.Ad, n.GorselUrl, n.Aciklama))
            .ToListAsync();

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<ActionResult<NotaDto>> Ekle(NotaKaydetDto dto)
    {
        var ad = NotaAdi.Normalize(dto.Ad);
        if (await AdKullaniliyor(ad))
            return Conflict(new { mesaj = $"'{ad}' notası zaten var." });

        var nota = new Nota { Ad = ad, Aciklama = Aciklama(dto) };
        db.Notalar.Add(nota);
        await db.SaveChangesAsync();
        return Created($"/api/notalar/{nota.Id}", new NotaDto(nota.Id, nota.Ad, nota.GorselUrl, nota.Aciklama));
    }

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Guncelle(int id, NotaKaydetDto dto)
    {
        var nota = await db.Notalar.FindAsync(id);
        if (nota is null) return NotFound();

        var ad = NotaAdi.Normalize(dto.Ad);
        if (await AdKullaniliyor(ad, id))
            return Conflict(new { mesaj = $"'{ad}' notası zaten var." });

        nota.Ad = ad;
        // Açıklama gönderilmediyse (null) mevcut olan korunur; boş metin gönderilirse silinir
        if (dto.Aciklama is not null) nota.Aciklama = Aciklama(dto);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Boş açıklama kaydedilmez (null)
    private static string? Aciklama(NotaKaydetDto dto) =>
        string.IsNullOrWhiteSpace(dto.Aciklama) ? null : dto.Aciklama.Trim();

    private Task<bool> AdKullaniliyor(string ad, int? haricId = null) =>
        db.Notalar.AnyAsync(n => n.Ad.ToLower() == ad.ToLower() && (haricId == null || n.Id != haricId));

    private static readonly Dictionary<string, string> IzinliTurler = new()
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp"
    };

    private const long MaksBoyut = 2 * 1024 * 1024;

    [Authorize(Roles = "admin")]
    [HttpPost("{id:int}/gorsel")]
    public async Task<IActionResult> GorselYukle(int id, IFormFile dosya, CancellationToken ct)
    {
        var nota = await db.Notalar.FindAsync([id], ct);
        if (nota is null) return NotFound();

        var sorun = await GorselKaydet(nota, dosya, ct);
        if (sorun is not null) return BadRequest(new { mesaj = sorun });

        return Ok(new { gorselUrl = nota.GorselUrl });
    }

    private const int TopluGorselEnFazla = 10;

    // Dosya adı (uzantısız) nota adıyla eşleşir: "vanilya.png", "kayisi-cicegi.webp". Büyük-küçük harf, Türkçe
    // karakter ve '-' / '_' farkı yok sayılır. Arayüz çok dosyayı 10'arlı paketler halinde gönderir.
    [Authorize(Roles = "admin")]
    [HttpPost("gorseller")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<ActionResult<List<TopluGorselSonucuDto>>> TopluGorselYukle(List<IFormFile> dosyalar, CancellationToken ct)
    {
        if (dosyalar.Count == 0 || dosyalar.Count > TopluGorselEnFazla)
            return BadRequest(new { mesaj = $"Tek seferde 1 ile {TopluGorselEnFazla} arası dosya gönderilebilir." });

        var notalar = (await db.Notalar.ToListAsync(ct)).ToLookup(n => Anahtar(n.Ad));
        var sonuclar = new List<TopluGorselSonucuDto>();

        foreach (var dosya in dosyalar)
        {
            var eslesenler = notalar[Anahtar(Path.GetFileNameWithoutExtension(dosya.FileName))].ToList();
            if (eslesenler.Count == 0)
            {
                sonuclar.Add(new(dosya.FileName, "eslesmedi", null, "Bu adda bir nota yok."));
                continue;
            }
            if (eslesenler.Count > 1)
            {
                sonuclar.Add(new(dosya.FileName, "hatali", null,
                    $"Birden fazla notayla eşleşiyor: {string.Join(", ", eslesenler.Select(n => n.Ad))}."));
                continue;
            }

            var nota = eslesenler[0];
            var sorun = await GorselKaydet(nota, dosya, ct);
            sonuclar.Add(sorun is null
                ? new(dosya.FileName, "yuklendi", nota.Ad, null)
                : new(dosya.FileName, "hatali", nota.Ad, sorun));
        }

        return sonuclar;
    }

    // Görseli doğrulayıp kaydeder, eskisini siler. Sorun varsa kullanıcıya gösterilecek mesajı döndürür.
    private async Task<string?> GorselKaydet(Nota nota, IFormFile dosya, CancellationToken ct)
    {
        if (dosya.Length == 0 || dosya.Length > MaksBoyut)
            return "Görsel 2 MB'tan küçük olmalı.";

        if (!IzinliTurler.TryGetValue(dosya.ContentType, out var uzanti))
            return "Yalnızca JPEG, PNG veya WEBP yüklenebilir.";

        var eskiGorsel = nota.GorselUrl;

        await using var akis = dosya.OpenReadStream();
        nota.GorselUrl = await gorselDeposu.KaydetAsync(akis, uzanti, ct);
        await db.SaveChangesAsync(ct);

        if (eskiGorsel is not null)
            await gorselDeposu.SilAsync(eskiGorsel, ct);

        return null;
    }

    // "Kayısı Çiçeği", "kayisi-cicegi", "KAYISI_CICEGI" -> "kayisi cicegi"
    private static string Anahtar(string ad) =>
        NotaAdi.Normalize(ad.Replace('-', ' ').Replace('_', ' ')).ToLower(Metin.Tr)
            .Replace('ç', 'c').Replace('ğ', 'g').Replace('ı', 'i').Replace('ö', 'o').Replace('ş', 's').Replace('ü', 'u')
            .Replace('â', 'a').Replace('î', 'i').Replace('û', 'u');
}
