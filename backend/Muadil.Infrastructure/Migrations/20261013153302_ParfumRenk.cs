using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ParfumRenk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Renk",
                table: "Parfumler",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Parfum_Renk",
                table: "Parfumler",
                sql: "\"Renk\" IS NULL OR \"Renk\" ~ '^#[0-9A-Fa-f]{6}$'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Parfum_Renk",
                table: "Parfumler");

            migrationBuilder.DropColumn(
                name: "Renk",
                table: "Parfumler");
        }
    }
}
