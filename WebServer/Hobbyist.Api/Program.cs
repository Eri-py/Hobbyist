using Hobbyist.Api.Extensions.ServiceRegistrations;
using Hobbyist.Api.Middleware;
using Microsoft.AspNetCore.HttpOverrides;
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

builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Railway terminates TLS at the edge and forwards plain HTTP internally.
// UseForwardedHeaders lets the app see the real client IP and the original
// HTTPS scheme — which is required for correct rate-limit bucketing and any
// URL generation.
app.UseForwardedHeaders(
    new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    }
);

app.UseCors(builder.Configuration.GetCorsPolicy());
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging(opts =>
    opts.GetLevel = (ctx, _, _) =>
        ctx.Request.Path.StartsWithSegments("/scalar")
        || ctx.Request.Path.StartsWithSegments("/openapi")
            ? Serilog.Events.LogEventLevel.Verbose
            : Serilog.Events.LogEventLevel.Information
);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
