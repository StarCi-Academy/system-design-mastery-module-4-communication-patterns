package com.starci.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * InventoryApplication — Spring Boot entry point for the Saga Inventory micro-service.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Exposes {@code POST /check} REST endpoint to manually trigger a stock check.</li>
 *   <li>Consumes {@code ORDER_CREATED} and {@code PAYMENT_CAPTURED} saga events from Kafka.</li>
 *   <li>Decrements product stock in MongoDB and emits {@code INVENTORY_OK} or
 *       {@code INVENTORY_OUT_OF_STOCK} reply events.</li>
 *   <li>Seeds two demo products on startup (id=1 stock=0, id=2 stock=50).</li>
 * </ul>
 */
@SpringBootApplication
public class InventoryApplication {

    /**
     * Launch the embedded Tomcat server.
     *
     * @param args command-line arguments passed from the container entrypoint
     */
    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }
}
