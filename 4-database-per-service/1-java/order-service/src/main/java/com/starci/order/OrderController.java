package com.starci.order;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller — {@code POST /orders}.
 *
 * <p>Mirrors the TS {@code OrdersController} — delegates directly to
 * {@link OrderService#create} and returns the saved entity.
 */
@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Create an order, persist to PostgreSQL, and emit a Kafka event.
     *
     * @param req body with customerId, totalAmount, and optional productName / quantity
     * @return the saved order with HTTP 201
     */
    @PostMapping
    public ResponseEntity<Order> create(@RequestBody CreateOrderRequest req) {
        Order saved = orderService.create(
                req.getCustomerId(),
                req.getTotalAmount(),
                req.getProductName(),
                req.getQuantity()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
