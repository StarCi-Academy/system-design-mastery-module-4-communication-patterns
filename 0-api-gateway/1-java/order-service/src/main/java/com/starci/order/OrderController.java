package com.starci.order;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * OrderController — REST controller that manages orders in memory.
 *
 * <p>Business invariant: every order starts in {@code "PENDING"} state.
 * This rule lives in the service, not the gateway. The gateway is a
 * transparent pass-through that only routes by path prefix.
 */
@RestController
@RequestMapping("/orders")
public class OrderController {

    /**
     * Thread-safe in-memory order list.
     */
    private final List<Order> orders = Collections.synchronizedList(new ArrayList<>());

    /**
     * Thread-safe auto-increment id counter.
     */
    private final AtomicLong counter = new AtomicLong(0);

    /**
     * Create a new order in PENDING state and return it with HTTP 201.
     *
     * @param order request body with productId and quantity
     * @return created order with status PENDING and HTTP 201
     */
    @PostMapping
    public ResponseEntity<Order> create(@RequestBody Order order) {
        long id = counter.incrementAndGet();
        // Business rule: orders always start PENDING — the gateway does not set this.
        Order created = new Order(id, order.getProductId(), order.getQuantity(), "PENDING");
        orders.add(created);
        // HTTP 201 is relayed verbatim by the gateway to the client.
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Return the list of all orders (HTTP 200).
     *
     * @return snapshot of all in-memory orders
     */
    @GetMapping
    public Collection<Order> getAll() {
        synchronized (orders) { return new ArrayList<>(orders); }
    }
}
