using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FavoriVeDegerlendirme : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Degerlendirmeler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KullaniciId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    KullaniciAdi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Puan = table.Column<int>(type: "integer", nullable: false),
                    Yorum = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    OlusturmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    GuncellemeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SilinmeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParfumId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Degerlendirmeler", x => x.Id);
                    table.CheckConstraint("CK_Degerlendirme_Puan", "\"Puan\" BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "FK_Degerlendirmeler_Parfumler_ParfumId",
                        column: x => x.ParfumId,
                        principalTable: "Parfumler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Favoriler",
                columns: table => new
                {
                    KullaniciId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ParfumId = table.Column<int>(type: "integer", nullable: false),
                    EklenmeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favoriler", x => new { x.KullaniciId, x.ParfumId });
                    table.ForeignKey(
                        name: "FK_Favoriler_Parfumler_ParfumId",
                        column: x => x.ParfumId,
                        principalTable: "Parfumler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Degerlendirmeler_KullaniciId_ParfumId",
                table: "Degerlendirmeler",
                columns: new[] { "KullaniciId", "ParfumId" },
                unique: true,
                filter: "\"SilinmeTarihi\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Degerlendirmeler_ParfumId",
                table: "Degerlendirmeler",
                column: "ParfumId");

            migrationBuilder.CreateIndex(
                name: "IX_Favoriler_ParfumId",
                table: "Favoriler",
                column: "ParfumId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Degerlendirmeler");

            migrationBuilder.DropTable(
                name: "Favoriler");
        }
    }
}
