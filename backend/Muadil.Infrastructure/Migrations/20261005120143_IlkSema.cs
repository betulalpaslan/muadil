using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class IlkSema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Markalar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Tur = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Markalar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notalar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notalar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Parfumler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ad = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Fiyat50ml = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    GorselUrl = table.Column<string>(type: "text", nullable: true),
                    SilinmeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MarkaId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parfumler", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Parfumler_Markalar_MarkaId",
                        column: x => x.MarkaId,
                        principalTable: "Markalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MuadilParfumler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Kod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Fiyat = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    UrunLinki = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    KalicilikPuani = table.Column<int>(type: "integer", nullable: false),
                    BenzerlikPuani = table.Column<int>(type: "integer", nullable: false),
                    SilinmeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParfumId = table.Column<int>(type: "integer", nullable: false),
                    MarkaId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MuadilParfumler", x => x.Id);
                    table.CheckConstraint("CK_Muadil_Benzerlik", "\"BenzerlikPuani\" BETWEEN 1 AND 10");
                    table.CheckConstraint("CK_Muadil_Kalicilik", "\"KalicilikPuani\" BETWEEN 1 AND 10");
                    table.ForeignKey(
                        name: "FK_MuadilParfumler_Markalar_MarkaId",
                        column: x => x.MarkaId,
                        principalTable: "Markalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MuadilParfumler_Parfumler_ParfumId",
                        column: x => x.ParfumId,
                        principalTable: "Parfumler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ParfumNotalar",
                columns: table => new
                {
                    ParfumId = table.Column<int>(type: "integer", nullable: false),
                    NotaId = table.Column<int>(type: "integer", nullable: false),
                    Katman = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParfumNotalar", x => new { x.ParfumId, x.NotaId });
                    table.ForeignKey(
                        name: "FK_ParfumNotalar_Notalar_NotaId",
                        column: x => x.NotaId,
                        principalTable: "Notalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ParfumNotalar_Parfumler_ParfumId",
                        column: x => x.ParfumId,
                        principalTable: "Parfumler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Markalar_Ad",
                table: "Markalar",
                column: "Ad",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MuadilParfumler_MarkaId_Kod",
                table: "MuadilParfumler",
                columns: new[] { "MarkaId", "Kod" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MuadilParfumler_ParfumId",
                table: "MuadilParfumler",
                column: "ParfumId");

            migrationBuilder.CreateIndex(
                name: "IX_Notalar_Ad",
                table: "Notalar",
                column: "Ad",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Parfumler_MarkaId",
                table: "Parfumler",
                column: "MarkaId");

            migrationBuilder.CreateIndex(
                name: "IX_ParfumNotalar_NotaId",
                table: "ParfumNotalar",
                column: "NotaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MuadilParfumler");

            migrationBuilder.DropTable(
                name: "ParfumNotalar");

            migrationBuilder.DropTable(
                name: "Notalar");

            migrationBuilder.DropTable(
                name: "Parfumler");

            migrationBuilder.DropTable(
                name: "Markalar");
        }
    }
}
