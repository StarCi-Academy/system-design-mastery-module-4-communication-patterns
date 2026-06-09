// Publisher Service — ASP.NET Core Minimal API
// Receives POST /events, wraps the body into an event envelope,
// and publishes it to the NATS subject "app.events" fire-and-forget.
// The publisher never knows which or how many subscribers are listening (decoupling).

using System.Text.Json;
using NATS.Client.Core;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Read NATS URL from environment variable (injected by Docker Compose).
var natsUrl = Environment.GetEnvironmentVariable("NATS_URL") ?? "nats://localhost:4222";
var natsOpts = NatsOpts.Default with { Url = natsUrl };

// Open one connection for the lifetime of the app; shared across requests.
var natsConnection = new NatsConnection(natsOpts);
Console.WriteLine($"[publisher] Connecting to NATS at {natsUrl}");

// POST /events — accept an event body, publish to app.events, return HTTP 201.
app.MapPost("/events", async (HttpContext context) =>
{
    using var doc = await JsonDocument.ParseAsync(context.Request.Body);
    var root = doc.RootElement;
    var type = root.GetProperty("type").GetString();
    var payload = root.GetProperty("payload").Clone();

    // Build the event envelope with a server-side UTC timestamp.
    var ev = new
    {
        type = type,
        payload = payload,
        timestamp = DateTime.UtcNow.ToString("o")
    };

    var messageJson = JsonSerializer.Serialize(ev);

    // Fire-and-forget: publish to the subject and return immediately.
    // No subscriber ack is requested; the publisher does not wait.
    await natsConnection.PublishAsync("app.events", messageJson);
    Console.WriteLine($"[publisher] Published event type={type} to app.events");

    // Return the published envelope so the caller can confirm the emit succeeded.
    var response = new { status = "published", subject = "app.events", @event = ev };
    return Results.Json(response, statusCode: 201);
});

// Bind on all interfaces so Docker can expose the port.
app.Run("http://0.0.0.0:3001");
