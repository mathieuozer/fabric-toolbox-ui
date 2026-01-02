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
    const sessionId = req.query.sessionId;

    if (!sessionId) {
      context.res = {
        status: 400,
        body: { error: "Missing sessionId" },
      };
      return;
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid") {
      context.res = {
        status: 400,
        body: { error: "Payment not completed" },
      };
      return;
    }

    const subscription = session.subscription as Stripe.Subscription;

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        active: true,
        customerId: session.customer as string,
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
      },
    };
  } catch (error) {
    context.log.error("Verify session error:", error);
    context.res = {
      status: 500,
      body: { error: error instanceof Error ? error.message : "Internal server error" },
    };
  }
};

export default httpTrigger;
