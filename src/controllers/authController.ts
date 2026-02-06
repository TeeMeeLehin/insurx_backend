import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { generateToken } from "../utils/generateToken";
import { AppError } from "../middleware/errorMiddleware";
import { z } from "zod";

const signupSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const signup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { fullName, email, password } = signupSchema.parse(req.body);

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return next(new AppError("User already exists", 400));
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash,
            },
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                fullName: user.fullName,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            return next(new AppError("Invalid user data", 400));
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });

        if (user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
            res.json({
                _id: user.id,
                fullName: user.fullName,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            return next(new AppError("Invalid email or password", 401));
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};
