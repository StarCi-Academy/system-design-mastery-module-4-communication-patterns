package com.starci.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * JPA entity mapped to the {@code orders} table in PostgreSQL.
 *
 * <p>Schema mirrors the TypeScript TypeORM entity:
 * <ul>
 *   <li>{@code id} — auto-increment primary key</li>
 *   <li>{@code customer_id} — string, not null</li>
 *   <li>{@code total_amount} — DECIMAL(12, 2), not null</li>
 * </ul>
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stored as VARCHAR — maps to TypeScript customerId column.
    @Column(name = "customer_id", nullable = false)
    private String customerId;

    // DECIMAL(12,2) — mirrors { type: "decimal", precision: 12, scale: 2 }.
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    // Default constructor required by JPA.
    protected Order() {}

    public Order(String customerId, BigDecimal totalAmount) {
        this.customerId = customerId;
        this.totalAmount = totalAmount;
    }

    public Long getId() { return id; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
}
