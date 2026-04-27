# Stock Market API

Simple REST API that simulates a stock market.

## Features

* Wallets can buy and sell stocks
* Bank controls available stocks
* Fixed stock price (1)
* Audit log of all successful operations
* Chaos endpoint to simulate instance failure
* Supports running multiple instances with shared state (Redis)

---

## Run locally

### 1. Start Redis

```bash
docker run -d -p 6379:6379 redis
```

### 2. Run app

```bash
npm install
npx ts-node src/index.ts 3000
```

The port is passed as a command-line argument.

Example:

```bash
npx ts-node src/index.ts 8080
```

---

## Run with Docker

### 1. Start Redis

```bash
docker run -d -p 6379:6379 redis
```

### 2. Build and run app

```bash
docker build -t stock-market-app .
docker run -p 3000:3000 stock-market-app 3000
```

The application connects to Redis at:

```
redis://host.docker.internal:6379
```

---

## Run multiple instances (high availability)

```bash
docker run -p 3000:3000 stock-market-app 3000
docker run -p 3001:3000 stock-market-app 3000
docker run -p 3002:3000 stock-market-app 3000
```

All instances share the same Redis datastore.

Killing one instance does not affect others, and data remains consistent across all instances.

---

## API Endpoints

### Bank

* `GET /stocks` – get current bank state
* `POST /stocks` – set bank state

### Example: initialize bank

```json
POST /stocks

{
  "stocks": [
    { "name": "apple", "quantity": 15 },
    { "name": "netflix", "quantity": 11 }
  ]
}
```

---

### Wallets

* `GET /wallets/{wallet_id}` – get wallet state
* `GET /wallets/{wallet_id}/stocks/{stock_name}` – get stock quantity (returns plain number)

---

### Transactions

* `POST /wallets/{wallet_id}/stocks/{stock_name}`

Body:

```json
{ "type": "buy" }
```

or

```json
{ "type": "sell" }
```

Returns:

* `200` – success
* `400` – invalid operation (e.g. insufficient stock)
* `404` – stock does not exist

---

### Audit Log

* `GET /log` – returns all successful wallet operations (shared across instances)

---

### Chaos

* `POST /chaos` – terminates current instance

---

## High Availability

The system uses Redis as a shared datastore, allowing multiple instances to operate on the same data.

If one instance is terminated, other instances continue working without data loss.

---

## Notes

* Data is stored in Redis (in-memory datastore)
* All instances share the same state
* Designed for simplicity and clarity
* To reset the system state, remove and recreate the Redis container:

```bash
docker rm -f <redis_container_id>
docker run -d -p 6379:6379 redis
```

---

## Compatibility

The application can be run on both x64 and ARM64 architectures.
Docker uses a multi-architecture Node.js image (`node:20`), so it works across different environments without additional configuration.