using Muadil.Domain.Entities;

namespace Muadil.Infrastructure.IceAktarma;

public record ParfumSatiri(
    int Satir, string Marka, string Ad, Cinsiyet Cinsiyet,
    IReadOnlyList<string> Ust, IReadOnlyList<string> Orta, IReadOnlyList<string> Alt);

public record MuadilSatiri(
    int Satir, string OrijinalMarka, string Parfum, string MuadilMarka,
    string Kod, Cinsiyet Cinsiyet, decimal Fiyat, int Kalicilik, int Benzerlik, string UrunLinki);

public record SatirHatasi(string Sayfa, int Satir, string Mesaj);

public record IceAktarmaOzeti(
    int YeniParfum, int GuncellenenParfum,
    int YeniMuadil, int GuncellenenMuadil,
    int YeniMarka, int YeniNota,
    IReadOnlyList<string> YeniMarkalar, IReadOnlyList<string> YeniNotalar);

public record IceAktarmaSonucu(IceAktarmaOzeti? Ozet, IReadOnlyList<SatirHatasi> Hatalar);
