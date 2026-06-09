package com.starci.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Notification consumer Spring Boot application.
 * The app starts, connects to Kafka, and listens for ORDER_CREATED events.
 */
@SpringBootApplication
public class NotificationApplication {

    /**
     * Main method — delegates to Spring Boot launcher.
     * @param args command-line arguments (unused in this demo)
     */
    public static void main(String[] args) {
        SpringApplication.run(NotificationApplication.class, args);
    }
}
