import jwt from 'jsonwebtoken';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

const signToken = (id, role) => 
    jwt.sign({ id, role }, process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN,}
    );

export const login = async (req, res) => {
    
    try {
            const {email, password} = req.body;

    // reject empty inputs
        if (!email || !password) {
            return res.status(400).json({
                message: "email and password is required"
            });
        }

        //fetch user and validate password
        const user = await User.findOne({email});
        const valid = user && 
            (await bcrypt.compare(password, user.password));

        if (!valid){
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        const token = signToken(user._id, user.role);
        return res.json({token, role: user.role });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    } 
};
    