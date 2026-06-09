package com.starci.order;

/**
 * Immutable order record returned to the HTTP client after creation.
 * All fields are set at construction time; no setters — avoids accidental mutation.
 *
 * @param id          randomly generated order identifier
 * @param productName name of the product ordered
 * @param quantity    number of units ordered
 * @param status      always "PENDING" at creation (consumer processing is async)
 */
public record Order(int id, String productName, int quantity, String status) {}
