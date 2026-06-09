package com.starci.notification;

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
 * Notification-specific: logs the event and simulates sending email/push notifications.
 */
@Component
class NatsSubscriberRunner implements CommandLineRunner {

    @Value("${NATS_URL:nats://localhost:4222}")
    private String natsUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Opens a NATS connection and subscribes to app.events.
     * Blocks the main thread so the subscription keeps receiving events until the JVM exits.
     *
     * @param args command-line arguments (unused)
     * @throws Exception if NATS connection or subscription fails
     */
    @Override
    public void run(String... args) throws Exception {
        Connection nc = Nats.connect(natsUrl);
        System.out.println("[notification] Connected to NATS at " + natsUrl);

        Dispatcher d = nc.createDispatcher((msg) -> {
            // Each subscriber receives its OWN copy of the broadcast message.
            String str = new String(msg.getData(), StandardCharsets.UTF_8);
            try {
                JsonNode event = objectMapper.readTree(str);
                String type = event.get("type").asText();
                // Log the raw event string prefixed with the service name.
                System.out.println("notification: " + str);
                // Simulate sending email/push notification for the event type.
                System.out.println("[notification] Sending email/push notification for event: " + type);
            } catch (Exception e) {
                System.err.println("[notification] Failed to parse event: " + e.getMessage());
            }
        });

        d.subscribe("app.events");

        // Block forever so the subscription keeps draining the subject.
        Thread.currentThread().join();
    }
}
