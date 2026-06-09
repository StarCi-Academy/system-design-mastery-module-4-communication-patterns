package com.starci.product;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ProductApplication — Spring Boot entry point for the Product micro-service.
 * Listens on port 3002 (see {@code application.properties}).
 */
@SpringBootApplication
public class ProductApplication {

    /**
     * Launch the embedded Tomcat server.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(ProductApplication.class, args);
    }
}
