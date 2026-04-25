# Stock Market API

Simple REST API that simulates a stock market.

## Features

* Wallets can buy and sell stocks
* Bank controls available stocks
* Fixed stock price (1)
* Audit log of all successful operations
* Chaos endpoint to simulate instance failure
* Supports running multiple instances (high availability simulation)

---

## Run locally

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

```bash
docker build -t stock-market-app .
docker run -p 3000:3000 stock-market-app 3000
```

The port is passed as an argument to the application.

---

## Run multiple instances (high availability)

```bash
docker run -p 3000:3000 stock-market-app 3000
docker run -p 3001:3000 stock-market-app 3000
docker run -p 3002:3000 stock-market-app 3000
```

Each instance runs independently. Killing one instance does not affect others.

---

## API Endpoints

### Bank

* `GET /stocks` – get bank state
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
* `GET /wallets/{wallet_id}/stocks/{stock_name}` – get stock quantity

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

---

### Audit Log

* `GET /log` – get all successful operations

---

### Chaos

* `POST /chaos` – kills current instance

---

## High Availability

Application can be run in multiple instances (e.g. Docker containers).
Killing one instance does not affect others.

---

## Notes

* Data is stored in memory (no persistence)
* Designed for simplicity and clarity