namespace Muadil.Domain.Entities;

public class MuadilParfum
{
    public int Id { get; set; }
    public string Kod { get; set; } = string.Empty;
    public decimal Fiyat { get; set; }
    public string UrunLinki { get; set; } = string.Empty;
    public int KalicilikPuani { get; set; }
    public int BenzerlikPuani { get; set; }
    public DateTime? SilinmeTarihi { get; set; }

    public int ParfumId { get; set; }
    public Parfum Parfum { get; set; } = null!;

    public int MarkaId { get; set; }
    public Marka Marka { get; set; } = null!;
}