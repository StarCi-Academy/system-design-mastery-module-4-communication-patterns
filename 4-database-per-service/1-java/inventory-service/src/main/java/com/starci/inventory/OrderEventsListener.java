package com.starci.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer — listens on topic {@code order-events}.
 *
 * <p>Mirrors the TS {@code OrderEventsController} annotated with
 * {@code @EventPattern("order-events")}: checks for a valid {@code productName}
 * and {@code quantity}, then calls {@link InventoryService#decrementStockByProductName}.
 */
@Component
public class OrderEventsListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventsListener.class);

    private final InventoryService inventoryService;

    public OrderEventsListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Handle an incoming order event and decrement stock when payload is valid.
     *
     * @param payload deserialised event from Kafka topic {@code order-events}
     */
    @KafkaListener(topics = "order-events", groupId = "database-per-service-inventory")
    public void onOrder(OrderEventPayload payload) {
        log.info("Received order-events payload: productName={}, quantity={}",
                payload.getProductName(), payload.getQuantity());

        // Guard — mirrors TS: productName && quantity != null && quantity > 0.
        String productName = payload.getProductName();
        Integer quantity = payload.getQuantity();
        if (productName != null && !productName.isBlank()
                && quantity != null && quantity > 0) {
            inventoryService.decrementStockByProductName(productName, quantity);
        }
    }
}
