import express from "express";
import { Request, Response, NextFunction } from "express";
import { createClient } from "redis";

const redis = createClient({
    url: "redis://host.docker.internal:6379"
});

(async () => {
    try {
        await redis.connect();
        console.log("Connected to Redis");
    } catch (err) {
        console.error("Redis connection error", err);
    }
})();

const app = express();
app.use(express.json());
const port = Number(process.argv[2]) || 3000;

app.get("/stocks", async (req, res) => {
    const cached = await redis.get("cache:stocks");
    if (cached) {
        return res.json({ stocks: JSON.parse(cached) });
    }
    const keys = await redis.keys("bank:*");
    const stocks = await Promise.all(
        keys.map(async (key) => {
            const name = key.split(":")[1];
            const qty = await redis.get(key);
            return {
                name,
                quantity: Number(qty)
            };
        })
    );
    await redis.set("cache:stocks", JSON.stringify(stocks));
    return res.json({ stocks });
});

app.post("/stocks",  async (req, res) => {
    if (!req.body || !Array.isArray(req.body.stocks)) {
        return res.sendStatus(400);
    }
    for (const s of req.body.stocks) {
        if (
            typeof s.name !== "string" ||
            typeof s.quantity !== "number" ||
            s.quantity < 0
        ) {
            return res.sendStatus(400);
        }
    }

    const keys = await redis.keys("bank:*");
    if (keys.length > 0) {
        await redis.del(keys);
    }
    for (const s of req.body.stocks) {
        await redis.set(`bank:${s.name}`, s.quantity.toString());
    }
    await redis.del("cache:stocks");
    return res.sendStatus(200);
})

app.get("/wallets/:walletId", async (req, res) => {
    const walletId = req.params.walletId;
    const keys = await redis.keys(`wallet:${walletId}:*`);

    if (keys.length === 0) {
        return res.json({ id: walletId, stocks: [] });
    }
    const stocks = await Promise.all(
        keys.map(async (key) => {
            const stock = key.split(":")[2];
            const qty = await redis.get(key);
            return {
                name: stock,
                quantity: Number(qty)
            };
        })
    );
    return res.json({ id: walletId, stocks });
});

app.get("/wallets/:walletId/stocks/:stock", async (req, res) => {
    const { walletId, stock } = req.params;
    const exists = await redis.exists(`bank:${stock}`);

    if (!exists) {
        return res.sendStatus(404);
    }
    const qtyStr = await redis.get(`wallet:${walletId}:${stock}`);
    const quantity = Number(qtyStr ?? 0);

    return res.send(quantity.toString());
});

app.post("/wallets/:walletId/stocks/:stock", async (req, res) => {
    const { walletId, stock } = req.params;
    const { type } = req.body;

    if (!req.body || typeof type !== "string") {
        return res.sendStatus(400);
    }
    if (type !== "buy" && type !== "sell") {
        return res.sendStatus(400);
    }
    const exists = await redis.exists(`bank:${stock}`);
    if (!exists) {
        return res.sendStatus(404);
    }
    const bankQtyStr = await redis.get(`bank:${stock}`);
    const bankQty = Number(bankQtyStr ?? 0);

    if (type === "buy") {
        if (bankQty <= 0) {
            return res.sendStatus(400);
        }
        const walletQtyStr = await redis.get(`wallet:${walletId}:${stock}`);
        const walletQty = Number(walletQtyStr ?? 0);
        await redis.set(`bank:${stock}`, (bankQty - 1).toString());
        await redis.del("cache:stocks");
        await redis.set(
            `wallet:${walletId}:${stock}`,
            (walletQty + 1).toString()
        );
        await redis.rPush("log", JSON.stringify({
            type: "buy",
            wallet_id: walletId,
            stock_name: stock
        }));
        return res.sendStatus(200);
    }

    if (type === "sell") {
        const walletQtyStr = await redis.get(`wallet:${walletId}:${stock}`);
        const walletQty = Number(walletQtyStr ?? 0);
        if (walletQty <= 0) {
            return res.sendStatus(400);
        }
        await redis.set(
            `wallet:${walletId}:${stock}`,
            (walletQty - 1).toString()
        );
        await redis.set(`bank:${stock}`, (bankQty + 1).toString());
        await redis.del("cache:stocks");
        await redis.rPush("log", JSON.stringify({
            type: "sell",
            wallet_id: walletId,
            stock_name: stock
        }));
        return res.sendStatus(200);
    }
    return res.sendStatus(400);
});

app.get("/log", async (req, res) => {
    const entries = await redis.lRange("log", 0, -1);
    const log = entries.map(e => JSON.parse(e));
    return res.json({ log });
});

app.post("/chaos", (req, res) => {
    res.on("finish", () => process.exit(1));
    res.send("Killing instance...");
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.sendStatus(500);
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;