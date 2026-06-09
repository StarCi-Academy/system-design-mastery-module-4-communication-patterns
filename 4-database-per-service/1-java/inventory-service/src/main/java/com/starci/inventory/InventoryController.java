package com.starci.inventory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller — {@code POST /inventory}.
 *
 * <p>Mirrors the TS {@code InventoryController} — delegates to
 * {@link InventoryService#create} and returns the saved document.
 */
@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Create a new product with an initial stock level.
     *
     * @param req body with name and stock
     * @return the saved product with HTTP 201
     */
    @PostMapping
    public ResponseEntity<Product> create(@RequestBody CreateProductRequest req) {
        Product saved = inventoryService.create(req.getName(), req.getStock());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
