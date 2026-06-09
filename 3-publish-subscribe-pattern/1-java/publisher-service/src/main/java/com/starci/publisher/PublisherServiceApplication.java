package com.starci.publisher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot entry point for the publisher service.
 * Accepts POST /events and emits an event envelope on the NATS subject app.events fire-and-forget.
 */
@SpringBootApplication
public class PublisherServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PublisherServiceApplication.class, args);
    }
}
