using System.ComponentModel.DataAnnotations;

namespace Muadil.Api.Dtos;

public record NotaDto(int Id, string Ad);

public record NotaKaydetDto([Required, MaxLength(100)] string Ad);