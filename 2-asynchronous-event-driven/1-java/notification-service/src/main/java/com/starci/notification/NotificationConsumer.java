package com.starci.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for the Notification service.
 * Subscribes to topic `order-events` under consumer group `notification-consumer`.
 * Different group from `inventory-consumer` — Kafka fan-outs a full copy to each group (broadcast).
 */
@Component
public class NotificationConsumer {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Handle incoming `order-events` messages.
     * Parses the JSON string, extracts order fields, and logs a mock notification send.
     *
     * @param message raw JSON string from the Kafka topic
     */
    // Different group `notification-consumer` → receives a full copy of every event.
    @KafkaListener(topics = "order-events", groupId = "notification-consumer")
    public void consume(String message) {
        try {
            // Parse raw JSON string into a tree — avoids tight coupling to a specific Java type
            JsonNode payload = objectMapper.readTree(message);
            String eventType = payload.get("eventType").asText();

            if ("ORDER_CREATED".equals(eventType)) {
                int orderId = payload.get("orderId").asInt();
                String productName = payload.get("productName").asText();
                int quantity = payload.get("quantity").asInt();

                // Log the received event with the same format as the NestJS TS version
                System.out.println("notification-service | Received ORDER_CREATED: order " + orderId + " (" + productName + " x" + quantity + ")");
                // Mock notification send — replace with real push service in production
                System.out.println("notification-service | Sending notification for order " + orderId + "...");
            }
        } catch (Exception e) {
            // Log parse errors but do not rethrow — avoids poison-pill message blocking the partition
            e.printStackTrace();
        }
    }
}
