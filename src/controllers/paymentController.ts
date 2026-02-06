import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../config/db';
import { config } from '../config/env';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
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

        const response = await axios.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            email,
            amount: amountInKobo,
            currency: txnCurrency,
            callback_url: `http://localhost:3000/payment/callback`
        }, {
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const { authorization_url, access_code, reference } = response.data.data;

        // Save pending payment record
        await prisma.payment.create({
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

    } catch (error: any) {
        console.error("Paystack Initialize Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Payment initialization failed", details: error.response?.data?.message });
    }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reference } = req.params;

        if (!reference || typeof reference !== 'string') {
            res.status(400).json({ error: "Valid reference is required" });
            return;
        }

        const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
            }
        });

        const { status, gateway_response } = response.data.data;

        if (status === 'success') {
            await prisma.payment.updateMany({
                where: { reference },
                data: { status: 'success' }
            });

            // Start User Subscription
            const payment = await prisma.payment.findUnique({ where: { reference } });
            if (payment && payment.userId) {
                await prisma.user.update({
                    where: { id: payment.userId },
                    data: { subscriptionStatus: 'active' }
                });
            }
        } else {
            await prisma.payment.updateMany({
                where: { reference },
                data: { status: 'failed' }
            });
        }

        res.status(200).json({
            status,
            message: gateway_response
        });

    } catch (error: any) {
        console.error("Paystack Verify Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Payment verification failed" });
    }
};
