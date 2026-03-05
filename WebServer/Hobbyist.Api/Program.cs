using Hobbyist.Api.Data;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Api.Services.LoginServices;
using Hobbyist.Api.Services.OtpServices;
using Hobbyist.Api.Services.SignUpServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.FeatureManagement;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder
    .Configuration.AddJsonFile("featureflags.json", optional: false, reloadOnChange: true)
    .AddJsonFile(
        $"featureflags.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: true
    );

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var clientOriginName = builder.Configuration["ClientOrigin:Name"];
var clientOriginAddress = builder.Configuration["ClientOrigin:Address"];
if (string.IsNullOrWhiteSpace(clientOriginName) || string.IsNullOrWhiteSpace(clientOriginAddress))
{
    throw new InvalidOperationException(
        "Missing CORS configuration. Set both 'ClientOrigin:Name' and 'ClientOrigin:Address'."
    );
}

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        name: clientOriginName,
        policy =>
        {
            policy
                .WithOrigins(clientOriginAddress)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

builder.Services.AddDatabases(builder.Configuration);
builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<ILoginService, LoginService>();
builder.Services.AddScoped<ISignUpService, SignUpService>();
builder.Services.AddEmailServices(builder.Environment);
builder.Services.AddCacheServices(builder.Configuration);
builder.Services.AddFeatureManagement();

var app = builder.Build();

// Run migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HobbyistDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
app.UseCors(clientOriginName);

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
