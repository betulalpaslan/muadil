
namespace Muadil.Domain.Entities;

public class Nota
{

    public int Id { get; set; }
    public string Ad { get; set; } = string.Empty;
    public string? GorselUrl { get; set; }
    public string? Aciklama { get; set; }

}
