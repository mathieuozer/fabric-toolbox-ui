import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    const { priceId, email, customerId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      context.res = {
        status: 400,
        body: { error: "Missing priceId" },
      };
      return;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/subscription/cancelled`,
    };

    // If we have a customer ID, use it; otherwise use email for new customer
    if (customerId) {
      sessionParams.customer = customerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        sessionId: session.id,
        url: session.url,
      },
    };
  } catch (error) {
    context.log.error("Checkout session error:", error);
    context.res = {
      status: 500,
      body: { error: error instanceof Error ? error.message : "Internal server error" },
    };
  }
};

export default httpTrigger;
