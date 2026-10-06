using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;

namespace Muadil.Api.Auth;

public class KeycloakRolDonusumu : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity is not ClaimsIdentity identity || !identity.IsAuthenticated)
            return Task.FromResult(principal);

        if (identity.HasClaim(c => c.Type == ClaimTypes.Role))
            return Task.FromResult(principal);

        var realmAccess = identity.FindFirst("realm_access")?.Value;
        if (realmAccess is null)
            return Task.FromResult(principal);

        using var json = JsonDocument.Parse(realmAccess);
        if (json.RootElement.TryGetProperty("roles", out var roller))
        {
            foreach (var rol in roller.EnumerateArray())
                identity.AddClaim(new Claim(ClaimTypes.Role, rol.GetString()!));
        }

        return Task.FromResult(principal);
    }
}