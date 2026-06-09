package com.starci.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Business logic for order creation.
 *
 * <p>Mirrors TS {@code OrdersService}:
 * <ol>
 *   <li>Persist the order row to PostgreSQL via JPA.</li>
 *   <li>Emit an {@code order-events} Kafka event with the saved id.</li>
 * </ol>
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    // Topic name matches the TS emit target exactly.
    private static final String TOPIC = "order-events";

    private final OrderRepository repo;
    private final KafkaTemplate<String, OrderEventPayload> kafka;

    public OrderService(OrderRepository repo,
                        KafkaTemplate<String, OrderEventPayload> kafka) {
        this.repo = repo;
        this.kafka = kafka;
    }

    /**
     * Persist the order and emit a Kafka event.
     *
     * @param customerId   customer identifier
     * @param totalAmount  order total — rounded to 2 decimal places (mirrors JS {@code toFixed(2)})
     * @param productName  optional product name forwarded to inventory
     * @param quantity     optional quantity forwarded to inventory
     * @return the saved {@link Order} JPA entity
     */
    @Transactional
    public Order create(String customerId, BigDecimal totalAmount,
                        String productName, Integer quantity) {
        // Round to 2dp — mirrors TS totalAmount.toFixed(2).
        BigDecimal rounded = totalAmount.setScale(2, RoundingMode.HALF_UP);
        Order order = new Order(customerId, rounded);
        Order saved = repo.save(order);

        OrderEventPayload payload = new OrderEventPayload(
                saved.getId(),
                saved.getCustomerId(),
                saved.getTotalAmount(),
                productName,
                quantity
        );
        // Fire-and-forget emit — mirrors TS kafka.emit("order-events", payload).
        kafka.send(TOPIC, String.valueOf(saved.getId()), payload);
        log.info("Emitted order-events for orderId={}", saved.getId());

        return saved;
    }
}
