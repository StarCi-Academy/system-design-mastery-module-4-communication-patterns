package com.starci.order;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * OrderController — HTTP REST controller; delegates to {@link OrderService}.
 *
 * <p>Endpoint mirrors the TS lesson contract:
 * <pre>POST /order  { productId, quantity } → { id, productId, quantity, status }</pre>
 */
@RestController
public class OrderController {

    private final OrderService orders;

    /**
     * Constructor injection.
     *
     * @param orders order service containing saga choreography logic
     */
    public OrderController(OrderService orders) {
        this.orders = orders;
    }

    /**
     * Create a new order in PENDING state and emit ORDER_CREATED to Kafka.
     *
     * <p>Logic: delegate to service which persists and emits.
     * Code: POST /order → OrderService.create() → return 201 with entity.
     *
     * @param body request body containing productId and quantity
     * @return HTTP 201 with the created order
     */
    @PostMapping("/order")
    public ResponseEntity<Order> create(@RequestBody CreateOrderRequest body) {
        Order order = orders.create(body.getProductId(), body.getQuantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}
