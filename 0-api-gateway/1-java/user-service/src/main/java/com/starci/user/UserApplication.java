package com.starci.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * UserApplication — Spring Boot entry point for the User micro-service.
 *
 * <p>Listens on port 3001 (configured in {@code application.properties}).
 * Exposed only on the Docker internal network; the API Gateway proxies
 * external traffic to this service.
 */
@SpringBootApplication
public class UserApplication {

    /**
     * Launch the embedded Tomcat server for the user-service.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(UserApplication.class, args);
    }
}
