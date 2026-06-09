package com.starci.read.customer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ consumer — listens on "cqrs.customer.profile" queue and projects
 * each event into the Elasticsearch read model.
 *
 * <p>Mirrors TS CustomerProfileRmqController @EventPattern handler:
 * <pre>
 *   receive customer.profile.updated → upsertCustomer → Elasticsearch
 * </pre>
 */
@Component
public class CustomerProfileListener {

    private static final Logger log = LoggerFactory.getLogger(CustomerProfileListener.class);

    private final CustomerReadService readService;

    public CustomerProfileListener(CustomerReadService readService) {
        this.readService = readService;
    }

    /**
     * Handle a CustomerProfileEvent from the RabbitMQ queue.
     * Upserts the document into Elasticsearch so the query side is eventually consistent.
     *
     * @param event the deserialized event payload
     */
    @RabbitListener(queues = RabbitMqConfig.QUEUE)
    public void handleProfileUpdated(CustomerProfileEvent event) {
        log.info("Received \"customer.profile.updated\" for customer \"{}\"", event.getId());
        try {
            readService.upsertCustomer(new CustomerDoc(event.getId(), event.getName(), event.getEmail()));
            log.info("Processed \"customer.profile.updated\" for customer \"{}\"", event.getId());
        } catch (Exception e) {
            log.error("Failed to process customer profile event for ID \"{}\"", event.getId(), e);
            throw e;
        }
    }
}
