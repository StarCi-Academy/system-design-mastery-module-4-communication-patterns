/**
 * Payload event `order-events` từ Order Service.
 * (EN: `order-events` payload from Order Service.)
 */
export interface OrderEventPayload {
    productName?: string
    quantity?: number
}
