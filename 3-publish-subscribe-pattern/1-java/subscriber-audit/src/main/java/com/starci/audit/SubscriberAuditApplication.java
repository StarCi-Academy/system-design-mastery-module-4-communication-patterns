package com.starci.audit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot entry point for the audit subscriber service.
 * Subscribes to the NATS subject app.events and logs received events (simulating audit log writes).
 */
@SpringBootApplication
public class SubscriberAuditApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubscriberAuditApplication.class, args);
    }
}
