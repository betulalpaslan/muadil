namespace Muadil.Domain.Entities;

// Kullanıcının favori parfümü. Kullanıcı Keycloak'ta tutulur; burada yalnızca token'daki "sub" değeri saklanır.
public class Favori
{
    public string KullaniciId { get; set; } = string.Empty;

    public int ParfumId { get; set; }
    public Parfum Parfum { get; set; } = null!;

    public DateTime EklenmeTarihi { get; set; }
}
