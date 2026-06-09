package com.starci.eventstore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * EventStoreApplication — Spring Boot entry point for the Event Store Service.
 *
 * <p>Accepts commands (POST) to append domain events to an append-only PostgreSQL
 * table, and returns projections (GET) by replaying the event log.
 * Supports snapshots and time-travel queries.
 */
@SpringBootApplication
public class EventStoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventStoreApplication.class, args);
    }
}
