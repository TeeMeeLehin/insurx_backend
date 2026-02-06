import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import prisma from "../config/db";
import { AppError } from "./errorMiddleware";

interface DecodedToken {
    id: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, config.JWT_SECRET) as DecodedToken;

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, fullName: true, subscriptionStatus: true },
            });

            if (!user) {
                return next(new AppError("Not authorized, user not found", 401));
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            return next(new AppError("Not authorized, token failed", 401));
        }
    }

    if (!token) {
        return next(new AppError("Not authorized, no token", 401));
    }
};
