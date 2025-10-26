using Hobbyist.Api.Data;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(
            name: builder.Configuration["ClientOrigin:Name"]!,
            policy =>
            {
                policy
                    .WithOrigins(
                        builder.Configuration["ClientOrigin:Local"]!,
                        builder.Configuration["ClientOrigin:Network"]!
                    )
                    .AllowAnyHeader()
                    .AllowCredentials();
            }
        );
    });
}

builder.Services.AddDatabases(builder.Configuration);
builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddEmailServices(builder.Environment);
builder.Services.AddCacheServices();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
app.UseCors(builder.Configuration["ClientOrigin:Name"]!);

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
