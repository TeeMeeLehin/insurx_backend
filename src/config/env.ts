import dotenv from "dotenv";
dotenv.config();

export const config = {
    PORT: process.env.PORT || 4000,
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
    JWT_SECRET: process.env.JWT_SECRET || "supersecretkey_change_this",
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || "e3acea4e242d1c4c0162f9ea7f5314e6",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyBtK_qcmLZi-PIUhYBxZmStuEcBagn_rCA",
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || "sk_test_paystack_default",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_mock",
    NODE_ENV: process.env.NODE_ENV || "development",
};
