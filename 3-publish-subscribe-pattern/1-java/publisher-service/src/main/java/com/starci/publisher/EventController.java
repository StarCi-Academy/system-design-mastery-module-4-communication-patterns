package com.starci.publisher;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.nats.client.Connection;
import io.nats.client.Nats;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * REST controller — receives POST /events and publishes the event envelope to NATS subject app.events.
 * The publisher does not know which subscribers exist; it only knows the subject name (decoupling).
 */
@RestController
@RequestMapping("/events")
public class EventController {

    // NATS connection opened once at startup and reused for all requests.
    private Connection natsConnection;

    @Value("${NATS_URL:nats://localhost:4222}")
    private String natsUrl;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Opens the NATS connection after Spring has injected the natsUrl property.
     * Using @PostConstruct ensures the URL is available before connecting.
     */
    @PostConstruct
    public void init() {
        try {
            // Connect to the NATS broker once; reuse for every publish call.
            natsConnection = Nats.connect(natsUrl);
            System.out.println("[publisher] Connected to NATS at " + natsUrl);
        } catch (Exception e) {
            System.err.println("[publisher] NATS connection failed: " + e.getMessage());
        }
    }

    /**
     * Accepts POST /events, wraps the body into an envelope, and publishes to app.events fire-and-forget.
     * Returns HTTP 201 with the published envelope so the caller can confirm the emit.
     *
     * @param body request body containing "type" and "payload" fields
     * @return HTTP 201 with status, subject, and the event envelope
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> publishEvent(
            @RequestBody Map<String, Object> body) {
        try {
            String type = (String) body.get("type");
            Object payload = body.get("payload");

            // Build the event envelope with a server-side timestamp.
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("type", type);
            event.put("payload", payload);
            event.put("timestamp", Instant.now().toString());

            // Fire-and-forget: serialize the envelope and publish to the subject.
            // The publisher does not wait for subscriber acks — it returns immediately.
            String json = objectMapper.writeValueAsString(event);
            if (natsConnection != null) {
                natsConnection.publish("app.events", json.getBytes(StandardCharsets.UTF_8));
                System.out.println("[publisher] Published event type=" + type + " to app.events");
            }

            // Return the published envelope so the caller can verify the emit succeeded.
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", "published");
            response.put("subject", "app.events");
            response.put("event", event);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
