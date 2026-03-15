using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Hobbyist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHobbies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Hobbies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hobbies", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "UserHobbies",
                columns: table => new
                {
                    HobbiesId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsersId = table.Column<Guid>(type: "uuid", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserHobbies", x => new { x.HobbiesId, x.UsersId });
                    table.ForeignKey(
                        name: "FK_UserHobbies_Hobbies_HobbiesId",
                        column: x => x.HobbiesId,
                        principalTable: "Hobbies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_UserHobbies_Users_UsersId",
                        column: x => x.UsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.InsertData(
                table: "Hobbies",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { new Guid("19da3f2b-736f-436b-84de-7d930c3f56fb"), "sneakers" },
                    { new Guid("1d3b89e5-3fc0-4f6c-bded-53afe9946f0a"), "coins" },
                    { new Guid("2f7a4f09-c6b7-42dd-a646-b6f36e25b0c1"), "trading cards" },
                    { new Guid("3fcd0f37-9401-43fb-b9ad-f5734b396497"), "antique maps" },
                    { new Guid("5d22fd82-f357-45dc-be7b-1a22ff13d9d0"), "minerals" },
                    { new Guid("5e4a94f2-a021-48ab-b2c0-a79a6d6ff43d"), "art prints" },
                    { new Guid("6e662a47-fde0-4546-ac66-bf0ddfdf1a27"), "figures" },
                    { new Guid("6eadbe6c-20ba-4f9a-9196-6ae0ac88d7bb"), "video games" },
                    { new Guid("6fccf7e8-1615-422f-a654-210779464fc8"), "watches" },
                    { new Guid("859c18b6-ef67-4f31-a84d-686f0adf4512"), "rare plants" },
                    { new Guid("8d9458bb-2303-442b-a4df-08f6bf6bf4f2"), "vinyl records" },
                    { new Guid("9b6f7d4e-687a-4f8a-85cc-682ec8905196"), "books" },
                    { new Guid("a90d8e15-dad2-4894-a9ca-b5e3f3f42c57"), "comics" },
                    { new Guid("b197c6aa-2c48-4a03-b8a5-c190d900f8e5"), "jewellery" },
                    { new Guid("ea76d9f2-08a7-4b38-83ef-e4f0d8b734ab"), "ceramics" },
                    { new Guid("f492c588-a045-4466-8f26-0fd9bb90989e"), "cameras" },
                    { new Guid("f56b64ac-f453-4f4f-8730-8d1b7e3fda08"), "vintage toys" },
                    { new Guid("f9c8f2a6-c5cf-42bb-9f72-701a8e39b539"), "stamps" },
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_UserHobbies_UsersId",
                table: "UserHobbies",
                column: "UsersId"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "UserHobbies");

            migrationBuilder.DropTable(name: "Hobbies");
        }
    }
}
