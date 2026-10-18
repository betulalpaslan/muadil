namespace Muadil.Domain.Entities;

// Kullanıcının bir muadile verdiği 1-5 puan ve isteğe bağlı yorumu. Kullanıcı başına muadil başına tek kayıt.
// Editörün muadil puanlarından (benzerlik/kalıcılık, 1-10) ayrıdır.
public class Degerlendirme
{
    public int Id { get; set; }

    public string KullaniciId { get; set; } = string.Empty;
    // Yorumda gösterilen ad; Keycloak'a her listelemede gitmemek için yazıldığı andaki kullanıcı adı saklanır.
    public string KullaniciAdi { get; set; } = string.Empty;

    // Genel puan zorunlu; benzerlik ve kalıcılık isteğe bağlıdır (hepsi 1-5).
    public int Puan { get; set; }
    public int? BenzerlikPuani { get; set; }
    public int? KalicilikPuani { get; set; }
    public string? Yorum { get; set; }

    public DateTime OlusturmaTarihi { get; set; }
    public DateTime? GuncellemeTarihi { get; set; }
    public DateTime? SilinmeTarihi { get; set; }

    public int MuadilParfumId { get; set; }
    public MuadilParfum MuadilParfum { get; set; } = null!;
}
