// Audit Subscriber — Background Worker
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
/// Audit-specific: logs events and simulates writing to an audit log database.
/// </summary>
public class NatsSubscriberWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var natsUrl = Environment.GetEnvironmentVariable("NATS_URL") ?? "nats://localhost:4222";
        var natsOpts = NatsOpts.Default with { Url = natsUrl };

        await using var natsConnection = new NatsConnection(natsOpts);
        Console.WriteLine($"[audit] Connected to NATS at {natsUrl}");

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
                Console.WriteLine($"audit: {payloadStr}");
                // Simulate saving the event to an audit log database.
                Console.WriteLine($"[audit] Saving event to audit log database: {type}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[audit] Failed to parse event: {ex.Message}");
            }
        }
    }
}
