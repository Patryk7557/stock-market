import request from "supertest";
import app from "../src/index";

describe("Stock Market API", () => {

    it("should return 404 when buying non-existing stock", async () => {
        const res = await request(app)
            .post("/wallets/test/stocks/unknown")
            .send({ type: "buy" });

        expect(res.status).toBe(404);
    });

    it("should return 400 when bank has no stock", async () => {
        await request(app)
            .post("/stocks")
            .send({ stocks: [{ name: "apple", quantity: 0 }] });

        const res = await request(app)
            .post("/wallets/test/stocks/apple")
            .send({ type: "buy" });

        expect(res.status).toBe(400);
    });

    it("should create wallet on buy", async () => {
        await request(app)
            .post("/stocks")
            .send({ stocks: [{ name: "apple", quantity: 5 }] });

        await request(app)
            .post("/wallets/newWallet/stocks/apple")
            .send({ type: "buy" });

        const res = await request(app)
            .get("/wallets/newWallet");

        expect(res.body.id).toBe("newWallet");
        expect(res.body.stocks[0].name).toBe("apple");
    });

    it("should return 400 when selling without stock", async () => {
        const res = await request(app)
            .post("/wallets/testSell/stocks/apple")
            .send({ type: "sell" });

        expect(res.status).toBe(400);
    });

    it("should log only successful operations", async () => {
        await request(app)
            .post("/stocks")
            .send({ stocks: [{ name: "apple", quantity: 5 }] });

        await request(app)
            .post("/wallets/logTest/stocks/apple")
            .send({ type: "buy" });

        const res = await request(app)
            .get("/log");

        expect(res.body.log.length).toBeGreaterThan(0);
    });

});