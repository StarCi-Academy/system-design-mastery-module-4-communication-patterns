package com.starci.order;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for {@link Order}.
 *
 * <p>Equivalent to the TypeORM {@code Repository<Order>} injected into
 * {@code OrdersService} via {@code @InjectRepository(Order)}.
 */
public interface OrderRepository extends JpaRepository<Order, Long> {
}
