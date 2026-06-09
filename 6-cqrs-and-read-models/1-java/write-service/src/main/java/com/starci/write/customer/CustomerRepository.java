package com.starci.write.customer;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for the Customer write model.
 */
public interface CustomerRepository extends JpaRepository<Customer, String> {
}
