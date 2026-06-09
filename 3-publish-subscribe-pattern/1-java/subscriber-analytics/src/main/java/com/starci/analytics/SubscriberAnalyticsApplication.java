package com.starci.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot entry point for the analytics subscriber service.
 * Subscribes to the NATS subject app.events and logs received events (simulating metrics updates).
 */
@SpringBootApplication
public class SubscriberAnalyticsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubscriberAnalyticsApplication.class, args);
    }
}
