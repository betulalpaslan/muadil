using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Muadil.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NotaGorseliEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GorselUrl",
                table: "Notalar",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GorselUrl",
                table: "Notalar");
        }
    }
}
