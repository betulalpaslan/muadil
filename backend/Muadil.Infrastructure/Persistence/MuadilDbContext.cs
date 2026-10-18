using Microsoft.EntityFrameworkCore;
using Muadil.Domain.Entities;

namespace Muadil.Infrastructure.Persistence;

public class MuadilDbContext(DbContextOptions<MuadilDbContext> options) : DbContext(options)
{
    public DbSet<Marka> Markalar => Set<Marka>();
    public DbSet<Parfum> Parfumler => Set<Parfum>();
    public DbSet<MuadilParfum> MuadilParfumler => Set<MuadilParfum>();
    public DbSet<Nota> Notalar => Set<Nota>();
    public DbSet<ParfumNota> ParfumNotalar => Set<ParfumNota>();
    public DbSet<Favori> Favoriler => Set<Favori>();
    public DbSet<Degerlendirme> Degerlendirmeler => Set<Degerlendirme>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Marka>(e =>
        {
            e.Property(x => x.Ad).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Ad).IsUnique();
        });

        modelBuilder.Entity<Nota>(e =>
        {
            e.Property(x => x.Ad).HasMaxLength(100).IsRequired();
            e.Property(x => x.Aciklama).HasMaxLength(500);
            e.HasIndex(x => x.Ad).IsUnique();
        });

        modelBuilder.Entity<Parfum>(e =>
        {
            e.Property(x => x.Ad).HasMaxLength(200).IsRequired();
            e.Property(x => x.Cinsiyet).HasDefaultValue(Cinsiyet.Unisex);
            e.Property(x => x.Renk).HasMaxLength(7);
            e.HasOne(x => x.Marka).WithMany()
                .HasForeignKey(x => x.MarkaId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => x.SilinmeTarihi == null);
            e.ToTable(t => t.HasCheckConstraint("CK_Parfum_Renk", "\"Renk\" IS NULL OR \"Renk\" ~ '^#[0-9A-Fa-f]{6}$'"));
        });

        modelBuilder.Entity<MuadilParfum>(e =>
        {
            e.Property(x => x.Kod).HasMaxLength(50).IsRequired();
            e.Property(x => x.Cinsiyet).HasDefaultValue(Cinsiyet.Unisex);
            e.Property(x => x.UrunLinki).HasMaxLength(500).IsRequired();
            e.Property(x => x.Fiyat).HasPrecision(10, 2);
            e.HasOne(x => x.Parfum).WithMany(p => p.Muadiller)
                .HasForeignKey(x => x.ParfumId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Marka).WithMany()
                .HasForeignKey(x => x.MarkaId)
                .OnDelete(DeleteBehavior.Restrict);
            // Aynı marka aynı kodu kadın/erkek için ayrı ayrı kullanabilir (ör. Mad A114); cinsiyet de anahtarın parçası
            e.HasIndex(x => new { x.MarkaId, x.Kod, x.Cinsiyet }).IsUnique()
                .HasFilter("\"SilinmeTarihi\" IS NULL");
            e.HasQueryFilter(x => x.SilinmeTarihi == null && x.Parfum.SilinmeTarihi == null);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Muadil_Kalicilik", "\"KalicilikPuani\" BETWEEN 1 AND 10");
                t.HasCheckConstraint("CK_Muadil_Benzerlik", "\"BenzerlikPuani\" BETWEEN 1 AND 10");
            });
        });

        modelBuilder.Entity<ParfumNota>(e =>
        {
            e.HasKey(x => new { x.ParfumId, x.NotaId });
            e.HasOne(x => x.Parfum).WithMany(p => p.Notalar)
                .HasForeignKey(x => x.ParfumId);
            e.HasOne(x => x.Nota).WithMany()
                .HasForeignKey(x => x.NotaId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => x.Parfum.SilinmeTarihi == null);
        });

        modelBuilder.Entity<Favori>(e =>
        {
            e.HasKey(x => new { x.KullaniciId, x.ParfumId });
            e.Property(x => x.KullaniciId).HasMaxLength(64);
            e.HasOne(x => x.Parfum).WithMany()
                .HasForeignKey(x => x.ParfumId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(x => x.Parfum.SilinmeTarihi == null);
        });

        modelBuilder.Entity<Degerlendirme>(e =>
        {
            e.Property(x => x.KullaniciId).HasMaxLength(64).IsRequired();
            e.Property(x => x.KullaniciAdi).HasMaxLength(100).IsRequired();
            e.Property(x => x.Yorum).HasMaxLength(1000);
            e.HasOne(x => x.MuadilParfum).WithMany(m => m.Degerlendirmeler)
                .HasForeignKey(x => x.MuadilParfumId)
                .OnDelete(DeleteBehavior.Cascade);
            // Bir kullanıcı bir muadili bir kez değerlendirir; silinen kayıt yeniden değerlendirmeyi engellemez
            e.HasIndex(x => new { x.KullaniciId, x.MuadilParfumId }).IsUnique()
                .HasFilter("\"SilinmeTarihi\" IS NULL");
            e.HasIndex(x => x.MuadilParfumId);
            e.HasQueryFilter(x => x.SilinmeTarihi == null && x.MuadilParfum.SilinmeTarihi == null && x.MuadilParfum.Parfum.SilinmeTarihi == null);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Degerlendirme_Puan", "\"Puan\" BETWEEN 1 AND 5");
                t.HasCheckConstraint("CK_Degerlendirme_Benzerlik", "\"BenzerlikPuani\" IS NULL OR \"BenzerlikPuani\" BETWEEN 1 AND 5");
                t.HasCheckConstraint("CK_Degerlendirme_Kalicilik", "\"KalicilikPuani\" IS NULL OR \"KalicilikPuani\" BETWEEN 1 AND 5");
            });
        });
    }
}
