
namespace Muadil.Domain.Entities;

public class Marka
{
    public int Id { get; set; }
    public string Ad { get; set; }=string.Empty;
    public MarkaTuru Tur { get; set; }

}