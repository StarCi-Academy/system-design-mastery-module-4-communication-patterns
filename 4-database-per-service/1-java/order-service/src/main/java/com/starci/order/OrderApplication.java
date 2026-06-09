package com.starci.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point — Order Service.
 *
 * <p>Starts the Spring Boot application that exposes {@code POST /orders},
 * persists rows to PostgreSQL, and emits {@code order-events} to Kafka.
 */
@SpringBootApplication
public class OrderApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
