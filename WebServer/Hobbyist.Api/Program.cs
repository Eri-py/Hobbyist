using Hobbyist.Api.Extensions;
using Hobbyist.Api.Extensions.ServiceRegistrations;
using Hobbyist.Api.Middleware;
using Microsoft.FeatureManagement;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog(
    (context, config) =>
        config
            .ReadFrom.Configuration(context.Configuration)
            .Enrich.FromLogContext()
            .WriteTo.Console()
);

builder
    .Configuration.AddJsonFile("featureflags.json", optional: false, reloadOnChange: true)
    .AddJsonFile(
        $"featureflags.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: true
    );

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddFeatureManagement();

builder.Services.AddDomainServices();
builder.Services.AddInfrastructureServices(builder.Configuration, builder.Environment);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseLogHasher();
app.UseCors(builder.Configuration.GetCorsPolicy());
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging(opts =>
    opts.GetLevel = (ctx, _, _) =>
        ctx.Request.Path.StartsWithSegments("/scalar")
        || ctx.Request.Path.StartsWithSegments("/openapi")
            ? Serilog.Events.LogEventLevel.Verbose
            : Serilog.Events.LogEventLevel.Information
);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
