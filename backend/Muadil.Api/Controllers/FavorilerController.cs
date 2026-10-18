using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Muadil.Api.Auth;
using Muadil.Api.Dtos;
using Muadil.Domain.Entities;
using Muadil.Infrastructure.Persistence;

namespace Muadil.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/favoriler")]
public class FavorilerController(MuadilDbContext db) : ControllerBase
{
    // Giriş yapmış kullanıcının favorileri, en son eklenen başta.
    [HttpGet]
    public async Task<ActionResult<List<ParfumListeDto>>> Listele()
    {
        var kullaniciId = User.KullaniciId();
        if (kullaniciId is null) return Unauthorized();

        return await db.Favoriler.AsNoTracking()
            .Where(f => f.KullaniciId == kullaniciId)
            .OrderByDescending(f => f.EklenmeTarihi)
            .Select(f => f.Parfum)
            .Select(ParfumProjeksiyonlari.Liste)
            .ToListAsync();
    }

    // Idempotent: zaten favorideyse de başarılı döner.
    [HttpPut("{parfumId:int}")]
    public async Task<IActionResult> Ekle(int parfumId)
    {
        var kullaniciId = User.KullaniciId();
        if (kullaniciId is null) return Unauthorized();

        if (!await db.Parfumler.AnyAsync(p => p.Id == parfumId))
            return NotFound();

        if (await db.Favoriler.AnyAsync(f => f.KullaniciId == kullaniciId && f.ParfumId == parfumId))
            return NoContent();

        db.Favoriler.Add(new Favori { KullaniciId = kullaniciId, ParfumId = parfumId, EklenmeTarihi = DateTime.UtcNow });
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Eşzamanlı çift istekte kayıt zaten vardır; başka bir nedenle düştüyse hatayı yükselt
            if (!await db.Favoriler.AnyAsync(f => f.KullaniciId == kullaniciId && f.ParfumId == parfumId))
                throw;
        }
        return NoContent();
    }

    [HttpDelete("{parfumId:int}")]
    public async Task<IActionResult> Cikar(int parfumId)
    {
        var kullaniciId = User.KullaniciId();
        if (kullaniciId is null) return Unauthorized();

        // Silinmiş parfümün favorisi de kaldırılabilsin diye sorgu filtresi atlanır
        await db.Favoriler.IgnoreQueryFilters()
            .Where(f => f.KullaniciId == kullaniciId && f.ParfumId == parfumId)
            .ExecuteDeleteAsync();
        return NoContent();
    }
}
