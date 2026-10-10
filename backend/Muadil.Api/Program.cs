using Microsoft.EntityFrameworkCore;
using Muadil.Infrastructure.Persistence;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Muadil.Api.Auth;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;
using Muadil.Domain.Abstractions;
using Muadil.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);


// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddDbContext<MuadilDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Muadil")));
    var uploadsYolu = Path.Combine(builder.Environment.ContentRootPath, "uploads");
builder.Services.AddSingleton<IGorselDeposu>(new DiskGorselDeposu(uploadsYolu, "/uploads"));

    builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        options.Audience = builder.Configuration["Keycloak:Audience"];
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters.RoleClaimType = ClaimTypes.Role;
        options.TokenValidationParameters.NameClaimType = "preferred_username";
    });

builder.Services.AddTransient<IClaimsTransformation, KeycloakRolDonusumu>();

builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(builder.Configuration["Cors:FrontendUrl"]!)
        .AllowAnyHeader()
        .AllowAnyMethod()));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsYolu),
    RequestPath = "/uploads"
});

// Configure the HTTP request pipeline.

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<MuadilDbContext>();
    await SeedData.LoadAsync(db);
}
app.UseHttpsRedirection();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();

app.Run();
