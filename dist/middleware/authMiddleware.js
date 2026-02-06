"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const db_1 = __importDefault(require("../config/db"));
const errorMiddleware_1 = require("./errorMiddleware");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
            const user = await db_1.default.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, fullName: true, subscriptionStatus: true },
            });
            if (!user) {
                return next(new errorMiddleware_1.AppError("Not authorized, user not found", 401));
            }
            req.user = user;
            next();
        }
        catch (error) {
            console.error(error);
            return next(new errorMiddleware_1.AppError("Not authorized, token failed", 401));
        }
    }
    if (!token) {
        return next(new errorMiddleware_1.AppError("Not authorized, no token", 401));
    }
};
exports.protect = protect;
