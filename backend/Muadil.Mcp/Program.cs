using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Muadil.Infrastructure.IceAktarma;
using Muadil.Infrastructure.Persistence;

var builder = Host.CreateApplicationBuilder(args);

// stdio taşımasında stdout yalnızca MCP mesajlarına ayrılmıştır; tüm loglar stderr'e gider.
// Bunu yapmazsak tek bir log satırı protokolü bozar.
builder.Logging.AddConsole(o => o.LogToStandardErrorThreshold = LogLevel.Trace);

var baglanti = builder.Configuration.GetConnectionString("Muadil")
    ?? throw new InvalidOperationException("ConnectionStrings__Muadil ortam değişkeni tanımlı değil.");

builder.Services.AddDbContext<MuadilDbContext>(o => o.UseNpgsql(baglanti));
builder.Services.AddScoped<IceAktarmaServisi>();

builder.Services.AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

await builder.Build().RunAsync();
