package com.starci.order;

/**
 * Request body for POST /orders — deserialized from JSON by Spring MVC.
 *
 * @param productName name of the product to order
 * @param quantity    number of units to order
 */
public record CreateOrderDto(String productName, int quantity) {}
