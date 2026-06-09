package com.starci.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * REST controller for the Order producer.
 * POST /orders — create order + publish ORDER_CREATED event (fire-and-forget).
 * GET  /orders — list all in-memory orders created this session.
 */
@RestController
@RequestMapping("/orders")
public class OrderController {

    // ConcurrentHashMap because Spring MVC is multi-threaded (Tomcat thread pool)
    private final Map<Integer, Order> orders = new ConcurrentHashMap<>();

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Create an order and publish ORDER_CREATED event to Kafka topic `order-events`.
     * Returns immediately after publishing — does NOT wait for any consumer.
     * This is the core temporal-decoupling pattern.
     *
     * @param dto incoming request body with productName and quantity
     * @return HTTP 201 with the created order (status always PENDING)
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderDto dto) {
        // Generate a random order ID — replace with a DB sequence in production
        int orderId = ThreadLocalRandom.current().nextInt(1, 100000);
        Order order = new Order(orderId, dto.productName(), dto.quantity(), "PENDING");
        orders.put(orderId, order);

        try {
            // Build the event payload with all fields consumers need
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("eventType", "ORDER_CREATED");
            event.put("orderId", orderId);
            event.put("productName", dto.productName());
            event.put("quantity", dto.quantity());
            event.put("timestamp", Instant.now().toString());

            // Serialize the event to a JSON string, then fire-and-forget to `order-events`
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("order-events", message);
        } catch (Exception e) {
            // Log and continue — event publish failure should not block order creation in this demo
            e.printStackTrace();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /**
     * List all orders created in the current session (in-memory only).
     * Useful for verifying that GET /orders returns previously created orders.
     *
     * @return HTTP 200 with array of all orders
     */
    @GetMapping
    public ResponseEntity<List<Order>> getOrders() {
        return ResponseEntity.ok(new ArrayList<>(orders.values()));
    }
}
