package com.starci.write.customer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Write-side REST controller.
 *
 * <p>Mirrors TS CustomerController:
 * <pre>
 *   POST /customer/update  { id, name, email }  →  upsert PostgreSQL + emit RabbitMQ event
 * </pre>
 */
@RestController
@RequestMapping("/customer")
public class CustomerController {

    private static final Logger log = LoggerFactory.getLogger(CustomerController.class);

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    /**
     * Upsert a customer profile (create or update) and publish an event.
     *
     * @param body request body with id, name, email
     * @return the persisted customer
     */
    @PostMapping("/update")
    public ResponseEntity<Customer> update(@RequestBody UpsertRequest body) {
        log.info("Received update request for customer \"{}\"", body.getId());
        Customer saved = service.upsert(body.getId(), body.getName(), body.getEmail());
        return ResponseEntity.ok(saved);
    }
}
