"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.initiatePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../config/db"));
const env_1 = require("../config/env");
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const initiatePayment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { amount, email, currency } = req.body;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!amount || !email) {
            res.status(400).json({ error: "Amount and email are required" });
            return;
        }
        // Paystack expects amount in kobo (multiply by 100)
        const amountInKobo = amount * 100;
        const txnCurrency = currency || "GHS";
        console.log(`Initiating payment: Amount=${amount}, Currency=${currency || 'undefined (defaulting to GHS)'}, TxnCurrency=${txnCurrency}`);
        const response = await axios_1.default.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            email,
            amount: amountInKobo,
            currency: txnCurrency,
            callback_url: `http://localhost:3000/payment/callback`
        }, {
            headers: {
                Authorization: `Bearer ${env_1.config.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const { authorization_url, access_code, reference } = response.data.data;
        // Save pending payment record
        await db_1.default.payment.create({
            data: {
                userId,
                amount: parseFloat(amount),
                currency: txnCurrency,
                status: "pending",
                reference
            }
        });
        res.status(200).json({
            authorization_url,
            access_code,
            reference
        });
    }
    catch (error) {
        console.error("Paystack Initialize Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Payment initialization failed", details: error.response?.data?.message });
    }
};
exports.initiatePayment = initiatePayment;
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        if (!reference || typeof reference !== 'string') {
            res.status(400).json({ error: "Valid reference is required" });
            return;
        }
        const response = await axios_1.default.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${env_1.config.PAYSTACK_SECRET_KEY}`
            }
        });
        const { status, gateway_response } = response.data.data;
        if (status === 'success') {
            await db_1.default.payment.updateMany({
                where: { reference },
                data: { status: 'success' }
            });
            // Start User Subscription
            const payment = await db_1.default.payment.findUnique({ where: { reference } });
            if (payment && payment.userId) {
                await db_1.default.user.update({
                    where: { id: payment.userId },
                    data: { subscriptionStatus: 'active' }
                });
            }
        }
        else {
            await db_1.default.payment.updateMany({
                where: { reference },
                data: { status: 'failed' }
            });
        }
        res.status(200).json({
            status,
            message: gateway_response
        });
    }
    catch (error) {
        console.error("Paystack Verify Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Payment verification failed" });
    }
};
exports.verifyPayment = verifyPayment;
