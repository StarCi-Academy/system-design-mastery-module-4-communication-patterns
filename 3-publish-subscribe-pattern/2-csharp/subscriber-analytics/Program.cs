// Analytics Subscriber — Background Worker
// Subscribes to the NATS subject "app.events" and processes each received event.
// Each subscriber process receives its OWN copy of every broadcast message (fan-out).

using Microsoft.Extensions.Hosting;
using NATS.Client.Core;
using System.Text.Json;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<NatsSubscriberWorker>();
var host = builder.Build();
await host.RunAsync();

/// <summary>
/// BackgroundService that connects to NATS and subscribes to app.events.
/// Runs continuously for the lifetime of the host — the subscription keeps draining the subject.
/// Analytics-specific: logs events and simulates updating metrics.
/// </summary>
public class NatsSubscriberWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Read NATS URL from environment variable (injected by Docker Compose).
        var natsUrl = Environment.GetEnvironmentVariable("NATS_URL") ?? "nats://localhost:4222";
        var natsOpts = NatsOpts.Default with { Url = natsUrl };

        // Each subscriber process opens its own connection to the same broker.
        await using var natsConnection = new NatsConnection(natsOpts);
        Console.WriteLine($"[analytics] Connected to NATS at {natsUrl}");

        // Each subscriber process registers on the SAME subject independently.
        // NATS delivers one copy per message to every subscriber on the subject (fan-out).
        await foreach (var msg in natsConnection
            .SubscribeAsync<string>("app.events")
            .WithCancellation(stoppingToken))
        {
            var payloadStr = msg.Data;
            if (payloadStr is null) continue;

            try
            {
                using var doc = JsonDocument.Parse(payloadStr);
                var type = doc.RootElement.GetProperty("type").GetString();
                // Log the raw event string prefixed with the service name.
                Console.WriteLine($"analytics: {payloadStr}");
                // Simulate updating analytics metrics for the event type.
                Console.WriteLine($"[analytics] Updating metrics for event type: {type}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[analytics] Failed to parse event: {ex.Message}");
            }
        }
    }
}
