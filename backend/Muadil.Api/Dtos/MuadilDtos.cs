using System.ComponentModel.DataAnnotations;

namespace Muadil.Api.Dtos;

public record MuadilDto(
    int Id,
    string Marka,
    string Kod,
    decimal Fiyat,
    int KalicilikPuani,
    int BenzerlikPuani,
    string UrunLinki);

public record MuadilKaydetDto(
    [Range(1, int.MaxValue)] int MarkaId,
    [Required, MaxLength(50)] string Kod,
    [Range(typeof(decimal), "1", "100000")] decimal Fiyat,
    [Required, MaxLength(500), Url] string UrunLinki,
    [Range(1, 10)] int KalicilikPuani,
    [Range(1, 10)] int BenzerlikPuani);