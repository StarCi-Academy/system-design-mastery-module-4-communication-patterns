package com.starci.product;

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
 * ProductController — REST controller that manages products in memory.
 *
 * <p>The service is unaware of the gateway. It handles {@code POST /products}
 * and {@code GET /products} as standard REST endpoints.
 */
@RestController
@RequestMapping("/products")
public class ProductController {

    /**
     * Thread-safe in-memory product list — synchronized to handle Tomcat's worker pool.
     */
    private final List<Product> products = Collections.synchronizedList(new ArrayList<>());

    /**
     * Thread-safe counter for assigning sequential ids.
     */
    private final AtomicLong counter = new AtomicLong(0);

    /**
     * Create a new product and return it with HTTP 201.
     *
     * @param product request body with name, price, and stock
     * @return created product with 201 status
     */
    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product) {
        long id = counter.incrementAndGet();
        Product created = new Product(id, product.getName(), product.getPrice(), product.getStock());
        products.add(created);
        // HTTP 201 is the correct REST status for resource creation.
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Return the list of all products (HTTP 200).
     *
     * @return snapshot of all in-memory products
     */
    @GetMapping
    public Collection<Product> getAll() {
        synchronized (products) { return new ArrayList<>(products); }
    }
}
