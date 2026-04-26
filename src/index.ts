import express from "express";

const app = express();
app.use(express.json());
const port = Number(process.argv[2]) || 3000;
const bank = new Map<string, number>();
const wallets = new Map<string, Map<string, number>>();
const log: {type: string; wallet_id: string; stock_name: string}[] = [];

app.get("/stocks", (req, res) =>{
    const stocks = Array.from(bank.entries()).map(
        ([name, quantity]) => ({name, quantity})
    );
    res.json({stocks});
});

app.post("/stocks", (req, res) => {
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

    bank.clear();

    for(const s of req.body.stocks){
        bank.set(s.name, s.quantity);
    }
    res.sendStatus(200);
})

app.get("/wallets/:walletId", (req, res) => {
    const walletId = req.params.walletId;
    const wallet = wallets.get(walletId);

    if (!wallet) {
        return res.json({id: walletId, stocks: [] });
    }

    const stocks = Array.from(wallet.entries()).map(
        ([name, quantity]) => ({name, quantity})
    );
    res.json ({ id: walletId, stocks});
});

app.get("/wallets/:walletId/stocks/:stock", (req, res) => {
    const {walletId, stock} = req.params;

    if (!bank.has(stock)) {
        return res.sendStatus(404);
    }

    const wallet = wallets.get(walletId);
    const quantity = wallet?.get(stock) ?? 0;

    res.send(quantity.toString());
});

app.post("/wallets/:walletId/stocks/:stock", (req, res) => {
    const { walletId, stock } = req.params;
    const { type } = req.body;

    if (!req.body || typeof type !== "string") {
        return res.sendStatus(400);
    }
    if (type !== "buy" && type !== "sell") {
        return res.sendStatus(400);
    }
    if (!bank.has(stock)) {
        return res.sendStatus(404);
    }

    let wallet = wallets.get(walletId);
    if (!wallet) {
        wallet = new Map();
        wallets.set(walletId, wallet);
    }

    if (type === "buy") {
        const bankQty = bank.get(stock)!;

        if (bankQty <= 0) {
            return res.sendStatus(400);
        }

        bank.set(stock, bankQty - 1);
        wallet.set(stock, (wallet.get(stock) ?? 0) + 1);

        log.push({
            type: "buy",
            wallet_id: walletId,
            stock_name: stock
        });

        return res.sendStatus(200);
    }

    if (type === "sell") {
        const walletQty = wallet.get(stock) ?? 0;
        if (walletQty <= 0) {
            return res.sendStatus(400);
        }
        wallet.set(stock, walletQty - 1);
        bank.set(stock, (bank.get(stock) ?? 0) + 1);
        log.push({
            type: "sell",
            wallet_id: walletId,
            stock_name: stock
        });
        return res.sendStatus(200);
    }
    return res.sendStatus(400);
});

app.get("/log", (req, res) => {
    res.json({log});
});

app.post("/chaos", (req, res) => {
    res.on("finish", () => process.exit(1));
    res.send("Killing instance...");
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;