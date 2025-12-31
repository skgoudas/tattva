import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            email
        } = await request.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update database
            const stmt = db.prepare(`
            UPDATE subscribers 
            SET is_premium = 1, razorpay_payment_id = ?, razorpay_order_id = ?
            WHERE email = ?
        `);

            stmt.run(razorpay_payment_id, razorpay_order_id, email);

            // Send premium welcome email
            if (resend) {
                try {
                    await resend.emails.send({
                        from: 'Vayu Premium <premium@resend.dev>',
                        to: email,
                        subject: 'Welcome to Vayu Premium!',
                        html: `
                        <h1>You're in!</h1>
                        <p>Thanks for upgrading to Vayu Premium.</p>
                        <p>You will now receive our fastest, most exclusive flight deals.</p>
                        <p>Sit back and relax. We'll email you when price drops happen.</p>
                    `
                    });
                } catch (e) {
                    console.error("Failed to send premium welcome email", e);
                }
            }

            return NextResponse.json({
                message: "Payment verified successfully",
                success: true
            });

        } else {
            return NextResponse.json({
                message: "Invalid signature",
                success: false
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Verification Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
