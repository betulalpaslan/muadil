using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DegerlendirmeBenzerlikKalicilik : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BenzerlikPuani",
                table: "Degerlendirmeler",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KalicilikPuani",
                table: "Degerlendirmeler",
                type: "integer",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Degerlendirme_Benzerlik",
                table: "Degerlendirmeler",
                sql: "\"BenzerlikPuani\" IS NULL OR \"BenzerlikPuani\" BETWEEN 1 AND 5");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Degerlendirme_Kalicilik",
                table: "Degerlendirmeler",
                sql: "\"KalicilikPuani\" IS NULL OR \"KalicilikPuani\" BETWEEN 1 AND 5");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Degerlendirme_Benzerlik",
                table: "Degerlendirmeler");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Degerlendirme_Kalicilik",
                table: "Degerlendirmeler");

            migrationBuilder.DropColumn(
                name: "BenzerlikPuani",
                table: "Degerlendirmeler");

            migrationBuilder.DropColumn(
                name: "KalicilikPuani",
                table: "Degerlendirmeler");
        }
    }
}
