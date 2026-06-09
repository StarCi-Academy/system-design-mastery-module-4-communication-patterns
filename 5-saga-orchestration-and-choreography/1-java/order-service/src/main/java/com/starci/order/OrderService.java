package com.starci.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * OrderService — saga choreography order aggregate.
 *
 * <p>Logic:
 * <ol>
 *   <li>{@link #create} — persist order as PENDING then emit ORDER_CREATED event.</li>
 *   <li>{@link #handleSagaEvent} — transition order status based on incoming saga reply events.</li>
 * </ol>
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository repo;
    private final KafkaTemplate<String, Object> kafka;

    /**
     * Constructor injection — repository for PostgreSQL access, KafkaTemplate for event emission.
     *
     * @param repo  JPA repository for the orders table
     * @param kafka Spring Kafka producer template
     */
    public OrderService(OrderRepository repo, KafkaTemplate<String, Object> kafka) {
        this.repo = repo;
        this.kafka = kafka;
    }

    /**
     * Create a PENDING order in PostgreSQL and emit ORDER_CREATED to saga.demo.events.
     *
     * <p>Logic: persist with status=PENDING, build event payload, produce to Kafka.
     * Code: JPA save → KafkaTemplate.send().
     *
     * @param productId product identifier from the request body
     * @param quantity  units requested
     * @return the persisted {@link Order} entity
     */
    @Transactional
    public Order create(Long productId, Integer quantity) {
        // Persist order in PENDING state before emitting — ensures row exists before event arrives.
        Order order = repo.save(new Order(productId, quantity));

        // Build ORDER_CREATED event payload matching the TS SagaEvent discriminated union.
        Map<String, Object> event = new HashMap<>();
        event.put("event", "ORDER_CREATED");
        event.put("orderId", order.getId());
        event.put("productId", productId);
        event.put("quantity", quantity);

        // Emit event to the shared saga topic so downstream services can react.
        kafka.send(SagaConstants.TOPIC, event);
        log.info("Order {} created, ORDER_CREATED emitted", order.getId());
        return order;
    }

    /**
     * Transition order status based on a saga reply event.
     *
     * <p>Logic: INVENTORY_OK → COMPLETED; INVENTORY_OUT_OF_STOCK or PAYMENT_REFUNDED → CANCELLED.
     * Code: load order by id, mutate status field, JPA save.
     *
     * @param event deserialized saga event map from Kafka
     */
    @Transactional
    public void handleSagaEvent(Map<String, Object> event) {
        String type = (String) event.get("event");
        if (type == null) {
            return;
        }
        // orderId is serialised as Integer by Jackson when the value fits in 32 bits.
        Object rawId = event.get("orderId");
        if (rawId == null) {
            return;
        }
        Long orderId = ((Number) rawId).longValue();

        repo.findById(orderId).ifPresent(order -> {
            if ("INVENTORY_OK".equals(type)) {
                order.setStatus("COMPLETED");
                repo.save(order);
                log.info("Order {} completed", orderId);
            } else if ("INVENTORY_OUT_OF_STOCK".equals(type) || "PAYMENT_REFUNDED".equals(type)) {
                order.setStatus("CANCELLED");
                repo.save(order);
                log.info("Order {} cancelled ({})", orderId, type);
            }
        });
    }
}
