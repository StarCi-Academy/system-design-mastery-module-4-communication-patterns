package com.starci.order;

/**
 * SagaConstants — shared Kafka topic name and consumer group IDs for the saga choreography demo.
 *
 * <p>Kept in a single constants class so that {@link OrderService} (producer) and
 * {@link SagaEventsListener} (consumer) always reference the same literal.
 */
public final class SagaConstants {

    // Kafka topic carrying all saga events between services.
    public static final String TOPIC = "saga.demo.events";

    // Consumer group for the order-service replica set.
    public static final String ORDER_SERVICE_GROUP = "order-service-group";

    private SagaConstants() {
        // Utility class — no instantiation.
    }
}
