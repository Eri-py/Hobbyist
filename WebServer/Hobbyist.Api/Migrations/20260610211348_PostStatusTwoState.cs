using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hobbyist.Api.Migrations
{
    /// <inheritdoc />
    public partial class PostStatusTwoState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // PostStatus collapsed from { Draft=0, Uploading=1, Published=2 } to { Draft=0, Published=1 }.
            // The column stays int; only stored values are remapped. Order matters so the two updates
            // don't collide: an in-flight Uploading post reverts to Draft, then Published shifts 2 -> 1.
            migrationBuilder.Sql(@"UPDATE ""Posts"" SET ""Status"" = 0 WHERE ""Status"" = 1;");
            migrationBuilder.Sql(@"UPDATE ""Posts"" SET ""Status"" = 1 WHERE ""Status"" = 2;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort reverse: Published 1 -> 2. The old Uploading state can't be recovered (those
            // rows became Draft), which is acceptable pre-launch with no production data.
            migrationBuilder.Sql(@"UPDATE ""Posts"" SET ""Status"" = 2 WHERE ""Status"" = 1;");
        }
    }
}
