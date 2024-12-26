import {Webhook} from 'svix'
//svix also send some of the headers
import { headers as nextHeaders } from "next/headers"
import { WebhookEvent } from '@clerk/clerk-sdk-node'
import prisma from '@/lib/prisma'

export async function POST(req:Request){
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("Please add webhook")
    }

    const headerPayload = await nextHeaders()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occured - No svix headers")
    }

    const headers = {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
    };
      //payload is the data that comes ups from the webhook
    const payload = await req.json();
    const body = JSON.stringify(payload)
    
      //webhook creation
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt:WebhookEvent;
    
    try {
        evt = wh.verify(body, headers) as WebhookEvent;
        console.log(evt);
    } catch (error) {
        console.log("Error verifying webhook",error)
        return new Response("Error occured",{status:400})
    }

    // const {id} = evt.data
    const eventType = evt.type
    //logs

    if (eventType === "user.created") {
        try {
            const {email_addresses,primary_email_address_id} = evt.data
            //log practice

            const primary_email = email_addresses.find((email) => 
                email.id === primary_email_address_id
            )

            if (!primary_email) {
                return new Response("No Primary email found",{status:400})
            }

            //create  a user in neon (postgresql)

            const newUser = await prisma.user.create({
                data:{
                    id:evt.data.id,
                    email:primary_email.email_address,
                    isSubscribed:false
                }
            })
            console.log("User created",newUser)

        } catch (error) {
            console.log("Error in creation",error)
            return new Response("Error creating user in database",{status:400})
        }
    }

    return new Response("Webhook recieved successfully",{status:200})
}