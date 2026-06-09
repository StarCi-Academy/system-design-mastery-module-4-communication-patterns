package com.starci.write.customer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Write Model entity — mapped to the "customers" table in PostgreSQL.
 * Mirrors TS Customer entity (id PrimaryColumn, name, email).
 */
@Entity
@Table(name = "customers")
public class Customer {

    /** Customer ID — client-supplied string, PK. */
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    public Customer() {}

    public Customer(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
