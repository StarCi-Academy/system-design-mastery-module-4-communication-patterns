# 6 — CQRS and Read Models

Two standalone NestJS apps:

- **`write-service`** — PostgreSQL (write DB), `@nestjs/cqrs` (`CommandHandler` + `EventsHandler`), publishes `CustomerProfileUpdatedEvent` over **RabbitMQ** via `@nestjs/microservices` (`Transport.RMQ`), event pattern `customer.profile.updated`, queue `cqrs.customer.profile`.
- **`read-service`** — RMQ microservice (`@EventPattern`) + **Elasticsearch** read model, `GET /customer/:id`.

PostgreSQL is exposed on host **5433** to avoid clashing with a local Postgres on 5432.

## Infra (Docker)

```bash
cd system-design-mastery-module-4-communication-patterns/6-cqrs-and-read-models/.docker
docker compose up -d
```

## Local dev (without Docker for services)

```bash
cd system-design-mastery-module-4-communication-patterns/6-cqrs-and-read-models/.docker
docker compose up -d rabbitmq postgres-cqrs-write elasticsearch

cd ../write-service && npm install && npm run start:dev
cd ../read-service  && npm install && npm run start:dev
```

Set `RABBITMQ_URL` (default `amqp://localhost:5672`), `RABBITMQ_QUEUE` (default `cqrs.customer.profile`), `WRITE_DB_*`, and `ELASTICSEARCH_NODE` to match your machine.

RabbitMQ management UI: http://localhost:15672 (guest / guest).

## Sample flow

```bash
curl -s -X POST http://localhost:3000/customer/update \
  -H "Content-Type: application/json" \
  -d '{"id":"123","name":"John Doe","email":"john@example.com"}'

curl -s http://localhost:3001/customer/123
```

## Teardown

```bash
cd system-design-mastery-module-4-communication-patterns/6-cqrs-and-read-models/.docker
docker compose down -v
```
