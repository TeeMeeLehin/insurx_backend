"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const generateToken_1 = require("../utils/generateToken");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const zod_1 = require("zod");
const signupSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const signup = async (req, res, next) => {
    try {
        const { fullName, email, password } = signupSchema.parse(req.body);
        const userExists = await db_1.default.user.findUnique({ where: { email } });
        if (userExists) {
            return next(new errorMiddleware_1.AppError("User already exists", 400));
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await db_1.default.user.create({
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
                token: (0, generateToken_1.generateToken)(user.id),
            });
        }
        else {
            return next(new errorMiddleware_1.AppError("Invalid user data", 400));
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return next(new errorMiddleware_1.AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};
exports.signup = signup;
const login = async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (user && user.passwordHash && (await bcryptjs_1.default.compare(password, user.passwordHash))) {
            res.json({
                _id: user.id,
                fullName: user.fullName,
                email: user.email,
                token: (0, generateToken_1.generateToken)(user.id),
            });
        }
        else {
            return next(new errorMiddleware_1.AppError("Invalid email or password", 401));
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return next(new errorMiddleware_1.AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};
exports.login = login;
