using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Dtos;
using Muadil.Api.Goruntu;
using Muadil.Domain.Abstractions;
using Muadil.Domain.Entities;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

[ApiController]
[Route("api/parfumler")]
public class ParfumlerController(MuadilDbContext db, IGorselDeposu gorselDeposu) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ParfumListeDto>>> Listele([FromQuery] string? ara)
    {
        var sorgu = db.Parfumler.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(ara))
        {
            var desen = $"%{ara.Trim()}%";
            sorgu = sorgu.Where(p =>
                EF.Functions.ILike(p.Ad, desen) ||
                EF.Functions.ILike(p.Marka.Ad, desen) ||
                p.Muadiller.Any(m =>
                    EF.Functions.ILike(m.Kod, desen) ||
                    EF.Functions.ILike(m.Marka.Ad + " " + m.Kod, desen)));
        }

        return await sorgu
            .OrderBy(p => p.Ad)
            .Select(p => new ParfumListeDto(
                p.Id, p.Ad, p.Marka.Ad, p.GorselUrl, p.Renk,
                p.Muadiller.Count(),
                p.Muadiller.Min(m => (decimal?)m.Fiyat),
                p.Muadiller
                    .OrderBy(m => m.Fiyat)
                    .Select(m => new MuadilOzetDto(m.Marka.Ad, m.Kod, m.Fiyat))
                    .ToList()))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ParfumDetayDto>> Getir(int id)
    {
        var parfum = await db.Parfumler.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ParfumDetayDto(
                p.Id, p.Ad, p.Cinsiyet, p.MarkaId, p.Marka.Ad, p.GorselUrl, p.Renk,
                p.Notalar
                    .OrderBy(pn => pn.Katman).ThenBy(pn => pn.Nota.Ad)
                    .Select(pn => new ParfumNotaDto(pn.NotaId, pn.Nota.Ad, pn.Katman))
                    .ToList(),
                p.Muadiller
                    .OrderByDescending(m => m.BenzerlikPuani).ThenBy(m => m.Fiyat)
                    .Select(m => new MuadilDto(m.Id, m.Marka.Ad, m.Marka.GorselUrl, m.Kod, m.Cinsiyet, m.Fiyat,
                        m.KalicilikPuani, m.BenzerlikPuani, m.UrunLinki))
                    .ToList()))
            .FirstOrDefaultAsync();

        return parfum is null ? NotFound() : parfum;
    }

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<ActionResult<ParfumDetayDto>> Ekle(ParfumKaydetDto dto)
    {
        var ad = dto.Ad.Trim();
        var hata = await Dogrula(dto, ad);
        if (hata is not null) return hata;

        var parfum = new Parfum
        {
            Ad = ad,
            Cinsiyet = dto.Cinsiyet,
            MarkaId = dto.MarkaId,
            Renk = dto.Renk,
            Notalar = dto.Notalar
                .Select(n => new ParfumNota { NotaId = n.NotaId, Katman = n.Katman })
                .ToList()
        };

        db.Parfumler.Add(parfum);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Getir), new { id = parfum.Id }, (await Getir(parfum.Id)).Value);
    }

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Guncelle(int id, ParfumKaydetDto dto)
    {
        var parfum = await db.Parfumler
            .Include(p => p.Notalar)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (parfum is null) return NotFound();

        var ad = dto.Ad.Trim();
        var hata = await Dogrula(dto, ad, haricId: id);
        if (hata is not null) return hata;

        parfum.Ad = ad;
        parfum.Cinsiyet = dto.Cinsiyet;
        parfum.MarkaId = dto.MarkaId;
        parfum.Renk = dto.Renk;

        // Notaları farkıyla güncelle: çıkanları sil, kalanların katmanını güncelle, yenileri ekle
        var yeni = dto.Notalar.ToDictionary(n => n.NotaId, n => n.Katman);
        parfum.Notalar.RemoveAll(pn => !yeni.ContainsKey(pn.NotaId));
        foreach (var pn in parfum.Notalar)
            pn.Katman = yeni[pn.NotaId];
        foreach (var (notaId, katman) in yeni)
            if (!parfum.Notalar.Any(pn => pn.NotaId == notaId))
                parfum.Notalar.Add(new ParfumNota { NotaId = notaId, Katman = katman });

        await db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Sil(int id)
    {
        var parfum = await db.Parfumler.FindAsync(id);
        if (parfum is null) return NotFound();

        parfum.SilinmeTarihi = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Görseli olup rengi boş kalan parfümleri, görselin orta rengini örnekleyerek toplu renklendirir.
    [Authorize(Roles = "admin")]
    [HttpPost("renk-algila-toplu")]
    public async Task<ActionResult<List<RenkAlgilamaSonucuDto>>> RenkAlgilaToplu([FromServices] IWebHostEnvironment env, CancellationToken ct)
    {
        var uploadsYolu = Path.Combine(env.ContentRootPath, "uploads");
        var adaylar = await db.Parfumler.Where(p => p.GorselUrl != null && p.Renk == null).ToListAsync(ct);
        var sonuc = new List<RenkAlgilamaSonucuDto>();
        foreach (var p in adaylar)
        {
            var dosyaYolu = Path.Combine(uploadsYolu, Path.GetFileName(p.GorselUrl!));
            if (!System.IO.File.Exists(dosyaYolu)) continue;
            await using var akis = System.IO.File.OpenRead(dosyaYolu);
            var renk = RenkAlgilama.OrtadakiRengiAl(akis);
            if (renk is null) continue;
            p.Renk = renk;
            sonuc.Add(new RenkAlgilamaSonucuDto(p.Id, p.Ad, renk));
        }
        await db.SaveChangesAsync(ct);
        return Ok(sonuc);
    }

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
        var parfum = await db.Parfumler.FindAsync([id], ct);
        if (parfum is null) return NotFound();

        if (dosya.Length == 0 || dosya.Length > MaksBoyut)
            return BadRequest(new { mesaj = "Görsel 2 MB'tan küçük olmalı." });

        if (!IzinliTurler.TryGetValue(dosya.ContentType, out var uzanti))
            return BadRequest(new { mesaj = "Yalnızca JPEG, PNG veya WEBP yüklenebilir." });

        var eskiGorsel = parfum.GorselUrl;

        await using (var akis = dosya.OpenReadStream())
            parfum.GorselUrl = await gorselDeposu.KaydetAsync(akis, uzanti, ct);

        // Renk elle girilmediyse görselin tam ortasından otomatik öner; algılama başarısız olursa yükleme yine de tamamlanır
        if (string.IsNullOrEmpty(parfum.Renk))
        {
            try
            {
                await using var renkAkisi = dosya.OpenReadStream();
                parfum.Renk = RenkAlgilama.OrtadakiRengiAl(renkAkisi);
            }
            catch
            {
                // görsel formatı renk algılamayı desteklemiyorsa sessizce atla
            }
        }

        await db.SaveChangesAsync(ct);

        if (eskiGorsel is not null)
            await gorselDeposu.SilAsync(eskiGorsel, ct);

        return Ok(new { gorselUrl = parfum.GorselUrl, renk = parfum.Renk });
    }

    private async Task<ActionResult?> Dogrula(ParfumKaydetDto dto, string ad, int? haricId = null)
    {
        var marka = await db.Markalar.FindAsync(dto.MarkaId);
        if (marka is null || marka.Tur != MarkaTuru.Orijinal)
            return BadRequest(new { mesaj = "Geçerli bir orijinal marka seçmelisin." });

        var notaIdleri = dto.Notalar.Select(n => n.NotaId).ToList();
        if (notaIdleri.Count != notaIdleri.Distinct().Count())
            return BadRequest(new { mesaj = "Aynı nota birden fazla kez eklenemez." });

        var mevcutNotaSayisi = await db.Notalar.CountAsync(n => notaIdleri.Contains(n.Id));
        if (mevcutNotaSayisi != notaIdleri.Count)
            return BadRequest(new { mesaj = "Seçilen notalardan bazıları bulunamadı." });

        var ayniAdVar = await db.Parfumler.AnyAsync(p =>
            p.MarkaId == dto.MarkaId &&
            p.Ad.ToLower() == ad.ToLower() &&
            (haricId == null || p.Id != haricId));
        if (ayniAdVar)
            return Conflict(new { mesaj = $"{marka.Ad} markasında '{ad}' zaten var." });

        return null;
    }
}
