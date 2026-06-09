package com.starci.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Business logic for inventory management.
 *
 * <p>Mirrors TS {@code InventoryService}:
 * <ul>
 *   <li>{@link #create} — inserts a new product document into MongoDB.</li>
 *   <li>{@link #decrementStockByProductName} — finds by name and decrements
 *       stock only when sufficient quantity exists.</li>
 * </ul>
 */
@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final ProductRepository repo;

    public InventoryService(ProductRepository repo) {
        this.repo = repo;
    }

    /**
     * Create a new product with an initial stock level.
     *
     * @param name  product name
     * @param stock initial stock quantity
     * @return the saved {@link Product} document
     */
    public Product create(String name, int stock) {
        // Mirrors: new this.product({ name, stock }) → doc.save().
        return repo.save(new Product(name, stock));
    }

    /**
     * Decrement stock by product name when receiving an order event.
     *
     * <p>Mirrors TS logic:
     * {@code findOne({ name }) → check stock >= quantity → doc.stock -= quantity → save()}.
     *
     * @param name     product name to look up
     * @param quantity units to deduct
     * @return updated product, or {@code null} if not found or insufficient stock
     */
    public Product decrementStockByProductName(String name, int quantity) {
        Optional<Product> found = repo.findByName(name);
        if (found.isEmpty() || found.get().getStock() < quantity) {
            // TS returns null in both cases.
            return null;
        }
        Product doc = found.get();
        log.info("Decrementing stock for \"{}\" by {}", name, quantity);
        doc.setStock(doc.getStock() - quantity);
        return repo.save(doc);
    }
}
