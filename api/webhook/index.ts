import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    context.res = {
      status: 400,
      body: { error: "Missing stripe-signature header" },
    };
    return;
  }

  let event: Stripe.Event;

  try {
    // Get raw body for signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    context.log.error("Webhook signature verification failed:", err);
    context.res = {
      status: 400,
      body: { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}` },
    };
    return;
  }

  // Handle the event
  switch (event.type) {
    case "customer.subscription.created":
      context.log.info("Subscription created:", event.data.object);
      // You could store this in a database if needed
      break;

    case "customer.subscription.updated":
      context.log.info("Subscription updated:", event.data.object);
      break;

    case "customer.subscription.deleted":
      context.log.info("Subscription deleted:", event.data.object);
      // Handle subscription cancellation
      break;

    case "invoice.payment_succeeded":
      context.log.info("Payment succeeded:", event.data.object);
      break;

    case "invoice.payment_failed":
      context.log.warn("Payment failed:", event.data.object);
      // You might want to notify the user
      break;

    default:
      context.log.info(`Unhandled event type: ${event.type}`);
  }

  context.res = {
    status: 200,
    body: { received: true },
  };
};

export default httpTrigger;
