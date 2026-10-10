using System.Globalization;

namespace Muadil.Domain.Kurallar;

public static class Metin
{
    public static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");

    // Türkçe kurallarıyla büyük-küçük harf duyarsız karşılaştırma ("ışık" = "IŞIK")
    public static readonly StringComparer TrKarsilastirici = StringComparer.Create(Tr, ignoreCase: true);
}
