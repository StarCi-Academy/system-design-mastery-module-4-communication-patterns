package com.starci.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * SagaEventsListener — Kafka consumer that routes saga reply events to {@link OrderService}.
 *
 * <p>Listens on {@code saga.demo.events} topic as the {@code order-service-group}.
 * Handles INVENTORY_OK, INVENTORY_OUT_OF_STOCK, and PAYMENT_REFUNDED to transition
 * order status.  ORDER_CREATED events are silently ignored (emitted by this service).
 */
@Component
public class SagaEventsListener {

    private static final Logger log = LoggerFactory.getLogger(SagaEventsListener.class);

    private final OrderService orders;

    /**
     * Constructor injection.
     *
     * @param orders service that mutates order state in PostgreSQL
     */
    public SagaEventsListener(OrderService orders) {
        this.orders = orders;
    }

    /**
     * Consume all events from saga.demo.events and forward to the service layer.
     *
     * <p>Logic: filter by event type, skip self-emitted ORDER_CREATED events.
     * Code: @KafkaListener → handleSagaEvent() with raw Map payload.
     *
     * @param event deserialized event map from Kafka
     */
    @KafkaListener(topics = SagaConstants.TOPIC, groupId = SagaConstants.ORDER_SERVICE_GROUP)
    public void handle(Map<String, Object> event) {
        if (event == null || event.get("event") == null) {
            return;
        }
        String type = (String) event.get("event");
        log.info("Consumed event \"{}\" for order \"{}\"", type, event.get("orderId"));
        // Skip ORDER_CREATED — this service emits it, not consumes it for state transitions.
        if ("ORDER_CREATED".equals(type)) {
            return;
        }
        orders.handleSagaEvent(event);
    }
}
