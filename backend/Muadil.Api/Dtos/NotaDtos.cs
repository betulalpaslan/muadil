using System.ComponentModel.DataAnnotations;

namespace Muadil.Api.Dtos;

public record NotaDto(int Id, string Ad, string? GorselUrl, string? Aciklama);

public record NotaKaydetDto([Required, MaxLength(100)] string Ad, [MaxLength(500)] string? Aciklama = null);

// Toplu görsel yüklemede her dosyanın sonucu. Durum: "yuklendi", "eslesmedi" ya da "hatali".
public record TopluGorselSonucuDto(string Dosya, string Durum, string? Nota, string? Mesaj);