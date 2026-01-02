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
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      context.res = {
        status: 400,
        body: { error: "Missing customerId" },
      };
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || req.headers.origin || "",
    });

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        url: session.url,
      },
    };
  } catch (error) {
    context.log.error("Portal session error:", error);
    context.res = {
      status: 500,
      body: { error: error instanceof Error ? error.message : "Internal server error" },
    };
  }
};

export default httpTrigger;
