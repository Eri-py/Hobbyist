using Hobbyist.Api.Data;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Api.Services.LoginServices;
using Hobbyist.Api.Services.OtpServices;
using Hobbyist.Api.Services.SignUpServices;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

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

Console.WriteLine($"Jwt:Secret is null: {builder.Configuration["Jwt:Secret"] == null}");
Console.WriteLine($"Jwt:Issuer is null: {builder.Configuration["Jwt:Issuer"] == null}");
Console.WriteLine($"Jwt:Audience is null: {builder.Configuration["Jwt:Audience"] == null}");

builder.Services.AddDatabases(builder.Configuration);
builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<ILoginService, LoginService>();
builder.Services.AddScoped<ISignUpService, SignUpService>();
builder.Services.AddEmailServices(builder.Environment);
builder.Services.AddCacheServices();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
app.UseCors(clientOriginName);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
