// Notification Subscriber — Background Worker
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
/// Notification-specific: logs events and simulates sending email/push notifications.
/// </summary>
public class NatsSubscriberWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var natsUrl = Environment.GetEnvironmentVariable("NATS_URL") ?? "nats://localhost:4222";
        var natsOpts = NatsOpts.Default with { Url = natsUrl };

        await using var natsConnection = new NatsConnection(natsOpts);
        Console.WriteLine($"[notification] Connected to NATS at {natsUrl}");

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
                Console.WriteLine($"notification: {payloadStr}");
                // Simulate sending email/push notification for the event type.
                Console.WriteLine($"[notification] Sending email/push notification for event: {type}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[notification] Failed to parse event: {ex.Message}");
            }
        }
    }
}
