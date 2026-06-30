using BFAR.EBudget.Data;
using BFAR.EBudget.Auth;

var builder = WebApplication.CreateBuilder(args);

// ── 1. Register services ──────────────────────────────────────────────────────

// Controllers (for our API endpoints)
builder.Services.AddControllers();

// Register ObligationsData as a scoped service
// It reads the connection string from appsettings.json automatically
builder.Services.AddScoped<ObligationsData>(sp =>
{
    var connStr = builder.Configuration.GetConnectionString("BFARConn")
                  ?? throw new InvalidOperationException("BFARConn connection string is missing.");
    return new ObligationsData(connStr);
});

// Register EarmarkingData
builder.Services.AddScoped<EarmarkingData>(sp =>
{
    var connStr = builder.Configuration.GetConnectionString("BFARConn")
                  ?? throw new InvalidOperationException("BFARConn connection string is missing.");
    return new EarmarkingData(connStr);
});

// Register AuthData
builder.Services.AddScoped<AuthData>(sp =>
{
    var connStr = builder.Configuration.GetConnectionString("BFARConn")
                  ?? throw new InvalidOperationException("BFARConn connection string is missing.");
    return new AuthData(connStr);
});

var app = builder.Build();

// ── 2. Middleware pipeline ────────────────────────────────────────────────────

// Serve static files from wwwroot (your .html, .css, .js files)
app.UseStaticFiles();

// Route API calls to controllers
app.MapControllers();

// Fallback: serve index.html for any unmatched route (optional)
app.MapFallbackToFile("index.html");

app.Run();
