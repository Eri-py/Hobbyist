using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hobbyist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPostMediaAndStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "IsDraft", table: "Posts");

            migrationBuilder.DropColumn(name: "MediaCount", table: "Posts");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Posts",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PublishedAt",
                table: "Posts",
                type: "timestamp with time zone",
                nullable: true
            );

            migrationBuilder.CreateTable(
                name: "PostMedia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    FileExtension = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    ByteSize = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostMedia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostMedia_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_PostMedia_PostId_Position",
                table: "PostMedia",
                columns: new[] { "PostId", "Position" }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PostMedia");

            migrationBuilder.DropColumn(name: "PublishedAt", table: "Posts");

            migrationBuilder.DropColumn(name: "Status", table: "Posts");

            migrationBuilder.AddColumn<int>(
                name: "MediaCount",
                table: "Posts",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "Posts",
                type: "boolean",
                nullable: false,
                defaultValue: false
            );
        }
    }
}
