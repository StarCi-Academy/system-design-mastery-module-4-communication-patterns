package com.starci.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * OrderApplication — Spring Boot entry point for the Order micro-service.
 * Listens on port 3003 (see {@code application.properties}).
 */
@SpringBootApplication
public class OrderApplication {

    /**
     * Launch the embedded Tomcat server.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
