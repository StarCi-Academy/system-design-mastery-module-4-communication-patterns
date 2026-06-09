package com.starci.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * StockService — core saga choreography logic for inventory reservation.
 *
 * <p>Logic:
 * <ol>
 *   <li>{@link #tryFulfill} — idempotency check, stock validation, decrement, emit reply event.</li>
 *   <li>{@link #handleSagaEvent} — route ORDER_CREATED / PAYMENT_CAPTURED events to tryFulfill.</li>
 * </ol>
 */
@Service
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final ProductRepository products;
    private final FulfillmentRepository fulfillments;
    private final KafkaTemplate<String, Object> kafka;

    /**
     * Constructor injection.
     *
     * @param products     MongoDB repository for product stock documents
     * @param fulfillments MongoDB repository for idempotency fulfillment records
     * @param kafka        Spring Kafka producer template for saga reply events
     */
    public StockService(ProductRepository products,
                        FulfillmentRepository fulfillments,
                        KafkaTemplate<String, Object> kafka) {
        this.products = products;
        this.fulfillments = fulfillments;
        this.kafka = kafka;
    }

    /**
     * Attempt to fulfill the stock reservation for an order.
     *
     * <p>Logic:
     * <ul>
     *   <li>Idempotency: skip if fulfillment record already exists for this orderId.</li>
     *   <li>Validate: emit INVENTORY_OUT_OF_STOCK if product missing or stock insufficient.</li>
     *   <li>Commit: decrement stock in MongoDB, save fulfillment record, emit INVENTORY_OK.</li>
     * </ul>
     *
     * @param orderId   order identifier from the saga event
     * @param productId product to reserve stock for
     * @param quantity  units requested
     * @return result object describing the outcome
     */
    public InventoryCheckResult tryFulfill(Long orderId, Long productId, Integer quantity) {
        // Idempotency check: skip duplicate events that have already been processed.
        if (fulfillments.existsById(orderId)) {
            InventoryCheckResult result = new InventoryCheckResult();
            result.setOk(true);
            result.setOrderId(orderId);
            result.setProductId(productId);
            result.setQuantity(quantity);
            result.setStatus("ALREADY_FULFILLED");
            result.setMessage("Order has already been fulfilled");
            return result;
        }

        // Load product from MongoDB — Integer id matches the seeded values (1, 2).
        Optional<Product> productOpt = products.findById(productId.intValue());

        if (productOpt.isEmpty() || productOpt.get().getStock() < quantity) {
            // Emit compensating event so the order-service can cancel the order.
            Map<String, Object> outOfStockEvent = new HashMap<>();
            outOfStockEvent.put("event", "INVENTORY_OUT_OF_STOCK");
            outOfStockEvent.put("orderId", orderId);
            outOfStockEvent.put("productId", productId);
            kafka.send(SagaConstants.TOPIC, outOfStockEvent);
            log.info("Out of stock for order {}", orderId);

            InventoryCheckResult result = new InventoryCheckResult();
            result.setOk(false);
            result.setOrderId(orderId);
            result.setProductId(productId);
            result.setQuantity(quantity);
            result.setStatus("OUT_OF_STOCK");
            result.setMessage("Product is out of stock for requested quantity");
            result.setRemainingStock(productOpt.map(Product::getStock).orElse(0));
            return result;
        }

        // Decrement stock and persist the fulfillment marker atomically in saga step order.
        Product product = productOpt.get();
        product.setStock(product.getStock() - quantity);
        products.save(product);
        fulfillments.save(new Fulfillment(orderId, "DONE"));

        // Emit success event so the order-service transitions the order to COMPLETED.
        Map<String, Object> okEvent = new HashMap<>();
        okEvent.put("event", "INVENTORY_OK");
        okEvent.put("orderId", orderId);
        okEvent.put("productId", productId);
        okEvent.put("quantity", quantity);
        kafka.send(SagaConstants.TOPIC, okEvent);
        log.info("Fulfilled order {}", orderId);

        InventoryCheckResult result = new InventoryCheckResult();
        result.setOk(true);
        result.setOrderId(orderId);
        result.setProductId(productId);
        result.setQuantity(quantity);
        result.setStatus("FULFILLED");
        result.setMessage("Inventory reserved successfully");
        result.setRemainingStock(product.getStock());
        return result;
    }

    /**
     * Route an incoming saga event to the appropriate handler.
     *
     * <p>Logic: ORDER_CREATED triggers direct fulfillment (simplified choreography without
     * a separate payment step); PAYMENT_CAPTURED triggers fulfillment after payment succeeds.
     *
     * @param event deserialized saga event map from Kafka
     */
    public void handleSagaEvent(Map<String, Object> event) {
        String type = (String) event.get("event");
        if (type == null) {
            return;
        }
        // Both ORDER_CREATED and PAYMENT_CAPTURED trigger an inventory reservation attempt.
        if ("ORDER_CREATED".equals(type) || "PAYMENT_CAPTURED".equals(type)) {
            Long orderId = ((Number) event.get("orderId")).longValue();
            Long productId = ((Number) event.get("productId")).longValue();
            Integer quantity = ((Number) event.get("quantity")).intValue();
            tryFulfill(orderId, productId, quantity);
        }
    }
}
