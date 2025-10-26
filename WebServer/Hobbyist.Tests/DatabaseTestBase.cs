using Hobbyist.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Tests;

/// <summary>
/// Base class for integration tests that require database access.
/// Each test class gets its own isolated database for parallel execution.
/// The database is recreated for each test to ensure complete isolation.
/// </summary>
[Parallelizable(ParallelScope.Self)]
public abstract class DatabaseTestBase
{
    private string _databaseName;
    private string _connectionString;

    /// <summary>
    /// Database context instance for test operations.
    /// Recreated for each test to ensure isolation.
    /// </summary>
    protected HobbyistDbContext Context { get; private set; }

    /// <summary>
    /// Sets up the test database once for all tests in this class.
    /// Creates the database and initializes the context.
    /// </summary>
    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        // Generate unique database name based on test class name
        var testClassName = GetType().Name.ToLower();
        _databaseName = $"hobbyist_test_{testClassName}";

        // Get connection string from environment or use local development default
        var baseConnectionString =
            Environment.GetEnvironmentVariable("TEST_DB_CONNECTION_STRING")
            ?? "Host=localhost;Port=5432;Username=postgres;Password=Password123.";

        // Append unique database name to connection string
        _connectionString = $"{baseConnectionString};Database={_databaseName}";

        // Configure DbContext with test database connection
        var options = new DbContextOptionsBuilder<HobbyistDbContext>()
            .UseNpgsql(_connectionString)
            .Options;

        Context = new HobbyistDbContext(options);

        // Delete any existing test database and create fresh one
        await Context.Database.EnsureDeletedAsync();
        await Context.Database.EnsureCreatedAsync();
    }

    /// <summary>
    /// Cleans the database before each test.
    /// </summary>
    [SetUp]
    public async Task SetUp()
    {
        // Seed test data
        await SeedTestClassDataAsync();

        // Allow derived classes to perform additional test setup
        await OnSetUpAsync();
    }

    /// <summary>
    /// Deletes all data from all tables.
    /// </summary>
    private async Task CleanDatabaseAsync()
    {
        // Get all table names
        var tableNames = Context
            .Model.GetEntityTypes()
            .Select(t => t.GetTableName())
            .Where(t => t != null)
            .Distinct()
            .ToList();

        // Build SQL to truncate all tables
        var truncateCommands = string.Join(
            "; ",
            tableNames.Select(t => $"TRUNCATE TABLE \"{t}\" CASCADE")
        );

        if (!string.IsNullOrEmpty(truncateCommands))
        {
            // Disable foreign key constraints, delete all data, re-enable constraints
            var sql =
                $@"
                SET session_replication_role = 'replica';
                {truncateCommands};
                SET session_replication_role = 'origin';
            ";

            await Context.Database.ExecuteSqlRawAsync(sql);
        }

        // Clear change tracker
        Context.ChangeTracker.Clear();
    }

    /// <summary>
    /// Cleans up after each test.
    /// </summary>
    [TearDown]
    public async Task TearDown()
    {
        // Clean database after test completes
        await CleanDatabaseAsync();
    }

    /// <summary>
    /// Final cleanup after all tests complete.
    /// </summary>
    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        if (Context != null)
        {
            await Context.Database.EnsureDeletedAsync();
            await Context.DisposeAsync();
        }
    }

    /// <summary>
    /// Override to seed data that should be present for each test.
    /// Called after database is created, before each test runs.
    /// </summary>
    protected virtual Task SeedTestClassDataAsync() => Task.CompletedTask;

    /// <summary>
    /// Override for test-specific setup logic.
    /// Called after database creation and seeding, before each test runs.
    /// Use to initialize services or add additional test-specific data.
    /// </summary>
    protected virtual Task OnSetUpAsync() => Task.CompletedTask;
}
