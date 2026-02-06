import jwt from "jsonwebtoken";
import { config } from "../config/env";

export const generateToken = (id: string): string => {
    return jwt.sign({ id }, config.JWT_SECRET, {
        expiresIn: "30d",
    });
};
