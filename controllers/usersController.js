import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";

/***********************************Register User****************************************/
const registerUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required!!!"})
    }

    const exist = await User.findOne({ email });
    if (exist) {
        return res.status(400).json({ error: "User already exists!!!"})
    }
    // Hash password
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(password, salt);

    try {
        const user = await User.create({ email, password: hashed });
        res.status(200).json({ success: `Account created for ${email}` });
    } catch(error) {
        res.status(500).json({ error: error.message});
    }
}

/***********************************Login User****************************************/
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required!!!"})
    }

    const user = await User.findOne({ email});
    if (!user) {
        return res.status(400).json({ error: "Incorrect email"})
    }
    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(400).json({ error: "Incorrect password"})
    }

    try {
        res.status(200).json({ success: `Successfully logined to ${email}` });
    } catch(error) {
        res.status(500).json({ error: error.message});
    }
}
/***********************************Update User Password****************************************/
const updateUserPassword = async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required!!!"})
    }
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: "User does not exist!!!"})
    } 
    // If there is nothing to update
    if (!password) {
        return res.status(400).json({ error: "Password is required!!!"})
    }
    // Update password
    if (password) {
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(password, salt);

        try {
            await user.updateOne({ password: hashed });
            res.status(200).json({ success: `Password updated for user: ${email}` });
        } catch(error) {
            res.status(500).json({ error: error.message});
        }
    }    
}

/***********************************Update User Subscription****************************************/
const updateUserSubscription = async (req, res) => {
    const { email, subscribe, unsubscribe } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required!!!"})
    }
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: "User does not exist!!!"})
    } 
    // If there is nothing to update
    if (!subscribe && !unsubscribe) {
        return res.status(400).json({ error: "Subscription is required!!!"})
    }
    // Subscribe to news source
    if (subscribe) {
        var subscription = user.subscription;
        if (subscription.includes(subscribe)) {
            return res.status(400).json({ error: "Subscription already exists!!!"})
        }
        else {
            subscription.push(subscribe);
            try {
                await user.updateOne({ subscription });
                res.status(200).json({ success: `Subscription ${subscribe} added for user: ${email}` });
            } catch(error) {
                res.status(500).json({ error: error.message});
            }
        }
    }
    // Unsubscribe from news source
    if (unsubscribe) {
        var subscription = user.subscription;
        if (!(subscription.includes(unsubscribe))) {
            return res.status(400).json({ error: "Subscription does not exist!!!"})
        }
        else {
        subscription = subscription.filter(sub => sub !== unsubscribe);
            try {
                await user.updateOne({ subscription });
                res.status(200).json({ success: `Subscription ${unsubscribe} deleted for user: ${email}` });
            } catch(error) {
                res.status(500).json({ error: error.message});
            }
        }
    }
}

export { registerUser, loginUser, updateUserPassword, updateUserSubscription } 