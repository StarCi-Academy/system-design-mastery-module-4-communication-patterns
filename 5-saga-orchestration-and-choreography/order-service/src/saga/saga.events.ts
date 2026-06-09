export type SagaEvent =
  | {
      event: "ORDER_CREATED";
      orderId: number;
      productId: number;
      quantity: number;
    }
  | {
      event: "PAYMENT_CAPTURED";
      orderId: number;
      productId: number;
      quantity: number;
      amount: number;
    }
  | {
      event: "INVENTORY_OK";
      orderId: number;
      productId: number;
      quantity: number;
    }
  | {
      event: "INVENTORY_OUT_OF_STOCK";
      orderId: number;
      productId: number;
    }
  | { event: "PAYMENT_REFUNDED"; orderId: number };
