package com.starci.inventory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for the Inventory service.
 * Subscribes to topic `order-events` under consumer group `inventory-consumer`.
 * Each group receives its own full copy of every event (fan-out broadcast).
 */
@Component
public class InventoryConsumer {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Handle incoming `order-events` messages.
     * Parses the JSON string, extracts order fields, and logs a mock stock decrement.
     *
     * @param message raw JSON string from the Kafka topic
     */
    // Subscribe to `order-events` under the `inventory-consumer` group.
    @KafkaListener(topics = "order-events", groupId = "inventory-consumer")
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
                System.out.println("inventory-service  | Received ORDER_CREATED: order " + orderId + " (" + productName + " x" + quantity + ")");
                // Mock stock decrement — replace with real DB write in production
                System.out.println("inventory-service  | Decrementing stock for \"" + productName + "\" by " + quantity + "...");
            }
        } catch (Exception e) {
            // Log parse errors but do not rethrow — avoids poison-pill message blocking the partition
            e.printStackTrace();
        }
    }
}
