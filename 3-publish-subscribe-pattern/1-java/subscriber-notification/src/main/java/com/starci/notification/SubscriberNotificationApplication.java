package com.starci.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot entry point for the notification subscriber service.
 * Subscribes to the NATS subject app.events and logs received events (simulating email/push).
 */
@SpringBootApplication
public class SubscriberNotificationApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubscriberNotificationApplication.class, args);
    }
}
