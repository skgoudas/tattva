import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Resend } from 'resend';

// Initialize Resend safely - if key is missing (e.g. during build), it might throw if we construct it.
// We'll construct it but handle the missing key case if possible, or just ignore if not needed at build time.
// Resend constructor throws if key is empty.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        try {
            await db.execute({
                sql: 'INSERT INTO subscribers (email) VALUES (?)',
                args: [email]
            });
        } catch (dbError) {
            // Check for unique constraint violation (LibSQL/SQLite specific)
            if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE' || dbError.message?.includes('UNIQUE constraint failed')) {
                return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
            }
            throw dbError;
        }

        // Send welcome email if client is initialized
        if (resend) {
            try {
                await resend.emails.send({
                    from: 'Vayu <onboarding@resend.dev>',
                    to: email,
                    subject: 'Welcome to Vayu Club!',
                    html: '<p>You are now on the list for exclusive flight deals.</p>'
                });
            } catch (emailError) {
                console.error("Email sending failed:", emailError);
                return NextResponse.json({
                    message: 'Subscribed but email failed',
                    error: emailError.message
                }, { status: 500 });
            }
        }

        return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
    } catch (error) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
