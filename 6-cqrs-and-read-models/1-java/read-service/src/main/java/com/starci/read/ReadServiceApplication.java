package com.starci.read;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CQRS Read Service — consumes CustomerProfileUpdated events from RabbitMQ,
 * projects them into Elasticsearch, and serves GET /customer/:id queries.
 */
@SpringBootApplication
public class ReadServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReadServiceApplication.class, args);
    }
}
