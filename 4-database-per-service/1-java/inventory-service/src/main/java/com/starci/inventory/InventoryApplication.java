package com.starci.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point — Inventory Service.
 *
 * <p>Starts the Spring Boot application that exposes {@code POST /inventory},
 * stores products in MongoDB, and decrements stock on {@code order-events} Kafka messages.
 */
@SpringBootApplication
public class InventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }
}
