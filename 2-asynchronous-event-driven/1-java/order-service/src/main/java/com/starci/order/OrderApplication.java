package com.starci.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Order producer Spring Boot application.
 * Starts the HTTP server and Kafka producer.
 */
@SpringBootApplication
public class OrderApplication {

    /**
     * Main method — delegates to Spring Boot launcher.
     * @param args command-line arguments (unused in this demo)
     */
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
