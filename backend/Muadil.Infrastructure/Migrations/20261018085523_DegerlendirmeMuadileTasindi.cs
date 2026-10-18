using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DegerlendirmeMuadileTasindi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Eski kayıtlar orijinal parfüme verilmişti; muadile eşlenemez ve ParfumId yeniden adlandırılınca
            // yanlış muadile bağlanırdı. Kayıt varsa sessizce karıştırmak yerine durur.
            migrationBuilder.Sql(
                "DO $$ BEGIN IF EXISTS (SELECT 1 FROM \"Degerlendirmeler\") THEN " +
                "RAISE EXCEPTION 'Degerlendirmeler tablosunda parfum bazli kayitlar var; once elle temizle.'; " +
                "END IF; END $$;");

            migrationBuilder.DropForeignKey(
                name: "FK_Degerlendirmeler_Parfumler_ParfumId",
                table: "Degerlendirmeler");

            migrationBuilder.RenameColumn(
                name: "ParfumId",
                table: "Degerlendirmeler",
                newName: "MuadilParfumId");

            migrationBuilder.RenameIndex(
                name: "IX_Degerlendirmeler_ParfumId",
                table: "Degerlendirmeler",
                newName: "IX_Degerlendirmeler_MuadilParfumId");

            migrationBuilder.RenameIndex(
                name: "IX_Degerlendirmeler_KullaniciId_ParfumId",
                table: "Degerlendirmeler",
                newName: "IX_Degerlendirmeler_KullaniciId_MuadilParfumId");

            migrationBuilder.AddForeignKey(
                name: "FK_Degerlendirmeler_MuadilParfumler_MuadilParfumId",
                table: "Degerlendirmeler",
                column: "MuadilParfumId",
                principalTable: "MuadilParfumler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Degerlendirmeler_MuadilParfumler_MuadilParfumId",
                table: "Degerlendirmeler");

            migrationBuilder.RenameColumn(
                name: "MuadilParfumId",
                table: "Degerlendirmeler",
                newName: "ParfumId");

            migrationBuilder.RenameIndex(
                name: "IX_Degerlendirmeler_MuadilParfumId",
                table: "Degerlendirmeler",
                newName: "IX_Degerlendirmeler_ParfumId");

            migrationBuilder.RenameIndex(
                name: "IX_Degerlendirmeler_KullaniciId_MuadilParfumId",
                table: "Degerlendirmeler",
                newName: "IX_Degerlendirmeler_KullaniciId_ParfumId");

            migrationBuilder.AddForeignKey(
                name: "FK_Degerlendirmeler_Parfumler_ParfumId",
                table: "Degerlendirmeler",
                column: "ParfumId",
                principalTable: "Parfumler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
