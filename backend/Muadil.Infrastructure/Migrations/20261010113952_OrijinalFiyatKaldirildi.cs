using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class OrijinalFiyatKaldirildi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod",
                table: "MuadilParfumler");

            migrationBuilder.DropColumn(
                name: "Fiyat50ml",
                table: "Parfumler");

            migrationBuilder.CreateIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod",
                table: "MuadilParfumler",
                columns: new[] { "MarkaId", "Kod" },
                unique: true,
                filter: "\"SilinmeTarihi\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod",
                table: "MuadilParfumler");

            migrationBuilder.AddColumn<decimal>(
                name: "Fiyat50ml",
                table: "Parfumler",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod",
                table: "MuadilParfumler",
                columns: new[] { "MarkaId", "Kod" },
                unique: true);
        }
    }
}
