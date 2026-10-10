using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Dtos;
using Muadil.Domain.Entities;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
public class MuadillerController(MuadilDbContext db) : ControllerBase
{
    [HttpPost("api/parfumler/{parfumId:int}/muadiller")]
    public async Task<ActionResult<MuadilDto>> Ekle(int parfumId, MuadilKaydetDto dto)
    {
        if (!await db.Parfumler.AnyAsync(p => p.Id == parfumId))
            return NotFound();

        var kod = dto.Kod.Trim();
        var hata = await Dogrula(dto, kod);
        if (hata is not null) return hata;

        var muadil = new MuadilParfum
        {
            ParfumId = parfumId,
            MarkaId = dto.MarkaId,
            Kod = kod,
            Fiyat = dto.Fiyat,
            UrunLinki = dto.UrunLinki.Trim(),
            KalicilikPuani = dto.KalicilikPuani,
            BenzerlikPuani = dto.BenzerlikPuani
        };

        db.MuadilParfumler.Add(muadil);
        await db.SaveChangesAsync();

        var markaAdi = await db.Markalar.Where(m => m.Id == dto.MarkaId).Select(m => m.Ad).FirstAsync();
        return Created($"/api/muadiller/{muadil.Id}", new MuadilDto(
            muadil.Id, markaAdi, muadil.Kod, muadil.Fiyat,
            muadil.KalicilikPuani, muadil.BenzerlikPuani, muadil.UrunLinki));
    }

    [HttpPut("api/muadiller/{id:int}")]
    public async Task<IActionResult> Guncelle(int id, MuadilKaydetDto dto)
    {
        var muadil = await db.MuadilParfumler.FindAsync(id);
        if (muadil is null) return NotFound();

        var kod = dto.Kod.Trim();
        var hata = await Dogrula(dto, kod, haricId: id);
        if (hata is not null) return hata;

        muadil.MarkaId = dto.MarkaId;
        muadil.Kod = kod;
        muadil.Fiyat = dto.Fiyat;
        muadil.UrunLinki = dto.UrunLinki.Trim();
        muadil.KalicilikPuani = dto.KalicilikPuani;
        muadil.BenzerlikPuani = dto.BenzerlikPuani;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("api/muadiller/{id:int}")]
    public async Task<IActionResult> Sil(int id)
    {
        var muadil = await db.MuadilParfumler.FindAsync(id);
        if (muadil is null) return NotFound();

        muadil.SilinmeTarihi = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult?> Dogrula(MuadilKaydetDto dto, string kod, int? haricId = null)
    {
        var marka = await db.Markalar.FindAsync(dto.MarkaId);
        if (marka is null || marka.Tur != MarkaTuru.Muadil)
            return BadRequest(new { mesaj = "Geçerli bir muadil markası seçmelisin." });

        var kodVar = await db.MuadilParfumler
            .IgnoreQueryFilters()
            .AnyAsync(m =>
                m.MarkaId == dto.MarkaId &&
                m.Kod.ToLower() == kod.ToLower() &&
                m.SilinmeTarihi == null &&
                (haricId == null || m.Id != haricId));
        if (kodVar)
            return Conflict(new { mesaj = $"{marka.Ad} markasında '{kod}' kodu zaten kullanılıyor." });

        return null;
    }
}