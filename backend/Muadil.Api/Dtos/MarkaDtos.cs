using System.ComponentModel.DataAnnotations;
using Muadil.Domain.Entities;

namespace Muadil.Api.Dtos;

public record MarkaDto(int Id, string Ad, MarkaTuru Tur, string? GorselUrl);

public record MarkaKaydetDto(
    [Required, MaxLength(100)] string Ad,
    [EnumDataType(typeof(MarkaTuru))] MarkaTuru Tur);