using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using Muadil.Domain.Entities;

namespace Muadil.Api.Dtos;

// Okuma
public record MuadilOzetDto(string Marka, string Kod, decimal Fiyat);
public record RenkAlgilamaSonucuDto(int Id, string Ad, string Renk);

public record ParfumListeDto(
    int Id, string Ad, string Marka, string? GorselUrl, string? Renk,
    int MuadilSayisi, decimal? EnUygunMuadil, List<MuadilOzetDto> MuadilOzetleri);

public static class ParfumProjeksiyonlari
{
    // Parfüm listesi satırı; parfümler ve favoriler listesi aynı şekli kullanır.
    public static readonly Expression<Func<Parfum, ParfumListeDto>> Liste = p => new ParfumListeDto(
        p.Id, p.Ad, p.Marka.Ad, p.GorselUrl, p.Renk,
        p.Muadiller.Count(),
        p.Muadiller.Min(m => (decimal?)m.Fiyat),
        p.Muadiller
            .OrderBy(m => m.Fiyat)
            .Select(m => new MuadilOzetDto(m.Marka.Ad, m.Kod, m.Fiyat))
            .ToList());
}

public record ParfumNotaDto(int NotaId, string NotaAd, NotaKatmani Katman, string? GorselUrl, string? Aciklama);

public record ParfumDetayDto(
    int Id, string Ad, Cinsiyet Cinsiyet, int MarkaId, string Marka, string? GorselUrl, string? Renk,
    List<ParfumNotaDto> Notalar, List<MuadilDto> Muadiller);

// Yazma
public record ParfumNotaKaydetDto(
    int NotaId,
    [EnumDataType(typeof(NotaKatmani))] NotaKatmani Katman);

public record ParfumKaydetDto(
    [Required, MaxLength(200)] string Ad,
    [Range(1, int.MaxValue)] int MarkaId,
    [Required, MinLength(1)] List<ParfumNotaKaydetDto> Notalar,
    [EnumDataType(typeof(Cinsiyet))] Cinsiyet Cinsiyet = Cinsiyet.Unisex,
    [MaxLength(7), RegularExpression("^#[0-9A-Fa-f]{6}$")] string? Renk = null);
