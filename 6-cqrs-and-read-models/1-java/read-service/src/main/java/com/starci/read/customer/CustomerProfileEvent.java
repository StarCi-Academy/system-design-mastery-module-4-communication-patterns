package com.starci.read.customer;

/**
 * Inbound event payload received from RabbitMQ.
 * Must match the write-service published shape: { id, name, email }.
 */
public class CustomerProfileEvent {
    private String id;
    private String name;
    private String email;

    public CustomerProfileEvent() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
