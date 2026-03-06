using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Hobbyist.Api.Data;

public class HobbyistDbContextFactory : IDesignTimeDbContextFactory<HobbyistDbContext>
{
    public HobbyistDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<HobbyistDbContext>().UseNpgsql().Options;

        return new HobbyistDbContext(options);
    }
}
