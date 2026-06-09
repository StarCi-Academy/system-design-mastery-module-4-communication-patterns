package com.starci.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * OrderApplication — Spring Boot entry point for the Saga Order micro-service.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Exposes {@code POST /order} REST endpoint to create orders in PostgreSQL.</li>
 *   <li>Emits {@code ORDER_CREATED} event to Kafka topic {@code saga.demo.events}.</li>
 *   <li>Consumes saga reply events ({@code INVENTORY_OK}, {@code INVENTORY_OUT_OF_STOCK},
 *       {@code PAYMENT_REFUNDED}) to update order status.</li>
 * </ul>
 */
@SpringBootApplication
public class OrderApplication {

    /**
     * Launch the embedded Tomcat server.
     *
     * @param args command-line arguments passed from the container entrypoint
     */
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
