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
    const customerId = req.query.customerId;

    if (!customerId) {
      context.res = {
        status: 400,
        body: { error: "Missing customerId" },
      };
      return;
    }

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          active: false,
          customerId,
        },
      };
      return;
    }

    const subscription = subscriptions.data[0];

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        active: true,
        customerId,
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    };
  } catch (error) {
    context.log.error("Subscription status error:", error);
    context.res = {
      status: 500,
      body: { error: error instanceof Error ? error.message : "Internal server error" },
    };
  }
};

export default httpTrigger;
