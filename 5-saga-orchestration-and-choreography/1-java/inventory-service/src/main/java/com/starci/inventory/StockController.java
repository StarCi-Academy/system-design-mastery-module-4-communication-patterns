package com.starci.inventory;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * StockController — REST controller for manual inventory check.
 *
 * <p>Mirrors the TS lesson's {@code POST /check} endpoint which lets callers
 * manually trigger a stock reservation outside of the Kafka flow.
 */
@RestController
public class StockController {

    private final StockService stock;

    /**
     * Constructor injection.
     *
     * @param stock service containing saga inventory logic
     */
    public StockController(StockService stock) {
        this.stock = stock;
    }

    /**
     * Manually trigger a stock reservation check.
     *
     * <p>Logic: delegate to StockService.tryFulfill() which handles idempotency,
     * validation, MongoDB update, and Kafka event emission.
     * Code: POST /check → StockService.tryFulfill() → return result.
     *
     * @param body request body with orderId, productId, and quantity
     * @return fulfillment result
     */
    @PostMapping("/check")
    public ResponseEntity<InventoryCheckResult> check(@RequestBody CheckRequest body) {
        InventoryCheckResult result = stock.tryFulfill(
                body.getOrderId(), body.getProductId(), body.getQuantity());
        return ResponseEntity.ok(result);
    }
}
