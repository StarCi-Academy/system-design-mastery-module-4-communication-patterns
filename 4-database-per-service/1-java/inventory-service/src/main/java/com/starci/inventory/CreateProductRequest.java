package com.starci.inventory;

/**
 * REST request body for {@code POST /inventory}.
 *
 * <p>Mirrors the TS controller body: {@code { name: string, stock: number }}.
 */
public class CreateProductRequest {

    private String name;
    private int stock;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
}
