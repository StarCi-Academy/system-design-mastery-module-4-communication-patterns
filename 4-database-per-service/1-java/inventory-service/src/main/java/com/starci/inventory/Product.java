package com.starci.inventory;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB document mapped to the {@code products} collection.
 *
 * <p>Mirrors the Mongoose {@code Product} schema:
 * <ul>
 *   <li>{@code name} — required string</li>
 *   <li>{@code stock} — required integer</li>
 * </ul>
 */
@Document(collection = "products")
public class Product {

    @Id
    private String id;

    // Product name — used as the lookup key during stock decrement.
    private String name;

    // Current stock quantity.
    private int stock;

    // Default constructor required by Spring Data MongoDB.
    public Product() {}

    public Product(String name, int stock) {
        this.name = name;
        this.stock = stock;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
}
