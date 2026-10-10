using System.ComponentModel.DataAnnotations;
using Muadil.Domain.Entities;

namespace Muadil.Api.Dtos;

// Okuma
public record ParfumListeDto(int Id, string Ad, string Marka, decimal Fiyat50ml, string? GorselUrl);

public record ParfumNotaDto(int NotaId, string NotaAd, NotaKatmani Katman);

public record ParfumDetayDto(
    int Id, string Ad, int MarkaId, string Marka,
    decimal Fiyat50ml, string? GorselUrl,
    List<ParfumNotaDto> Notalar, List<MuadilDto> Muadiller);

// Yazma
public record ParfumNotaKaydetDto(
    int NotaId,
    [EnumDataType(typeof(NotaKatmani))] NotaKatmani Katman);

public record ParfumKaydetDto(
    [Required, MaxLength(200)] string Ad,
    [Range(1, int.MaxValue)] int MarkaId,
    [Range(typeof(decimal), "1", "100000")] decimal Fiyat50ml,
    [Required, MinLength(1)] List<ParfumNotaKaydetDto> Notalar);