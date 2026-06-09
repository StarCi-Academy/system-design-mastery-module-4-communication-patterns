package com.starci.order;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * OrderRepository — Spring Data JPA repository for {@link Order} entities.
 *
 * <p>Inherits {@code save}, {@code findById}, {@code findAll}, etc. from
 * {@link JpaRepository}. Custom queries added here if needed.
 */
public interface OrderRepository extends JpaRepository<Order, Long> {
}
