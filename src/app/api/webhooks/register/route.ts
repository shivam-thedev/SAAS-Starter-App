import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("WEBHOOK_SECRET is not configured.");
    }

    // Extract headers
    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error("Missing Svix headers:", { svix_id, svix_timestamp, svix_signature });
        return new Response("Missing Svix headers", { status: 400 });
    }

    // Capture raw body
    const rawBody = await req.text(); // Read raw body as a string
    console.log("Raw Body:", rawBody);

    // Verify webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(rawBody, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;

        console.log("Verified Event:", evt);
    } catch (error) {
        console.error("Error verifying webhook:", error);
        return new Response("Webhook verification failed", { status: 400 });
    }

    // Process the event
    const eventType = evt.type;
    if (eventType === "user.created") {
        try {
            const { email_addresses, primary_email_address_id } = evt.data;

            const primary_email = email_addresses.find(
                (email) => email.id === primary_email_address_id
            );

            if (!primary_email) {
                return new Response("No Primary email found", { status: 400 });
            }

            const newUser = await prisma.user.create({
                data: {
                    id: evt.data.id,
                    email: primary_email.email_address,
                    isSubscribed: false,
                },
            });
            console.log("User created:", newUser);
        } catch (error) {
            console.error("Error creating user:", error);
            return new Response("Error creating user in database", { status: 400 });
        }
    }

    return new Response("Webhook received successfully", { status: 200 });
}
