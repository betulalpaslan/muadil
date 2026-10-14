using System.ComponentModel.DataAnnotations;
using Muadil.Domain.Entities;

namespace Muadil.Api.Dtos;

public record MuadilDto(
    int Id,
    string Marka,
    string? MarkaGorselUrl,
    string Kod,
    Cinsiyet Cinsiyet,
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
    [Range(1, 10)] int BenzerlikPuani,
    [EnumDataType(typeof(Cinsiyet))] Cinsiyet Cinsiyet = Cinsiyet.Unisex);