// Notification Service — .NET Generic Host
// Registers NotificationKafkaConsumer as a hosted background service and starts the host.

using Microsoft.Extensions.Hosting;

var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(services =>
    {
        // Register the Kafka consumer to run for the lifetime of the process.
        services.AddHostedService<NotificationKafkaConsumer>();
    })
    .Build();

await host.RunAsync();
