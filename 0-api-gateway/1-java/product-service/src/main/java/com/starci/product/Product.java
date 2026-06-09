package com.starci.product;

/**
 * Product — domain record representing a product managed by the product-service.
 */
public class Product {

    /** Auto-assigned integer id set by the service on creation. */
    private long id;

    /** Product display name. */
    private String name;

    /** Unit price in whole currency units. */
    private double price;

    /** Number of units in stock. */
    private int stock;

    /** No-arg constructor required by Jackson for deserialization. */
    public Product() {}

    /**
     * Full constructor used when creating a new product record.
     *
     * @param id    auto-increment id
     * @param name  product name
     * @param price unit price
     * @param stock stock count
     */
    public Product(long id, String name, double price, int stock) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    /** @return the product id */
    public long getId() { return id; }

    /** @return the product name */
    public String getName() { return name; }

    /** @return the unit price */
    public double getPrice() { return price; }

    /** @return the stock count */
    public int getStock() { return stock; }

    /** @param id sets the id */
    public void setId(long id) { this.id = id; }

    /** @param name sets the product name */
    public void setName(String name) { this.name = name; }

    /** @param price sets the unit price */
    public void setPrice(double price) { this.price = price; }

    /** @param stock sets the stock count */
    public void setStock(int stock) { this.stock = stock; }
}
