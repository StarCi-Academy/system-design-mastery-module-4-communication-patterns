/** Nest RMQ emit / @EventPattern — must match read-service */
export const CUSTOMER_PROFILE_EVENT = 'customer.profile.updated';

/** Queue — must match read-service microservice `queue` option */
export const CUSTOMER_PROFILE_QUEUE = 'cqrs.customer.profile';
