using Muadil.Domain.Abstractions;

namespace Muadil.Infrastructure.Storage;

public class DiskGorselDeposu : IGorselDeposu
{
    private readonly string _klasor;
    private readonly string _temelUrl;

    public DiskGorselDeposu(string klasor, string temelUrl)
    {
        _klasor = klasor;
        _temelUrl = temelUrl.TrimEnd('/');
        Directory.CreateDirectory(_klasor);
    }

    public async Task<string> KaydetAsync(Stream icerik, string uzanti, CancellationToken ct = default)
    {
        var dosyaAdi = $"{Guid.NewGuid():N}{uzanti}";
        await using var hedef = File.Create(Path.Combine(_klasor, dosyaAdi));
        await icerik.CopyToAsync(hedef, ct);
        return $"{_temelUrl}/{dosyaAdi}";
    }

    public Task SilAsync(string adres, CancellationToken ct = default)
    {
        if (!adres.StartsWith(_temelUrl + "/"))
            return Task.CompletedTask;

        var yol = Path.Combine(_klasor, Path.GetFileName(adres));
        if (File.Exists(yol))
            File.Delete(yol);
        return Task.CompletedTask;
    }
}