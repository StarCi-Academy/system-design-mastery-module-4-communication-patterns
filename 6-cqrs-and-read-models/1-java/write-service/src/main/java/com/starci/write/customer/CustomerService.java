package com.starci.write.customer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Write-side service — upserts a customer in PostgreSQL, then publishes
 * a CustomerProfileUpdated event to RabbitMQ.
 *
 * <p>Flow mirrors TS UpsertCustomerHandler + RmqEventPublisher:
 * <ol>
 *   <li>Find by ID; create or update.</li>
 *   <li>Save to PostgreSQL (Write Model).</li>
 *   <li>Publish {@code customer.profile.updated} event to RabbitMQ queue.</li>
 * </ol>
 */
@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository repo;
    private final RabbitTemplate rabbitTemplate;

    public CustomerService(CustomerRepository repo, RabbitTemplate rabbitTemplate) {
        this.repo = repo;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Upsert a customer and emit the profile-updated event.
     *
     * @param id    customer ID (client-supplied string)
     * @param name  customer name
     * @param email customer email
     * @return the persisted Customer entity
     */
    @Transactional
    public Customer upsert(String id, String name, String email) {
        Customer row = repo.findById(id).orElse(null);
        if (row == null) {
            row = new Customer(id, name, email);
            log.info("Created new customer profile for ID \"{}\"", id);
        } else {
            row.setName(name);
            row.setEmail(email);
            log.info("Updated existing customer profile for ID \"{}\"", id);
        }
        repo.save(row);

        // Publish event to RabbitMQ so read-service can update Elasticsearch read model.
        log.info("Broadcasting \"{}\" for customer \"{}\"", RabbitMqConfig.ROUTING_KEY, id);
        rabbitTemplate.convertAndSend(
                RabbitMqConfig.QUEUE,
                new CustomerProfileEvent(id, name, email)
        );
        log.info("Broadcast completed for \"{}\" and customer \"{}\"", RabbitMqConfig.ROUTING_KEY, id);

        return row;
    }
}
