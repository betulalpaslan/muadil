using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Dtos;
using Muadil.Domain.Entities;
using Muadil.Domain.Kurallar;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

[ApiController]
[Route("api/notalar")]
public class NotalarController(MuadilDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NotaDto>>> Listele() =>
        await db.Notalar.AsNoTracking()
            .OrderBy(n => n.Ad)
            .Select(n => new NotaDto(n.Id, n.Ad))
            .ToListAsync();

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<ActionResult<NotaDto>> Ekle(NotaKaydetDto dto)
    {
        var ad = NotaAdi.Normalize(dto.Ad);
        if (await AdKullaniliyor(ad))
            return Conflict(new { mesaj = $"'{ad}' notası zaten var." });

        var nota = new Nota { Ad = ad };
        db.Notalar.Add(nota);
        await db.SaveChangesAsync();
        return Created($"/api/notalar/{nota.Id}", new NotaDto(nota.Id, nota.Ad));
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
        await db.SaveChangesAsync();
        return NoContent();
    }

    private Task<bool> AdKullaniliyor(string ad, int? haricId = null) =>
        db.Notalar.AnyAsync(n => n.Ad.ToLower() == ad.ToLower() && (haricId == null || n.Id != haricId));
}
