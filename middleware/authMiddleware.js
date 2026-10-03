import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer')) {
        return res.status(401).json({
            message: "no token provided",
        });
    }

    const token = header.split(' ')[1];

    try {
        req.user = jwt.verify(
            token, process.env.JWT_SECRET
        );
        next();
    } catch (error) {
        res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};