package com.starci.inventory;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for {@link Product}.
 *
 * <p>Equivalent to the Mongoose {@code Model<ProductDocument>} injected into
 * {@code InventoryService} via {@code @InjectModel(Product.name)}.
 */
public interface ProductRepository extends MongoRepository<Product, String> {

    /**
     * Look up a product by its name — mirrors Mongoose {@code findOne({ name })}.
     *
     * @param name product name
     * @return product if found
     */
    Optional<Product> findByName(String name);
}
