package com.starci.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Inventory consumer Spring Boot application.
 * The app starts, connects to Kafka, and listens for ORDER_CREATED events.
 */
@SpringBootApplication
public class InventoryApplication {

    /**
     * Main method — delegates to Spring Boot launcher.
     * @param args command-line arguments (unused in this demo)
     */
    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }
}
