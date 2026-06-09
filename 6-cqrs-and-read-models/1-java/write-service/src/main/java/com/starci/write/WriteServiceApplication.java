package com.starci.write;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CQRS Write Service — receives POST commands, persists to PostgreSQL,
 * emits CustomerProfileUpdated events to RabbitMQ.
 */
@SpringBootApplication
public class WriteServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(WriteServiceApplication.class, args);
    }
}
