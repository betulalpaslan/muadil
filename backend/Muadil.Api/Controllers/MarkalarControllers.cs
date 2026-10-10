using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Dtos;
using Muadil.Domain.Entities;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

[ApiController]
[Route("api/markalar")]
public class MarkalarController(MuadilDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MarkaDto>>> Listele([FromQuery] MarkaTuru? tur)
    {
        var sorgu = db.Markalar.AsNoTracking();
        if (tur is not null)
            sorgu = sorgu.Where(m => m.Tur == tur);

        return await sorgu
            .OrderBy(m => m.Ad)
            .Select(m => new MarkaDto(m.Id, m.Ad, m.Tur))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MarkaDto>> Getir(int id)
    {
        var marka = await db.Markalar.AsNoTracking()
            .Where(m => m.Id == id)
            .Select(m => new MarkaDto(m.Id, m.Ad, m.Tur))
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
            new MarkaDto(marka.Id, marka.Ad, marka.Tur));
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
}