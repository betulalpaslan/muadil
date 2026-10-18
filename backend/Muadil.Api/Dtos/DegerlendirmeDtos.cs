using System.ComponentModel.DataAnnotations;

namespace Muadil.Api.Dtos;

// Okuma
public record DegerlendirmeDto(
    int Id, string KullaniciAdi, int Puan, int? BenzerlikPuani, int? KalicilikPuani,
    string? Yorum, DateTime Tarih, bool BenimMi);

// Benim: giriş yapmış kullanıcının bu muadildeki kendi kaydı (liste son 100 ile sınırlı olduğundan ayrıca verilir)
// Benzerlik/Kalicilik ortalamaları yalnız o puanı vermiş kullanıcılar üzerinden alınır.
public record DegerlendirmeOzetiDto(
    double? Ortalama, double? BenzerlikOrtalamasi, double? KalicilikOrtalamasi, int Sayi,
    DegerlendirmeDto? Benim, List<DegerlendirmeDto> Degerlendirmeler);

// Yazma
public record DegerlendirmeKaydetDto(
    [Range(1, 5)] int Puan,
    [Range(1, 5)] int? BenzerlikPuani = null,
    [Range(1, 5)] int? KalicilikPuani = null,
    [MaxLength(1000)] string? Yorum = null);
