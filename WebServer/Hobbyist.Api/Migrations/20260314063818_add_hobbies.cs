using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Hobbyist.Api.Migrations
{
    /// <inheritdoc />
    public partial class add_hobbies : Migration
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
                    { new Guid("19da3f2b-736f-436b-84de-7d930c3f56fb"), "Sneakers" },
                    { new Guid("1d3b89e5-3fc0-4f6c-bded-53afe9946f0a"), "Coins" },
                    { new Guid("2f7a4f09-c6b7-42dd-a646-b6f36e25b0c1"), "Trading Cards" },
                    { new Guid("3fcd0f37-9401-43fb-b9ad-f5734b396497"), "Antique Maps" },
                    { new Guid("5d22fd82-f357-45dc-be7b-1a22ff13d9d0"), "Minerals" },
                    { new Guid("5e4a94f2-a021-48ab-b2c0-a79a6d6ff43d"), "Art Prints" },
                    { new Guid("6e662a47-fde0-4546-ac66-bf0ddfdf1a27"), "Figures" },
                    { new Guid("6eadbe6c-20ba-4f9a-9196-6ae0ac88d7bb"), "Video Games" },
                    { new Guid("6fccf7e8-1615-422f-a654-210779464fc8"), "Watches" },
                    { new Guid("859c18b6-ef67-4f31-a84d-686f0adf4512"), "Rare Plants" },
                    { new Guid("8d9458bb-2303-442b-a4df-08f6bf6bf4f2"), "Vinyl Records" },
                    { new Guid("9b6f7d4e-687a-4f8a-85cc-682ec8905196"), "Books" },
                    { new Guid("a90d8e15-dad2-4894-a9ca-b5e3f3f42c57"), "Comics" },
                    { new Guid("b197c6aa-2c48-4a03-b8a5-c190d900f8e5"), "Jewellery" },
                    { new Guid("ea76d9f2-08a7-4b38-83ef-e4f0d8b734ab"), "Ceramics" },
                    { new Guid("f492c588-a045-4466-8f26-0fd9bb90989e"), "Cameras" },
                    { new Guid("f56b64ac-f453-4f4f-8730-8d1b7e3fda08"), "Vintage Toys" },
                    { new Guid("f9c8f2a6-c5cf-42bb-9f72-701a8e39b539"), "Stamps" },
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
