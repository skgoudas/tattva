import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import db from '@/lib/db';

// Initialize Razorpay lazily or check for keys
const initRazorpay = () => {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return null;
};

export async function POST(request) {
    try {
        const razorpay = initRazorpay();
        if (!razorpay) {
            return NextResponse.json({ error: 'Razorpay keys missing' }, { status: 500 });
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists, if not create them (as free user first)
        // Or we can assume they submit the email in the form
        let user = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);

        if (!user) {
            // Create user if not exists
            const insert = db.prepare('INSERT INTO subscribers (email) VALUES (?)');
            insert.run(email);
            user = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
        }

        if (user.is_premium) {
            return NextResponse.json({ message: 'User is already premium', alreadyPremium: true });
        }

        const options = {
            amount: 19900, // amount in the smallest currency unit (paise) -> 199 INR
            currency: "INR",
            receipt: `receipt_order_${user.id}_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            email: user.email
        });

    } catch (error) {
        console.error('Razorpay Error:', error);
        return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
    }
}
