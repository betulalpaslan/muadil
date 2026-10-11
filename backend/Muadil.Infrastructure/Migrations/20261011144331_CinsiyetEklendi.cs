using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CinsiyetEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod",
                table: "MuadilParfumler");

            migrationBuilder.AddColumn<int>(
                name: "Cinsiyet",
                table: "Parfumler",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "Cinsiyet",
                table: "MuadilParfumler",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            // Mad'in "A114 E" soneki, aynı markanın A114 kodunu kadın (Dior Addict) ve erkek (Stronger With You)
            // ürününde ayrı ayrı kullanmasının eski çözümüydü; artık gerçek sütun var, sonek kaldırılıyor.
            migrationBuilder.Sql(
                """
                UPDATE "MuadilParfumler" mp
                SET "Kod" = 'A114', "Cinsiyet" = 2
                FROM "Markalar" m
                WHERE mp."MarkaId" = m."Id" AND m."Ad" = 'Mad' AND mp."Kod" = 'A114 E';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod_Cinsiyet",
                table: "MuadilParfumler",
                columns: new[] { "MarkaId", "Kod", "Cinsiyet" },
                unique: true,
                filter: "\"SilinmeTarihi\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod_Cinsiyet",
                table: "MuadilParfumler");

            migrationBuilder.DropColumn(
                name: "Cinsiyet",
                table: "Parfumler");

            migrationBuilder.DropColumn(
                name: "Cinsiyet",
                table: "MuadilParfumler");

            migrationBuilder.CreateIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod",
                table: "MuadilParfumler",
                columns: new[] { "MarkaId", "Kod" },
                unique: true,
                filter: "\"SilinmeTarihi\" IS NULL");
        }
    }
}
