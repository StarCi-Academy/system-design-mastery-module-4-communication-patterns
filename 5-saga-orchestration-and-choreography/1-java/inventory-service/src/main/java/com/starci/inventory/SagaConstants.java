package com.starci.inventory;

/**
 * SagaConstants — shared topic name and consumer group ID for the inventory service.
 */
public final class SagaConstants {

    // Kafka topic shared across all saga participants.
    public static final String TOPIC = "saga.demo.events";

    // Consumer group for the inventory-service replica set.
    public static final String INVENTORY_SERVICE_GROUP = "inventory-service-group";

    private SagaConstants() {
        // Utility class — no instantiation.
    }
}
