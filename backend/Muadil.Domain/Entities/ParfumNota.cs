namespace Muadil.Domain.Entities;

public class ParfumNota
{
    public int ParfumId { get; set; }
    public Parfum Parfum { get; set; } = null!;

    public int NotaId { get; set; }
    public Nota Nota { get; set; } = null!;

    public NotaKatmani Katman { get; set; }
}