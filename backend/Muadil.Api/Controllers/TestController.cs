using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Muadil.Api.Controllers;

[ApiController]
[Route("api/test")]
public class TestController : ControllerBase
{
    [HttpGet("herkes")]
    public IActionResult Herkes() =>
        Ok(new { mesaj = "Bu endpoint herkese açık" });

    [Authorize]
    [HttpGet("giris")]
    public IActionResult Giris() =>
        Ok(new
        {
            mesaj = $"Merhaba {User.Identity?.Name}",
            roller = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
        });

    [Authorize(Roles = "admin")]
    [HttpGet("admin")]
    public IActionResult Admin() =>
        Ok(new { mesaj = "Admin alanına hoş geldin" });
}