using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Muadil.Api.Auth;
using Muadil.Domain.Abstractions;
using Muadil.Infrastructure.IceAktarma;
using Muadil.Infrastructure.Persistence;
using Muadil.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

// --- Servis kaydı ---

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

builder.Services.AddDbContext<MuadilDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Muadil")));

var uploadsYolu = Path.Combine(builder.Environment.ContentRootPath, "uploads");
builder.Services.AddSingleton<IGorselDeposu>(new DiskGorselDeposu(uploadsYolu, "/uploads"));
builder.Services.AddScoped<IceAktarmaServisi>();

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

var app = builder.Build();

// --- İstek boru hattı ---

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<MuadilDbContext>();
    await SeedData.LoadAsync(db);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsYolu),
    RequestPath = "/uploads"
});

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
