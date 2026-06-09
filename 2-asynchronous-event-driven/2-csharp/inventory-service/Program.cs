// Inventory Service — .NET Generic Host
// Registers InventoryKafkaConsumer as a hosted background service and starts the host.

using Microsoft.Extensions.Hosting;

// Build host with the inventory consumer as the only background service.
var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(services =>
    {
        // Register the Kafka consumer to run for the lifetime of the process.
        services.AddHostedService<InventoryKafkaConsumer>();
    })
    .Build();

await host.RunAsync();
