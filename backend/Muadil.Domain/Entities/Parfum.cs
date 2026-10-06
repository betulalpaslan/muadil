namespace Muadil.Domain.Entities;

public class Parfum
{
    public int Id { get; set; }
    public string Ad { get; set; } = string.Empty;
    public decimal Fiyat50ml { get; set; }
    public string? GorselUrl { get; set; }
    public DateTime? SilinmeTarihi { get; set; }

    public int MarkaId { get; set; }
    public Marka Marka { get; set; } = null!;

    public List<MuadilParfum> Muadiller { get; set; } = new();
    public List<ParfumNota> Notalar { get; set; } = new();
}