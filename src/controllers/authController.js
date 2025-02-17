const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');
const crypto = require('crypto');
const User = require('../models/user.js');
const JWTBlock = require('../models/jwtblacklist.js');

const JWT_SECRET = process.env.JWT_SECRET;

const postRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.render("error.ejs", { errorMessage: 'All fields are required' });
        }

        if (!validator.isLength(username, { min: 3, max: 30 })) {
            return res.render("error.ejs", { errorMessage: 'Username must be between 3 and 30 characters' });
        }
        if (!username.match(/^[a-zA-Z0-9_]+$/)) {
            return res.render("error.ejs", { errorMessage: 'Username can only contain letters, numbers and underscores' });
        }

        if (!validator.isEmail(email)) {
            return res.render("error.ejs", { errorMessage: 'Email format is incorrect' });
        }

        if (!validator.isLength(password, { min: 8, max: 100 })) {
            return res.render("error.ejs", { errorMessage: 'Password must be at least 8 characters long' });
        }
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/)) {
            return res.render("error.ejs", { 
                errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character' 
            });
        }
        
        if (username === "auth" || username === "dashboard" || username === "about" || username === "email-to-mail-list") {
            return res.render("error.ejs", { errorMessage: 'Cannot be named this' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.render("error.ejs", { errorMessage: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return res.render("error.ejs", { errorMessage: 'Email already exists' });
            }
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const saltstuff = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltstuff);
        
        const user = new User({
            username,
            email,
            password: hashedPassword,
            verificationTokenEmail: verificationToken
        });
        
        const verificationUrl = `https://shh.pludo.org/auth/verify-email/${verificationToken}`;
        const resend = new Resend(process.env.RESEND_KEY)
        
        try {
            const { data, error } = await resend.emails.send({
                from: 'Shhh Pludo <verify@huzzand.buzz>',
                to: [email],
                subject: 'Verify To Access Shhhhkeys',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 90%; max-width: 600px; border-collapse: collapse; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Verify Your Email Address</h1>
                            <p style="color: #4b5563; margin-bottom: 30px; font-size: 16px;">Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>
                            <a href="${verificationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px;">Verify Email</a>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">If you didn't create an account, you can safely ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            });

            if (error) {
                console.error('Email sending error:', error);
                return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
        }

        await user.save();

        res.redirect('/auth/email-sent');
    } catch (error) {
        console.error('Registration error:', error);
        res.render("error.ejs", { errorMessage: 'Error creating user' });
    }
};

const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.render("error.ejs", { errorMessage: 'All fields are required' });
        }
        
        if (!validator.isEmail(email)) {
            return res.render("error.ejs", { errorMessage: 'Email format is incorrect' });
        }
        const user = await User.findOne({ email: { $eq: email } });
        
        if (!user) {
            return res.render("error.ejs", {
                errorMessage: 'Invalid credentials'
            });
        }

        if (!user.isVerified) {
            return res.render("error.ejs", {
                errorMessage: 'Email Not Verified'
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render("error.ejs", {
                errorMessage: 'Invalid credentials'
            });
        }

        const token = jwt.sign({ 
            userId: user._id, 
            username: user.username,
            email: user.email
        }, JWT_SECRET, { 
            expiresIn: '24h',
            algorithm: 'HS256'
        });

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.redirect('/dashboard/');
    } catch (error) {
        console.error('Login error:', error);
        return res.render("error.ejs", {
            errorMessage: 'An error occurred during login'
        });
    }
};

const postResetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.render("error.ejs", { errorMessage: 'Email required' });
        }

        const user = await User.findOne({ email: { $eq: email } });

        if (!user) {
            return res.render("error.ejs", { errorMessage: 'Email is not associated with a user' });
        }
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationUrl = `https://shh.pludo.org/auth/verify-password/${verificationToken}`;
        const resend = new Resend(process.env.RESEND_KEY)
        
        try {
            const { data, error } = await resend.emails.send({
                from: 'Shhh Pludo <reset-password@huzzand.buzz>',
                to: [email],
                subject: 'Reset Your Password - Shhhhkeys',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 90%; max-width: 600px; border-collapse: collapse; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Reset Your Password</h1>
                            <p style="color: #4b5563; margin-bottom: 30px; font-size: 16px;">We received a request to reset your password. Click the button below to proceed with the reset process.</p>
                            <a href="${verificationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px;">Reset Password</a>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">If you didn't request a password reset, you can safely ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            });

            if (error) {
                console.error('Email sending error:', error);
                return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
        }

        user.verificationTokenPassword = verificationToken;
        await user.save();

        res.redirect('/auth/email-sent');
    } catch (error) {
        console.error('Login error:', error);
        res.render("error.ejs", { errorMessage: 'Error logging in' });
    }
};


const getResetPassword = async (req, res) => {
    try {
        const verifyToken = req.params.token;

        const userToken = await User.findOne({ verificationTokenPassword: verifyToken });

        if (!userToken) {
            return res.render("error.ejs", { errorMessage: 'Invalid verification token' });
        }

        const userEmail = userToken.email
        const tempPassword = crypto.randomBytes(12).toString('hex');

        const saltstuff = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, saltstuff);

        userToken.password = hashedPassword;
        userToken.verificationTokenPassword = undefined;

        const resend = new Resend(process.env.RESEND_KEY)
        
        try {
            const { data, error } = await resend.emails.send({
                from: 'Shhh Pludo <reset-password@huzzand.buzz>',
                to: [userEmail],
                subject: 'Your New Temporary Password - Shhhhkeys',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 90%; max-width: 600px; border-collapse: collapse; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Password Reset Successful</h1>
                            <p style="color: #4b5563; margin-bottom: 30px; font-size: 16px;">Your password has been reset successfully. Here is your temporary password:</p>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                <code style="color: #4f46e5; font-size: 18px; font-family: monospace;">${tempPassword}</code>
                            </div>
                            <p style="color: #4b5563; margin-top: 20px; font-size: 16px;">Please login with this temporary password and change it immediately in your account settings.</p>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">For security reasons, please do not share this password with anyone.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            });

            if (error) {
                console.error('Email sending error:', error);
                return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
        }

        await userToken.save();
        res.redirect('/auth/email-sent');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.render("error.ejs", { errorMessage: 'Error verifying email' });
    }
};

const postChangePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const email = req.user.email;

        if (!newPassword) {
            return res.render("error.ejs", { errorMessage: 'All fields are required' });
        }

        if (!currentPassword) {
            return res.render("error.ejs", { errorMessage: 'All fields are required' });
        }

        if (!confirmPassword) {
            return res.render("error.ejs", { errorMessage: 'All fields are required' });
        }
        if (newPassword !== confirmPassword) {
            return res.render("error.ejs", { errorMessage: 'The password and confirmation password is not the same' });
        }

        const user = await User.findOne({ email: email });

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.render("error.ejs", { errorMessage: 'Invalid credentials' });
        }

        if (!validator.isLength(newPassword, { min: 8, max: 100 })) {
            return res.render("error.ejs", { errorMessage: 'Password must be at least 8 characters long' });
        }

        if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/)) {
            return res.render("error.ejs", { 
                errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character' 
            });
        }

        if (!user.email === email) {
            return res.render("error.ejs", { errorMessage: 'User does not exist' });
        }


        const saltstuff = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, saltstuff);
        
        user.password = hashedPassword;

        const resend = new Resend(process.env.RESEND_KEY)
        
        try {
            const { data, error } = await resend.emails.send({
                from: 'Shhh Pludo <notification@huzzand.buzz>',
                to: [email],
                subject: 'Password Changed - Shhhhkeys',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 90%; max-width: 600px; border-collapse: collapse; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Password Changed Successfully</h1>
                            <p style="color: #4b5563; margin-bottom: 30px; font-size: 16px;">Your password has been successfully changed. If you did not make this change, please take immediate action to secure your account.</p>
                            <a href="https://shh.pludo.org/auth/reset-password" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px;">Reset Password</a>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">For security reasons, if you did not initiate this password change, please click the reset password button above immediately.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            });

            if (error) {
                console.error('Email sending error:', error);
                return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
        }

        await user.save();
        
        const currentToken = req.cookies.jwt;
        if (currentToken) {
            const tokendb = new JWTBlock({ jwt: currentToken });
            await tokendb.save();

            res.clearCookie('jwt', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        }
        
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Error changing password:', error);
        res.render("error.ejs", { errorMessage: 'Error changing password' });
    }
};

const getVerify = async (req, res) => {
    try {
        const verifyToken = req.params.token;

        const userToken = await User.findOne({ verificationTokenEmail: verifyToken });

        if (!userToken) {
            return res.render("error.ejs", { errorMessage: 'Invalid verification token' });
        }

        userToken.isVerified = true;
        userToken.verificationTokenEmail = undefined;

        await userToken.save();
        res.redirect('/auth/verified');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.render("error.ejs", { errorMessage: 'Error verifying email' });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        
        if (!token) {
            return res.render("error.ejs", { errorMessage: 'No token found' });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch (err) {
            res.clearCookie('jwt');
            return res.redirect('/');
        }

        const tokendb = new JWTBlock({ jwt: token });
        await tokendb.save();

        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        res.redirect('/');
    } catch (error) {
        console.error('Logout error:', error);
        res.render("error.ejs", { errorMessage: 'Error logging out' });
    }
};

const postChangeEmail = async (req, res) => {
    try {
        const { currentEmail, newEmail } = req.body;
        const email = req.user.email;

        if (!newEmail || !currentEmail) {
            return res.render("error.ejs", { errorMessage: 'All fields are required' });
        }

        if (!validator.isEmail(newEmail)) {
            return res.render("error.ejs", { errorMessage: 'New email format is incorrect' });
        }

        if (currentEmail === newEmail) {
            return res.render("error.ejs", { errorMessage: 'New email must be different from current email' });
        }

        const existingEmail = await User.findOne({ email: { $eq: newEmail } });
        if (existingEmail) {
            return res.render("error.ejs", { errorMessage: 'Email already exists' });
        }

        const user = await User.findOne({ email: { $eq: currentEmail } });

        if (!user.email === currentEmail) {
            return res.render("error.ejs", { errorMessage: 'Not authorized' });
        }

        if (!user.email === email) {
            return res.render("error.ejs", { errorMessage: 'User does not exist' });
        }
        
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationUrl = `https://shh.pludo.org/auth/verify-change-email/${verificationToken}`;

        const resend = new Resend(process.env.RESEND_KEY)
        
        try {
            const { data, error } = await resend.emails.send({
                from: 'Shhh Pludo <verify@huzzand.buzz>',
                to: [email],
                subject: 'Confirm Email Change - Shhhhkeys',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 90%; max-width: 600px; border-collapse: collapse; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Confirm Email Change</h1>
                            <p style="color: #4b5563; margin-bottom: 30px; font-size: 16px;">We received a request to change your email address to: <strong style="color: #4f46e5;">${newEmail}</strong></p>
                            <a href="${verificationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px;">Confirm Email Change</a>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">If you didn't request this email change, please ignore this email or contact support if you have concerns.</p>
                            <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">Note: You will be logged out after changing your email and will need to log in again.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            });

            if (error) {
                console.error('Email sending error:', error);
                return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            return res.render("error.ejs", { errorMessage: 'Error sending verification email' });
        }

        user.newEmail = newEmail
        user.verificationTokenChangeEmail = verificationToken;
        await user.save();

        res.redirect('/auth/email-sent');
    } catch (error) {
        console.error('Error changing email:', error);
        res.render("error.ejs", { errorMessage: 'Error changing email' });
    }
};

const getVerifyChangeEmail = async (req, res) => {
    try {
        const verifyToken = req.params.token;

        const user = await User.findOne({ verificationTokenChangeEmail: verifyToken });

        if (!user) {
            return res.render("error.ejs", { errorMessage: 'Invalid verification token' });
        }

        const newEmail = user.newEmail
        user.email = newEmail;
        user.newEmail = undefined;
        user.verificationTokenChangeEmail = undefined;

        await user.save();

        const currentToken = req.cookies.jwt;
        if (currentToken) {
            const tokendb = new JWTBlock({ jwt: currentToken });
            await tokendb.save();

            res.clearCookie('jwt', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        }
        
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.render("error.ejs", { errorMessage: 'Error verifying email' });
    }
};

const loginPage = (req, res) => {
    res.render('auth/loginPage');
};

const registerPage = (req, res) => {
    res.render('auth/registerPage');
};

const verifiedPage = (req, res) => {
    res.render('misc/verified');
};

const emailSentPage = (req, res) => {
    res.render('misc/emailSent');
};

const resetPasswordPage = async (req, res) => {
    res.render('auth/resetPassword');
};


module.exports = {
    postRegister,
    postLogin,
    loginPage,
    registerPage,
    logout,
    getVerify,
    verifiedPage,
    resetPasswordPage,
    postResetPassword,
    getResetPassword,
    emailSentPage,
    postChangePassword,
    getVerifyChangeEmail,
    postChangeEmail,
};