package com.starci.read.customer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-side REST controller.
 *
 * <p>Mirrors TS CustomerController (read-service):
 * <pre>
 *   GET /customer/:id  →  lookup Elasticsearch read model, 404 if not found
 * </pre>
 */
@RestController
@RequestMapping("/customer")
public class CustomerController {

    private final CustomerReadService readService;

    public CustomerController(CustomerReadService readService) {
        this.readService = readService;
    }

    /**
     * Retrieve a customer by ID from the Elasticsearch read model.
     *
     * @param id customer ID
     * @return 200 with CustomerDoc body, or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomerDoc> get(@PathVariable String id) {
        CustomerDoc doc = readService.getById(id);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(doc);
    }
}
