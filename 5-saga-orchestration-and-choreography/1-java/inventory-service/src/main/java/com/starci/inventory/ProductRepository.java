package com.starci.inventory;

import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * ProductRepository — Spring Data MongoDB repository for {@link Product} documents.
 */
public interface ProductRepository extends MongoRepository<Product, Integer> {
}
