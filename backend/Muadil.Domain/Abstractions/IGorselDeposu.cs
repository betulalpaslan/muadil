namespace Muadil.Domain.Abstractions;

public interface IGorselDeposu
{
    Task<string> KaydetAsync(Stream icerik, string uzanti, CancellationToken ct = default);
    Task SilAsync(string adres, CancellationToken ct = default);
}