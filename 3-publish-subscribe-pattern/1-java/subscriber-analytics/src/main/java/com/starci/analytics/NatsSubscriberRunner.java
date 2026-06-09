package com.starci.analytics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.nats.client.Connection;
import io.nats.client.Dispatcher;
import io.nats.client.Nats;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * CommandLineRunner that subscribes to the NATS subject app.events on application startup.
 * Each subscriber process receives its OWN copy of every broadcast message (fan-out).
 * Analytics-specific: logs the event and simulates updating metrics.
 */
@Component
class NatsSubscriberRunner implements CommandLineRunner {

    @Value("${NATS_URL:nats://localhost:4222}")
    private String natsUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Opens a NATS connection, creates a dispatcher, and subscribes to app.events.
     * Blocks the main thread so the subscription keeps receiving events until the JVM exits.
     *
     * @param args command-line arguments (unused)
     * @throws Exception if NATS connection or subscription fails
     */
    @Override
    public void run(String... args) throws Exception {
        // Open the NATS connection pointing at the same broker as the publisher.
        Connection nc = Nats.connect(natsUrl);
        System.out.println("[analytics] Connected to NATS at " + natsUrl);

        // Create a dispatcher — the callback runs on a NATS-managed thread.
        Dispatcher d = nc.createDispatcher((msg) -> {
            // Each subscriber receives its OWN copy of the broadcast message.
            String str = new String(msg.getData(), StandardCharsets.UTF_8);
            try {
                JsonNode event = objectMapper.readTree(str);
                String type = event.get("type").asText();
                // Log the raw event string prefixed with the service name.
                System.out.println("analytics: " + str);
                // Simulate updating analytics metrics for the event type.
                System.out.println("[analytics] Updating metrics for event type: " + type);
            } catch (Exception e) {
                System.err.println("[analytics] Failed to parse event: " + e.getMessage());
            }
        });

        // Register on the subject — NATS delivers a copy of each message to this subscription.
        d.subscribe("app.events");

        // Block forever so the subscription keeps draining the subject.
        Thread.currentThread().join();
    }
}
