using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Muadil.Infrastructure.IceAktarma;

namespace Muadil.Api.Controllers;

[ApiController]
[Route("api/ice-aktarma")]
[Authorize(Roles = "admin")]
public class IceAktarmaController(IceAktarmaServisi servis) : ControllerBase
{
    private const long MaksBoyut = 5 * 1024 * 1024;

    // onizleme=true: kontrol eder ve özeti döner, hiçbir şey kaydetmez
    [HttpPost]
    [RequestSizeLimit(MaksBoyut)]
    public async Task<IActionResult> Yukle(IFormFile dosya, [FromQuery] bool onizleme, CancellationToken ct)
    {
        if (!Path.GetExtension(dosya.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { mesaj = "Yalnızca .xlsx dosyası yüklenebilir." });

        using var bellek = new MemoryStream();
        await dosya.CopyToAsync(bellek, ct);
        bellek.Position = 0;

        var okuma = ExcelOkuyucu.Oku(bellek);
        if (okuma.Hatalar.Count > 0)
            return BadRequest(new { mesaj = "Dosyada düzeltilmesi gereken satırlar var.", hatalar = okuma.Hatalar });

        if (okuma.Parfumler.Count == 0 && okuma.Muadiller.Count == 0)
            return BadRequest(new { mesaj = "Dosyada yüklenecek satır bulunamadı." });

        var sonuc = await servis.UygulaAsync(okuma.Parfumler, okuma.Muadiller, kaydet: !onizleme, ct);
        if (sonuc.Ozet is null)
            return BadRequest(new { mesaj = "Dosyada düzeltilmesi gereken satırlar var.", hatalar = sonuc.Hatalar });

        return Ok(sonuc.Ozet);
    }
}
