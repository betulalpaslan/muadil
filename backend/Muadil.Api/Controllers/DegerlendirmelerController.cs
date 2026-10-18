using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Auth;
using Muadil.Api.Dtos;
using Muadil.Domain.Entities;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

// Kullanıcılar orijinal parfümü değil, onun muadillerini değerlendirir.
[ApiController]
public class DegerlendirmelerController(MuadilDbContext db) : ControllerBase
{
    private const int MaksListe = 100;

    // Herkese açık; token gelmişse "benimMi" ve "benim" alanları da dolar.
    [HttpGet("api/muadiller/{muadilId:int}/degerlendirmeler")]
    public async Task<ActionResult<DegerlendirmeOzetiDto>> Listele(int muadilId)
    {
        if (!await db.MuadilParfumler.AnyAsync(m => m.Id == muadilId))
            return NotFound();

        var kullaniciId = User.KullaniciId();
        var sorgu = db.Degerlendirmeler.AsNoTracking().Where(d => d.MuadilParfumId == muadilId);

        var ozet = await sorgu
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Sayi = g.Count(),
                Ortalama = g.Average(d => (double)d.Puan),
                Benzerlik = g.Average(d => (double?)d.BenzerlikPuani),
                Kalicilik = g.Average(d => (double?)d.KalicilikPuani)
            })
            .FirstOrDefaultAsync();

        var liste = await sorgu
            .OrderByDescending(d => d.GuncellemeTarihi ?? d.OlusturmaTarihi)
            .Take(MaksListe)
            .Select(d => new DegerlendirmeDto(
                d.Id, d.KullaniciAdi, d.Puan, d.BenzerlikPuani, d.KalicilikPuani, d.Yorum,
                d.GuncellemeTarihi ?? d.OlusturmaTarihi,
                kullaniciId != null && d.KullaniciId == kullaniciId))
            .ToListAsync();

        var benim = kullaniciId is null
            ? null
            : liste.FirstOrDefault(d => d.BenimMi) ?? await sorgu
                .Where(d => d.KullaniciId == kullaniciId)
                .Select(d => new DegerlendirmeDto(
                    d.Id, d.KullaniciAdi, d.Puan, d.BenzerlikPuani, d.KalicilikPuani, d.Yorum,
                    d.GuncellemeTarihi ?? d.OlusturmaTarihi, true))
                .FirstOrDefaultAsync();

        return new DegerlendirmeOzetiDto(
            ozet is null ? null : Math.Round(ozet.Ortalama, 1),
            ozet?.Benzerlik is { } benzerlik ? Math.Round(benzerlik, 1) : null,
            ozet?.Kalicilik is { } kalicilik ? Math.Round(kalicilik, 1) : null,
            ozet?.Sayi ?? 0, benim, liste);
    }

    // Kullanıcı başına muadil başına tek kayıt: yoksa oluşturur, varsa günceller.
    [Authorize]
    [HttpPut("api/muadiller/{muadilId:int}/degerlendirme")]
    public async Task<ActionResult<DegerlendirmeDto>> Kaydet(int muadilId, DegerlendirmeKaydetDto dto)
    {
        var kullaniciId = User.KullaniciId();
        if (kullaniciId is null) return Unauthorized();

        if (!await db.MuadilParfumler.AnyAsync(m => m.Id == muadilId))
            return NotFound();

        var yorum = string.IsNullOrWhiteSpace(dto.Yorum) ? null : dto.Yorum.Trim();
        var simdi = DateTime.UtcNow;

        var degerlendirme = await db.Degerlendirmeler
            .FirstOrDefaultAsync(d => d.MuadilParfumId == muadilId && d.KullaniciId == kullaniciId);

        if (degerlendirme is null)
        {
            degerlendirme = new Degerlendirme
            {
                MuadilParfumId = muadilId,
                KullaniciId = kullaniciId,
                OlusturmaTarihi = simdi
            };
            db.Degerlendirmeler.Add(degerlendirme);
        }
        else
        {
            degerlendirme.GuncellemeTarihi = simdi;
        }

        degerlendirme.KullaniciAdi = User.KullaniciAdi();
        degerlendirme.Puan = dto.Puan;
        degerlendirme.BenzerlikPuani = dto.BenzerlikPuani;
        degerlendirme.KalicilikPuani = dto.KalicilikPuani;
        degerlendirme.Yorum = yorum;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Aynı kullanıcının eşzamanlı iki isteği benzersiz dizine takılabilir
            return Conflict(new { mesaj = "Değerlendirmen kaydedilemedi, tekrar dene." });
        }

        return new DegerlendirmeDto(
            degerlendirme.Id, degerlendirme.KullaniciAdi, degerlendirme.Puan,
            degerlendirme.BenzerlikPuani, degerlendirme.KalicilikPuani, degerlendirme.Yorum,
            degerlendirme.GuncellemeTarihi ?? degerlendirme.OlusturmaTarihi, true);
    }

    [Authorize]
    [HttpDelete("api/muadiller/{muadilId:int}/degerlendirme")]
    public async Task<IActionResult> KendiniSil(int muadilId)
    {
        var kullaniciId = User.KullaniciId();
        if (kullaniciId is null) return Unauthorized();

        var degerlendirme = await db.Degerlendirmeler
            .FirstOrDefaultAsync(d => d.MuadilParfumId == muadilId && d.KullaniciId == kullaniciId);
        if (degerlendirme is null) return NotFound();

        degerlendirme.SilinmeTarihi = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Yönetici, uygunsuz yorumu kaldırır.
    [Authorize(Roles = "admin")]
    [HttpDelete("api/degerlendirmeler/{id:int}")]
    public async Task<IActionResult> Sil(int id)
    {
        var degerlendirme = await db.Degerlendirmeler.FirstOrDefaultAsync(d => d.Id == id);
        if (degerlendirme is null) return NotFound();

        degerlendirme.SilinmeTarihi = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
