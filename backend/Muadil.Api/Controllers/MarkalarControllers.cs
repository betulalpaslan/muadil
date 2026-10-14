using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Dtos;
using Muadil.Domain.Abstractions;
using Muadil.Domain.Entities;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

[ApiController]
[Route("api/markalar")]
public class MarkalarController(MuadilDbContext db, IGorselDeposu gorselDeposu) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MarkaDto>>> Listele([FromQuery] MarkaTuru? tur)
    {
        var sorgu = db.Markalar.AsNoTracking();
        if (tur is not null)
            sorgu = sorgu.Where(m => m.Tur == tur);

        return await sorgu
            .OrderBy(m => m.Ad)
            .Select(m => new MarkaDto(m.Id, m.Ad, m.Tur, m.GorselUrl))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MarkaDto>> Getir(int id)
    {
        var marka = await db.Markalar.AsNoTracking()
            .Where(m => m.Id == id)
            .Select(m => new MarkaDto(m.Id, m.Ad, m.Tur, m.GorselUrl))
            .FirstOrDefaultAsync();

        return marka is null ? NotFound() : marka;
    }

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<ActionResult<MarkaDto>> Ekle(MarkaKaydetDto dto)
    {
        var ad = dto.Ad.Trim();
        if (await AdKullaniliyor(ad))
            return Conflict(new { mesaj = $"'{ad}' adında bir marka zaten var." });

        var marka = new Marka { Ad = ad, Tur = dto.Tur };
        db.Markalar.Add(marka);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Getir), new { id = marka.Id },
            new MarkaDto(marka.Id, marka.Ad, marka.Tur, marka.GorselUrl));
    }

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Guncelle(int id, MarkaKaydetDto dto)
    {
        var marka = await db.Markalar.FindAsync(id);
        if (marka is null)
            return NotFound();

        var ad = dto.Ad.Trim();
        if (await AdKullaniliyor(ad, haricId: id))
            return Conflict(new { mesaj = $"'{ad}' adında bir marka zaten var." });

        marka.Ad = ad;
        marka.Tur = dto.Tur;
        await db.SaveChangesAsync();

        return NoContent();
    }

    private Task<bool> AdKullaniliyor(string ad, int? haricId = null) =>
        db.Markalar.AnyAsync(m =>
            m.Ad.ToLower() == ad.ToLower() &&
            (haricId == null || m.Id != haricId));

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
        var marka = await db.Markalar.FindAsync([id], ct);
        if (marka is null) return NotFound();

        if (dosya.Length == 0 || dosya.Length > MaksBoyut)
            return BadRequest(new { mesaj = "Görsel 2 MB'tan küçük olmalı." });

        if (!IzinliTurler.TryGetValue(dosya.ContentType, out var uzanti))
            return BadRequest(new { mesaj = "Yalnızca JPEG, PNG veya WEBP yüklenebilir." });

        var eskiGorsel = marka.GorselUrl;

        await using var akis = dosya.OpenReadStream();
        marka.GorselUrl = await gorselDeposu.KaydetAsync(akis, uzanti, ct);
        await db.SaveChangesAsync(ct);

        if (eskiGorsel is not null)
            await gorselDeposu.SilAsync(eskiGorsel, ct);

        return Ok(new { gorselUrl = marka.GorselUrl });
    }
}