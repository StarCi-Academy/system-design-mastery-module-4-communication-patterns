package com.starci.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * GatewayApplication — Spring Boot entry point for the API Gateway service.
 *
 * <p>The gateway listens on port 8000 and proxies client requests to the correct
 * internal service (user-service:3001, product-service:3002, order-service:3003)
 * based on the path prefix. It exposes a single entry point to the outside world.
 */
@SpringBootApplication
public class GatewayApplication {

    /**
     * Launch the Spring Boot application.
     *
     * @param args command-line arguments passed to Spring
     */
    public static void main(String[] args) {
        // Start the embedded Tomcat server and wire up all Spring beans.
        SpringApplication.run(GatewayApplication.class, args);
    }
}
