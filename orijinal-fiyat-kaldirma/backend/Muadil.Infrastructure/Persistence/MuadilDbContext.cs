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
            e.HasIndex(x => x.Ad).IsUnique();
        });

        modelBuilder.Entity<Parfum>(e =>
        {
            e.Property(x => x.Ad).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Marka).WithMany()
                .HasForeignKey(x => x.MarkaId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => x.SilinmeTarihi == null);
        });

        modelBuilder.Entity<MuadilParfum>(e =>
        {
            e.Property(x => x.Kod).HasMaxLength(50).IsRequired();
            e.Property(x => x.UrunLinki).HasMaxLength(500).IsRequired();
            e.Property(x => x.Fiyat).HasPrecision(10, 2);
            e.HasOne(x => x.Parfum).WithMany(p => p.Muadiller)
                .HasForeignKey(x => x.ParfumId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Marka).WithMany()
                .HasForeignKey(x => x.MarkaId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.MarkaId, x.Kod }).IsUnique()
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
    }
}
