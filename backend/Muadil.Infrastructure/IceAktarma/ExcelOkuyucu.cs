using System.Globalization;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Muadil.Domain.Kurallar;

namespace Muadil.Infrastructure.IceAktarma;

public class ExcelOkumaSonucu
{
    public List<ParfumSatiri> Parfumler { get; } = [];
    public List<MuadilSatiri> Muadiller { get; } = [];
    public List<SatirHatasi> Hatalar { get; } = [];
}

// Yalnızca dosyayı okur ve satır biçimini kontrol eder. Veritabanını bilmez.
public static class ExcelOkuyucu
{
    public const string ParfumSayfasi = "Parfümler";
    public const string MuadilSayfasi = "Muadiller";

    // "4200", "4200,50" ya da "4200.50"; binlik ayırıcıya izin yok (yanlış okunmasın)
    private static readonly Regex FiyatDeseni = new(@"^\d+([.,]\d{1,2})?$", RegexOptions.Compiled);

    public static ExcelOkumaSonucu Oku(Stream akis)
    {
        var sonuc = new ExcelOkumaSonucu();
        XLWorkbook kitap;
        try
        {
            kitap = new XLWorkbook(akis);
        }
        catch (Exception)
        {
            sonuc.Hatalar.Add(new("Dosya", 0, "Dosya okunamadı. Şablondaki gibi bir .xlsx dosyası yükle."));
            return sonuc;
        }

        using (kitap)
        {
            var parfumVar = kitap.TryGetWorksheet(ParfumSayfasi, out var parfumSayfasi);
            var muadilVar = kitap.TryGetWorksheet(MuadilSayfasi, out var muadilSayfasi);

            if (!parfumVar && !muadilVar)
            {
                sonuc.Hatalar.Add(new("Dosya", 0, $"\"{ParfumSayfasi}\" ve \"{MuadilSayfasi}\" sayfaları bulunamadı. Şablonu kullan."));
                return sonuc;
            }

            if (parfumVar) ParfumleriOku(parfumSayfasi!, sonuc);
            if (muadilVar) MuadilleriOku(muadilSayfasi!, sonuc);
        }

        return sonuc;
    }

    private static void ParfumleriOku(IXLWorksheet sayfa, ExcelOkumaSonucu sonuc)
    {
        foreach (var satir in sayfa.RowsUsed().Where(r => r.RowNumber() > 1))
        {
            string Hucre(int sutun) => satir.Cell(sutun).GetString().Trim();
            if (Enumerable.Range(1, 5).All(s => Hucre(s) == "")) continue;

            var hatalar = new List<string>();
            var marka = Hucre(1);
            var ad = Hucre(2);
            var ust = Notalar(Hucre(3));
            var orta = Notalar(Hucre(4));
            var alt = Notalar(Hucre(5));
            var hepsi = ust.Concat(orta).Concat(alt).ToList();

            if (marka == "") hatalar.Add("Marka boş.");
            else if (marka.Length > 100) hatalar.Add("Marka adı en fazla 100 karakter olabilir.");
            if (ad == "") hatalar.Add("Parfüm adı boş.");
            else if (ad.Length > 200) hatalar.Add("Parfüm adı en fazla 200 karakter olabilir.");
            if (hepsi.Count == 0) hatalar.Add("En az bir nota girilmeli.");
            if (hepsi.Any(n => n.Length > 100)) hatalar.Add("Nota adları en fazla 100 karakter olabilir.");

            var tekrarlar = hepsi.GroupBy(n => n, Metin.TrKarsilastirici).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
            if (tekrarlar.Count > 0) hatalar.Add($"Aynı nota birden fazla katmanda: {string.Join(", ", tekrarlar)}.");

            if (hatalar.Count > 0)
                sonuc.Hatalar.AddRange(hatalar.Select(h => new SatirHatasi(ParfumSayfasi, satir.RowNumber(), h)));
            else
                sonuc.Parfumler.Add(new ParfumSatiri(satir.RowNumber(), marka, ad, ust, orta, alt));
        }
    }

    private static void MuadilleriOku(IXLWorksheet sayfa, ExcelOkumaSonucu sonuc)
    {
        foreach (var satir in sayfa.RowsUsed().Where(r => r.RowNumber() > 1))
        {
            string Hucre(int sutun) => satir.Cell(sutun).GetString().Trim();
            if (Enumerable.Range(1, 8).All(s => Hucre(s) == "")) continue;

            var hatalar = new List<string>();
            var orijinalMarka = Hucre(1);
            var parfum = Hucre(2);
            var muadilMarka = Hucre(3);
            var kod = Hucre(4);
            var fiyat = Fiyat(satir.Cell(5));
            var kalicilik = Tamsayi(satir.Cell(6));
            var benzerlik = Tamsayi(satir.Cell(7));
            var link = Hucre(8);

            if (orijinalMarka == "") hatalar.Add("Orijinal marka boş.");
            if (parfum == "") hatalar.Add("Parfüm adı boş.");
            if (muadilMarka == "") hatalar.Add("Muadil marka boş.");
            else if (muadilMarka.Length > 100) hatalar.Add("Muadil marka adı en fazla 100 karakter olabilir.");
            if (kod == "") hatalar.Add("Kod boş.");
            else if (kod.Length > 50) hatalar.Add("Kod en fazla 50 karakter olabilir.");
            if (fiyat is null or < 1m or > 100000m) hatalar.Add("Fiyat 1 ile 100000 arasında olmalı (ör. 650 ya da 650,50).");
            if (kalicilik is null or < 1 or > 10) hatalar.Add("Kalıcılık 1 ile 10 arasında bir tam sayı olmalı.");
            if (benzerlik is null or < 1 or > 10) hatalar.Add("Benzerlik 1 ile 10 arasında bir tam sayı olmalı.");
            if (!GecerliLink(link)) hatalar.Add("Ürün linki https:// ile başlayan geçerli bir adres olmalı.");

            if (hatalar.Count > 0)
                sonuc.Hatalar.AddRange(hatalar.Select(h => new SatirHatasi(MuadilSayfasi, satir.RowNumber(), h)));
            else
                sonuc.Muadiller.Add(new MuadilSatiri(
                    satir.RowNumber(), orijinalMarka, parfum, muadilMarka, kod,
                    fiyat!.Value, kalicilik!.Value, benzerlik!.Value, link));
        }
    }

    private static List<string> Notalar(string metin) =>
        metin.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(NotaAdi.Normalize)
            .Where(n => n != "")
            .Distinct(Metin.TrKarsilastirici)
            .ToList();

    private static decimal? Fiyat(IXLCell hucre)
    {
        if (hucre.DataType == XLDataType.Number)
            return Math.Round((decimal)hucre.GetDouble(), 2);

        var metin = hucre.GetString().Replace("₺", "").Replace("TL", "", StringComparison.OrdinalIgnoreCase).Trim();
        if (!FiyatDeseni.IsMatch(metin)) return null;
        return decimal.Parse(metin.Replace(',', '.'), CultureInfo.InvariantCulture);
    }

    private static int? Tamsayi(IXLCell hucre)
    {
        if (hucre.DataType == XLDataType.Number)
        {
            var d = hucre.GetDouble();
            return d == Math.Floor(d) ? (int)d : null;
        }
        return int.TryParse(hucre.GetString().Trim(), out var sayi) ? sayi : null;
    }

    private static bool GecerliLink(string link) =>
        link.Length <= 500 &&
        Uri.TryCreate(link, UriKind.Absolute, out var adres) &&
        (adres.Scheme == Uri.UriSchemeHttps || adres.Scheme == Uri.UriSchemeHttp);
}
