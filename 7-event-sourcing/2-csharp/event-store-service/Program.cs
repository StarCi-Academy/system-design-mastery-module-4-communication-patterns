// Event Store Service — ASP.NET Core 8 minimal API.
// Implements the same contract as the NestJS TypeScript reference:
//   POST   /accounts                   — open a new account (AccountOpened event)
//   POST   /accounts/{id}/deposit      — deposit money (MoneyDeposited event)
//   POST   /accounts/{id}/withdraw     — withdraw money (MoneyWithdrawn event)
//   POST   /accounts/{id}/close        — close account (AccountClosed event)
//   GET    /accounts/{id}              — current projection (replay events → AccountState)
//   GET    /accounts/{id}/events       — raw event log (audit / time-travel)
//   GET    /accounts/{id}/state-at/{v} — state at a specific version (time-travel)
//   POST   /accounts/{id}/snapshots    — manually take a snapshot
//   POST   /projections/rebuild        — rebuild all projections from scratch
//
// Storage: PostgreSQL via EF Core (Npgsql).
// Tables:  events (append-only), account_snapshots.
// Schema:  EnsureCreated on startup (lab/demo — equivalent to synchronize:true in TypeScript).

using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

// ─── Configuration ────────────────────────────────────────────────────────────

var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "eventsource";
var dbPass = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "eventsource";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "event_store";
var appPort = int.TryParse(Environment.GetEnvironmentVariable("PORT"), out var p) ? p : 3000;

var connectionString =
    $"Host={dbHost};Port={dbPort};Username={dbUser};Password={dbPass};Database={dbName}";

// ─── Builder ──────────────────────────────────────────────────────────────────

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContextFactory<EventStoreDbContext>(opts =>
    opts.UseNpgsql(connectionString));

// Also register as a scoped context so endpoints can inject EventStoreDbContext directly.
builder.Services.AddDbContext<EventStoreDbContext>(opts =>
    opts.UseNpgsql(connectionString));

// Use camelCase JSON to match the TypeScript / NestJS response shape.
builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

var app = builder.Build();

// Auto-create schema on startup (lab/demo — mirrors TypeORM synchronize:true).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EventStoreDbContext>();
    db.Database.EnsureCreated();
}

// ─── Endpoint helpers captured as local functions ──────────────────────────────

// AppendEvent — append one domain event inside a serialised transaction.
// Uses a Postgres advisory lock keyed to the aggregate ID to guarantee
// monotonic version assignment even under concurrent requests.
async Task AppendEvent(
    EventStoreDbContext db,
    IDbContextFactory<EventStoreDbContext> factory,
    string aggregateId,
    string aggregateType,
    string eventType,
    Dictionary<string, object> payload)
{
    using var txn = await db.Database.BeginTransactionAsync();

    // Advisory lock serialises concurrent writes for the same aggregate.
    // pg_advisory_xact_lock is released automatically when the transaction ends.
    // lockKey is a computed long (not user input), but parameterised form avoids EF1002.
    var lockKey = HashAggregateId(aggregateId);
    await db.Database.ExecuteSqlAsync(
        $"SELECT pg_advisory_xact_lock({lockKey})");

    // Determine next monotonic version for this aggregate.
    var maxVersion = await db.Events
        .Where(e => e.AggregateId == aggregateId)
        .MaxAsync(e => (int?)e.Version) ?? 0;
    var nextVersion = maxVersion + 1;

    var record = new EventRecord
    {
        AggregateId = aggregateId,
        AggregateType = aggregateType,
        Version = nextVersion,
        EventType = eventType,
        Payload = JsonSerializer.SerializeToDocument(payload),
    };

    db.Events.Add(record);
    await db.SaveChangesAsync();
    await txn.CommitAsync();

    // Auto-snapshot every SNAPSHOT_THRESHOLD events.
    // Uses a factory-created context so the fire-and-forget task has its own lifetime.
    const int snapshotThreshold = 10;
    if (nextVersion % snapshotThreshold == 0)
    {
        _ = TakeSnapshotAsync(factory, aggregateId);
    }
}

// TakeSnapshotAsync — creates its own DbContext to avoid lifetime issues with fire-and-forget.
async Task TakeSnapshotAsync(IDbContextFactory<EventStoreDbContext> factory, string accountId)
{
    try
    {
        await using var db = await factory.CreateDbContextAsync();
        var state = await LoadState(db, accountId);
        if (state is null) return;

        var exists = await db.Snapshots
            .AnyAsync(s => s.AccountId == accountId && s.Version == state.Version);
        if (exists) return;

        var snap = new AccountSnapshot
        {
            AccountId = accountId,
            Version = state.Version,
            State = JsonSerializer.SerializeToDocument(state),
        };
        db.Snapshots.Add(snap);
        await db.SaveChangesAsync();
    }
    catch
    {
        // Intentionally swallowed — auto-snapshot failure must not affect the main flow.
    }
}

// LoadState — replay events on top of the latest snapshot to reconstruct AccountState.
// 1. Find latest snapshot (if any).
// 2. Load all events with version > snapshot.version (or all events if no snapshot).
// 3. Fold events onto the snapshot state.
async Task<AccountState?> LoadState(EventStoreDbContext db, string accountId)
{
    var snapshot = await db.Snapshots
        .Where(s => s.AccountId == accountId)
        .OrderByDescending(s => s.Version)
        .FirstOrDefaultAsync();

    var query = db.Events.Where(e => e.AggregateId == accountId);
    if (snapshot is not null)
        query = query.Where(e => e.Version > snapshot.Version);

    var events = await query.OrderBy(e => e.Version).ToListAsync();

    if (events.Count == 0 && snapshot is null)
        return null;

    AccountState state;
    if (snapshot is not null)
    {
        // Start from the persisted snapshot state then fold newer events on top.
        state = JsonSerializer.Deserialize<AccountState>(
            snapshot.State.RootElement.GetRawText(),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
            ?? EmptyState(accountId);
    }
    else
    {
        state = EmptyState(accountId);
    }

    foreach (var row in events)
        state = ApplyEvent(state, row.Payload, row.OccurredAt, row.Version);

    return state;
}

// ReplayEvents — replay a pre-loaded list of EventRecord rows (used by the state-at endpoint).
AccountState ReplayEvents(string accountId, IEnumerable<EventRecord> rows)
{
    var state = EmptyState(accountId);
    foreach (var row in rows)
        state = ApplyEvent(state, row.Payload, row.OccurredAt, row.Version);
    return state;
}

// ApplyEvent — pure fold step; returns a new AccountState without mutating inputs.
AccountState ApplyEvent(AccountState state, JsonDocument payload, DateTime occurredAt, int version)
{
    var next = state with { Version = version, LastEventAt = occurredAt };
    var type = payload.RootElement.GetProperty("type").GetString() ?? "";

    return type switch
    {
        "AccountOpened" => next with
        {
            Owner = payload.RootElement.GetProperty("owner").GetString() ?? "",
            Balance = payload.RootElement.GetProperty("initialBalance").GetDecimal(),
            Status = "open",
            OpenedAt = occurredAt,
        },
        "MoneyDeposited" => next with
        {
            Balance = state.Balance + payload.RootElement.GetProperty("amount").GetDecimal(),
        },
        "MoneyWithdrawn" => next with
        {
            Balance = state.Balance - payload.RootElement.GetProperty("amount").GetDecimal(),
        },
        "AccountClosed" => next with { Status = "closed" },
        _ => next,
    };
}

// EmptyState — zero-value AccountState for an aggregate with no events yet.
AccountState EmptyState(string accountId) => new AccountState
{
    AccountId = accountId,
    Owner = "",
    Balance = 0,
    Status = "open",
    Version = 0,
    OpenedAt = null,
    LastEventAt = null,
};

// HashAggregateId — djb2-style hash of the aggregate ID string → positive 31-bit int advisory lock key.
// Mirrors the _hashAggregateId implementation in the TypeScript service.
long HashAggregateId(string id)
{
    long hash = 0;
    foreach (var c in id)
    {
        hash = ((hash << 5) - hash) + c;
        hash &= 0x7FFFFFFF; // keep positive 31-bit range for pg_advisory_xact_lock
    }
    return hash;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

// POST /accounts — open a new account.
// Body: { owner: string, initialBalance: number }
app.MapPost("/accounts", async (
    OpenAccountRequest req,
    EventStoreDbContext db,
    IDbContextFactory<EventStoreDbContext> factory) =>
{
    if (string.IsNullOrWhiteSpace(req.Owner))
        return Results.BadRequest(new { message = "owner must not be empty" });
    if (req.InitialBalance < 0)
        return Results.BadRequest(new { message = "initialBalance must be >= 0" });

    var accountId =
        $"acc_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid().ToString("N")[..6]}";

    var payload = new Dictionary<string, object>
    {
        ["type"] = "AccountOpened",
        ["accountId"] = accountId,
        ["owner"] = req.Owner,
        ["initialBalance"] = req.InitialBalance,
    };

    await AppendEvent(db, factory, accountId, "Account", "AccountOpened", payload);

    return Results.Ok(new { accountId });
});

// POST /accounts/{id}/deposit — deposit money.
// Body: { amount: number }
app.MapPost("/accounts/{id}/deposit", async (
    string id,
    AmountRequest req,
    EventStoreDbContext db,
    IDbContextFactory<EventStoreDbContext> factory) =>
{
    if (req.Amount <= 0)
        return Results.BadRequest(new { message = "amount must be positive" });

    var state = await LoadState(db, id);
    if (state is null)
        return Results.NotFound(new { message = $"Account {id} not found" });
    if (state.Status == "closed")
        return Results.BadRequest(new { message = $"Account {id} is closed" });

    var payload = new Dictionary<string, object>
    {
        ["type"] = "MoneyDeposited",
        ["accountId"] = id,
        ["amount"] = req.Amount,
    };

    await AppendEvent(db, factory, id, "Account", "MoneyDeposited", payload);

    var newState = await LoadState(db, id);
    return Results.Ok(newState);
});

// POST /accounts/{id}/withdraw — withdraw money.
// Body: { amount: number }
app.MapPost("/accounts/{id}/withdraw", async (
    string id,
    AmountRequest req,
    EventStoreDbContext db,
    IDbContextFactory<EventStoreDbContext> factory) =>
{
    if (req.Amount <= 0)
        return Results.BadRequest(new { message = "amount must be positive" });

    var state = await LoadState(db, id);
    if (state is null)
        return Results.NotFound(new { message = $"Account {id} not found" });
    if (state.Status == "closed")
        return Results.BadRequest(new { message = $"Account {id} is closed" });
    if (state.Balance < req.Amount)
        return Results.BadRequest(new
        {
            message = $"Insufficient balance: {state.Balance} < {req.Amount}"
        });

    var payload = new Dictionary<string, object>
    {
        ["type"] = "MoneyWithdrawn",
        ["accountId"] = id,
        ["amount"] = req.Amount,
    };

    await AppendEvent(db, factory, id, "Account", "MoneyWithdrawn", payload);

    var newState = await LoadState(db, id);
    return Results.Ok(newState);
});

// POST /accounts/{id}/close — close an account.
// Body: { reason: string }
app.MapPost("/accounts/{id}/close", async (
    string id,
    CloseAccountRequest req,
    EventStoreDbContext db,
    IDbContextFactory<EventStoreDbContext> factory) =>
{
    if (string.IsNullOrWhiteSpace(req.Reason))
        return Results.BadRequest(new { message = "reason must not be empty" });

    var state = await LoadState(db, id);
    if (state is null)
        return Results.NotFound(new { message = $"Account {id} not found" });
    if (state.Status == "closed")
        return Results.BadRequest(new { message = $"Account {id} is already closed" });

    var payload = new Dictionary<string, object>
    {
        ["type"] = "AccountClosed",
        ["accountId"] = id,
        ["reason"] = req.Reason,
    };

    await AppendEvent(db, factory, id, "Account", "AccountClosed", payload);

    var newState = await LoadState(db, id);
    return Results.Ok(newState);
});

// GET /accounts/{id} — current projection (replay event log → AccountState).
app.MapGet("/accounts/{id}", async (string id, EventStoreDbContext db) =>
{
    var state = await LoadState(db, id);
    if (state is null)
        return Results.NotFound(new { message = $"Account {id} not found" });
    return Results.Ok(state);
});

// GET /accounts/{id}/events — raw event log (audit trail).
app.MapGet("/accounts/{id}/events", async (string id, EventStoreDbContext db) =>
{
    var events = await db.Events
        .Where(e => e.AggregateId == id)
        .OrderBy(e => e.Version)
        .ToListAsync();

    if (events.Count == 0)
        return Results.NotFound(new { message = $"Account {id} not found" });

    return Results.Ok(events);
});

// GET /accounts/{id}/state-at/{version} — time-travel: state at a specific version.
app.MapGet("/accounts/{id}/state-at/{version:int}", async (
    string id, int version, EventStoreDbContext db) =>
{
    var events = await db.Events
        .Where(e => e.AggregateId == id && e.Version <= version)
        .OrderBy(e => e.Version)
        .ToListAsync();

    if (events.Count == 0)
        return Results.NotFound(new
        {
            message = $"Account {id} not found or no events at version {version}"
        });

    var state = ReplayEvents(id, events);
    return Results.Ok(state);
});

// POST /accounts/{id}/snapshots — manually take a snapshot.
app.MapPost("/accounts/{id}/snapshots", async (string id, EventStoreDbContext db) =>
{
    var state = await LoadState(db, id);
    if (state is null)
        return Results.NotFound(new { message = $"Account {id} not found" });

    // Idempotent: return existing snapshot if one already exists for this version.
    var existing = await db.Snapshots
        .FirstOrDefaultAsync(s => s.AccountId == id && s.Version == state.Version);
    if (existing is not null)
        return Results.Ok(existing);

    var snap = new AccountSnapshot
    {
        AccountId = id,
        Version = state.Version,
        State = JsonSerializer.SerializeToDocument(state),
    };
    db.Snapshots.Add(snap);
    await db.SaveChangesAsync();

    return Results.Ok(snap);
});

// POST /projections/rebuild — rebuild all projections from the raw event log.
app.MapPost("/projections/rebuild", async (EventStoreDbContext db) =>
{
    var accountIds = await db.Events
        .Where(e => e.AggregateType == "Account")
        .Select(e => e.AggregateId)
        .Distinct()
        .ToListAsync();

    var accounts = new List<AccountState>();
    foreach (var accountId in accountIds)
    {
        var state = await LoadState(db, accountId);
        if (state is not null)
            accounts.Add(state);
    }

    return Results.Ok(new { rebuilt = accounts.Count, accounts });
});

// ─── Bind ─────────────────────────────────────────────────────────────────────

app.Run($"http://0.0.0.0:{appPort}");

// ─── Domain types ─────────────────────────────────────────────────────────────

// EventRecord — one row in the events table (append-only event log).
// Each row is an immutable domain event; never update or delete.
public class EventRecord
{
    public int Id { get; set; }

    /// <summary>Aggregate ID (e.g., accountId).</summary>
    public string AggregateId { get; set; } = "";

    /// <summary>Aggregate type (e.g., "Account").</summary>
    public string AggregateType { get; set; } = "";

    /// <summary>Monotonic version within the aggregate — starts at 1.</summary>
    public int Version { get; set; }

    /// <summary>Event name (e.g., "AccountOpened", "MoneyDeposited").</summary>
    public string EventType { get; set; } = "";

    /// <summary>JSON payload — immutable business data stored as JSONB.</summary>
    public JsonDocument Payload { get; set; } = JsonDocument.Parse("{}");

    /// <summary>Timestamp set by the DB — cannot be overridden by the application.</summary>
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}

// AccountSnapshot — snapshot of account state at a specific version.
// Optimises replay: replay only events after the latest snapshot.
public class AccountSnapshot
{
    public int Id { get; set; }

    /// <summary>ID of the account this snapshot belongs to.</summary>
    public string AccountId { get; set; } = "";

    /// <summary>Version of the last event folded into this snapshot.</summary>
    public int Version { get; set; }

    /// <summary>Full AccountState serialised as JSONB.</summary>
    public JsonDocument State { get; set; } = JsonDocument.Parse("{}");

    /// <summary>Timestamp when the snapshot was taken.</summary>
    public DateTime SnapshottedAt { get; set; } = DateTime.UtcNow;
}

// AccountState — the read model produced by replaying the event log.
public record AccountState
{
    public string AccountId { get; init; } = "";
    public string Owner { get; init; } = "";
    public decimal Balance { get; init; }
    public string Status { get; init; } = "open"; // "open" | "closed"
    public int Version { get; init; }
    public DateTime? OpenedAt { get; init; }
    public DateTime? LastEventAt { get; init; }
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

public record OpenAccountRequest(string Owner, decimal InitialBalance);
public record AmountRequest(decimal Amount);
public record CloseAccountRequest(string Reason);

// ─── EF Core DbContext ────────────────────────────────────────────────────────

// EventStoreDbContext — configures the two tables and their indexes.
// Mirrors the TypeORM entity definitions for EventRecord and AccountSnapshot.
public class EventStoreDbContext : DbContext
{
    public EventStoreDbContext(DbContextOptions<EventStoreDbContext> opts) : base(opts) { }

    public DbSet<EventRecord> Events { get; set; } = null!;
    public DbSet<AccountSnapshot> Snapshots { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // events table — mirrors TypeORM EventRecord entity.
        mb.Entity<EventRecord>(e =>
        {
            e.ToTable("events");
            e.HasKey(x => x.Id);
            e.Property(x => x.AggregateId)
                .HasColumnName("aggregate_id")
                .HasMaxLength(100)
                .IsRequired();
            e.Property(x => x.AggregateType)
                .HasColumnName("aggregate_type")
                .HasMaxLength(100)
                .IsRequired();
            e.Property(x => x.Version).IsRequired();
            e.Property(x => x.EventType)
                .HasColumnName("event_type")
                .HasMaxLength(100)
                .IsRequired();
            e.Property(x => x.Payload)
                .HasColumnName("payload")
                .HasColumnType("jsonb")
                .IsRequired();
            e.Property(x => x.OccurredAt)
                .HasColumnName("occurred_at")
                .HasDefaultValueSql("NOW()");

            // Unique constraint: (aggregate_id, version) — prevents concurrent-write conflicts.
            e.HasIndex(x => new { x.AggregateId, x.Version }).IsUnique();
            e.HasIndex(x => x.AggregateId);
        });

        // account_snapshots table — mirrors TypeORM AccountSnapshot entity.
        mb.Entity<AccountSnapshot>(s =>
        {
            s.ToTable("account_snapshots");
            s.HasKey(x => x.Id);
            s.Property(x => x.AccountId)
                .HasColumnName("account_id")
                .HasMaxLength(100)
                .IsRequired();
            s.Property(x => x.Version).IsRequired();
            s.Property(x => x.State)
                .HasColumnName("state")
                .HasColumnType("jsonb")
                .IsRequired();
            s.Property(x => x.SnapshottedAt)
                .HasColumnName("snapshotted_at")
                .HasDefaultValueSql("NOW()");

            s.HasIndex(x => new { x.AccountId, x.Version }).IsUnique();
            s.HasIndex(x => x.AccountId);
        });
    }
}
