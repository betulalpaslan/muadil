using System.Security.Claims;

namespace Muadil.Api.Auth;

public static class KullaniciBilgisi
{
    // Keycloak kullanıcı kimliği (token'daki "sub"). Gelen claim eşlemesi açıksa NameIdentifier'a, kapalıysa "sub"a düşer.
    public static string? KullaniciId(this ClaimsPrincipal kullanici) =>
        kullanici.FindFirstValue(ClaimTypes.NameIdentifier) ?? kullanici.FindFirstValue("sub");

    public static string KullaniciAdi(this ClaimsPrincipal kullanici) =>
        kullanici.FindFirstValue("preferred_username") ?? kullanici.Identity?.Name ?? "kullanıcı";
}
