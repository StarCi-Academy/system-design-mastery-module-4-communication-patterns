package com.starci.inventory;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Product — MongoDB document in the {@code products} collection.
 *
 * <p>The {@code _id} is set manually to an Integer to mirror the TS lesson schema
 * where product id=1 and id=2 are pre-seeded.
 */
@Document(collection = "products")
public class Product {

    @Id
    // Integer id matches the seed values (1, 2) used in the TS SeedService.
    private Integer id;

    // Current stock level — decremented atomically on each successful fulfillment.
    private Integer stock;

    /** Default constructor required by Spring Data MongoDB. */
    public Product() {}

    /**
     * Convenience constructor for seeding.
     *
     * @param id    product identifier
     * @param stock initial stock level
     */
    public Product(Integer id, Integer stock) {
        this.id = id;
        this.stock = stock;
    }

    public Integer getId() { return id; }

    public void setId(Integer id) { this.id = id; }

    public Integer getStock() { return stock; }

    public void setStock(Integer stock) { this.stock = stock; }
}
