package com.starci.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * SagaEventsListener — Kafka consumer that routes saga events to {@link StockService}.
 *
 * <p>Consumes {@code saga.demo.events} as the {@code inventory-service-group}.
 * Handles ORDER_CREATED (simplified choreography, direct fulfill) and PAYMENT_CAPTURED
 * (full saga flow via payment step) to trigger stock reservation.
 */
@Component
public class SagaEventsListener {

    private static final Logger log = LoggerFactory.getLogger(SagaEventsListener.class);

    private final StockService stock;

    /**
     * Constructor injection.
     *
     * @param stock service that performs inventory reservation in MongoDB
     */
    public SagaEventsListener(StockService stock) {
        this.stock = stock;
    }

    /**
     * Consume saga events and route relevant ones to the stock service.
     *
     * <p>Logic: forward ORDER_CREATED and PAYMENT_CAPTURED events; silently ignore others.
     * Code: @KafkaListener → StockService.handleSagaEvent().
     *
     * @param event deserialized event map from Kafka
     */
    @KafkaListener(topics = SagaConstants.TOPIC, groupId = SagaConstants.INVENTORY_SERVICE_GROUP)
    public void handle(Map<String, Object> event) {
        if (event == null || event.get("event") == null) {
            return;
        }
        String type = (String) event.get("event");
        log.info("Consumed event \"{}\" for order \"{}\"", type, event.get("orderId"));
        stock.handleSagaEvent(event);
    }
}
