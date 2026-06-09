package com.starci.inventory;

import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * FulfillmentRepository — Spring Data MongoDB repository for {@link Fulfillment} documents.
 *
 * <p>Used for idempotency checks: if a fulfillment with the given orderId already
 * exists, the event is a duplicate and must be skipped.
 */
public interface FulfillmentRepository extends MongoRepository<Fulfillment, Long> {
}
