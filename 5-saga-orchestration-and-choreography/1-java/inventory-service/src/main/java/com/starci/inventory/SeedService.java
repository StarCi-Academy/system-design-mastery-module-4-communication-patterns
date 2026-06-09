package com.starci.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * SeedService — seeds demo product documents into MongoDB on startup.
 *
 * <p>Seeds only when the collection is empty to avoid overwriting live data on restart.
 * Mirrors the TS {@code SeedService.onModuleInit()} which seeds:
 * <ul>
 *   <li>product id=1, stock=0 (always out-of-stock for demo)</li>
 *   <li>product id=2, stock=50 (sufficient stock for demo)</li>
 * </ul>
 */
@Component
public class SeedService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedService.class);

    private final ProductRepository products;

    /**
     * Constructor injection.
     *
     * @param products MongoDB repository to check and seed products
     */
    public SeedService(ProductRepository products) {
        this.products = products;
    }

    /**
     * Seed demo products if the collection is empty.
     *
     * <p>Logic: skip if count > 0, otherwise insert seed rows.
     * Code: repository.count() guard → repository.save().
     *
     * @param args application startup arguments (unused)
     */
    @Override
    public void run(ApplicationArguments args) {
        if (products.count() > 0) {
            // Collection already seeded — skip to avoid overwriting live data on restart.
            return;
        }
        products.save(new Product(1, 0));   // product 1 — intentionally out-of-stock for demo
        products.save(new Product(2, 50));  // product 2 — has sufficient stock
        log.info("Seeded 2 demo products (id=1 stock=0, id=2 stock=50)");
    }
}
