# Cold email feature

Users can select up to 3 people in the search page

A small chip will appear on the bottom right of the screen indicating this

Clicking on the chip opens up a mailing card screen

This screen will have

- an input box that prompts the user to enter what they want the cold email to accomplish (eg: ask for job, setup coffee chat, etc)
- will show cards for the up to 3 ppl that they've selected where there's an option to add extra notes for specific person
- send button

Hitting send will:

- customized Open AI generated email based on the linkedin info of the user and the linkedin info of the target, + the specific instructions and cold email topic
- send this email using the user's authenticated email client to the target's email based on their linkedin profile
- show clear success feedback
- store the history of sent messages that the user can view in their dashboard (this may require modifying my supabase schema)

### Gmail integration

- Set up structure for Gmail integration, and fill in a guide here on how to set it up on my end

Guide:

To implement Gmail integration for sending emails on behalf of users:

1. **Create a Google Cloud Project**:

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project for your application
   - Enable the Gmail API for this project

2. **Configure OAuth Consent Screen**:

   - Set up the OAuth consent screen with your app information
   - Add the necessary scopes: `https://www.googleapis.com/auth/gmail.send`
   - Add your domain to the authorized domains

3. **Create OAuth Credentials**:

   - Create OAuth 2.0 Client ID credentials
   - Add authorized redirect URIs (e.g., `https://yourdomain.com/api/auth/callback/google`)
   - Save the client ID and client secret

4. **Implement OAuth Flow in Your Application**:

   - Add Google as an OAuth provider in NextAuth.js configuration
   - Request the Gmail API scope during authentication
   - Store the access token and refresh token in the user's session

5. **Update Backend to Use Gmail API**:
   - Install the Google API client library: `npm install googleapis`
   - Use the stored tokens to authenticate with the Gmail API
   - Implement the email sending functionality using the Gmail API

Example implementation for sending emails with Gmail API:

```typescript
import { google } from "googleapis";

async function sendEmail(accessToken, to, subject, body) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Encode the email in base64
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];

  const email = emailLines.join("\r\n").trim();
  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send the email
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
    },
  });
}
```

Don't implement any paywall stuff yet, but answer these questions:

### A Few Questions (LLM, please fill this out, under 'A:'):

Q: What are the ways for me to send emails on behalf of user? How do I have them log in with a bunch of different potential email services and send emails on their behalf? Maybe starting with Gmail support only?
A: For sending emails on behalf of users, you have several options:

1. **OAuth Integration (Recommended for Gmail)**:

   - Use OAuth 2.0 to request permission to send emails on behalf of users
   - This is the most secure and user-friendly approach
   - Users explicitly grant permission to your app
   - Works well with Gmail, Outlook, and other major providers

2. **SMTP Integration**:

   - Have users provide their SMTP credentials (not recommended for security reasons)
   - More universal but requires users to share sensitive information

3. **Email Service Providers**:
   - Use services like SendGrid, Mailgun, or Postmark
   - These can send emails that appear to be from the user's address
   - Requires domain verification for best deliverability

For starting with Gmail support only:

1. Implement Google OAuth as described in the guide above
2. Request the specific Gmail API scopes needed for sending emails
3. Store the access and refresh tokens securely
4. Use the Gmail API to compose and send emails

Later, you can expand to other providers like:

- Microsoft (Outlook/Office 365) using Microsoft Graph API
- Yahoo Mail using their OAuth implementation
- Generic SMTP for other providers (with appropriate security warnings)

Each provider will need its own OAuth implementation, but the core flow remains similar.

Q: How can I implement a paid system (give me everything from Stripe setup to how I identify active paying users in my supabase - changing schema is okay if needed). The paid system should only let paying members send emails, and should only let paying members view more than 3 search results at a time. How can I do this?
A: Here's a comprehensive implementation plan for your paid system:

### 1. Supabase Schema Changes

Add these tables to your Supabase database:

```sql
-- Subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER NOT NULL, -- in cents
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email history table
CREATE TABLE email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_profile_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Stripe Integration Setup

1. **Create a Stripe Account** and get your API keys
2. **Install Stripe SDK**: `npm install stripe`
3. **Configure Stripe in your project**:

```typescript
// src/lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // Use the latest API version
});
```

4. **Create Products and Prices in Stripe Dashboard** for your subscription plans

### 3. Subscription Flow Implementation

1. **Create API endpoints for subscription management**:

```typescript
// src/app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId, planId } = await request.json();

  // Create or retrieve Stripe customer
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subscriptionData } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", session.user.id)
    .single();

  let customerId = subscriptionData?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      metadata: {
        userId: session.user.id,
      },
    });
    customerId = customer.id;
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?subscription=canceled`,
    metadata: {
      userId: session.user.id,
      planId,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

2. **Create a Stripe webhook handler** to process subscription events:

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Handle subscription events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Update user subscription in database
    await supabase.from("user_subscriptions").upsert({
      user_id: session.metadata.userId,
      plan_id: session.metadata.planId,
      status: "active",
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      updated_at: new Date().toISOString(),
    });
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;

    // Find user by Stripe customer ID
    const { data: userData } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", subscription.customer)
      .single();

    if (userData) {
      // Update subscription status
      await supabase
        .from("user_subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user_id);
    }
  }

  return NextResponse.json({ received: true });
}
```

### 4. Implementing Feature Restrictions

1. **Create a utility function to check subscription status**:

```typescript
// src/lib/subscription.ts
import { createClient } from "@supabase/supabase-js";

export async function getUserSubscriptionStatus(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("user_subscriptions")
    .select(
      `
      status,
      current_period_end,
      subscription_plans (
        name,
        features
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!data) return { isSubscribed: false };

  const isSubscribed =
    data.status === "active" && new Date(data.current_period_end) > new Date();

  return {
    isSubscribed,
    plan: data.subscription_plans,
  };
}
```

2. **Limit search results for non-paying users**:

```typescript
// In your search API or component
const MAX_FREE_RESULTS = 3;

// In your search function
const { isSubscribed } = await getUserSubscriptionStatus(session.user.id);
const allResults = await performSearch(query);

// Limit results for free users
const results = isSubscribed
  ? allResults
  : allResults.slice(0, MAX_FREE_RESULTS);

// If not subscribed and there are more results, add a message
const hasMoreResults = !isSubscribed && allResults.length > MAX_FREE_RESULTS;
```

3. **Restrict email sending for non-paying users**:

```typescript
// In your email sending API
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription status
  const { isSubscribed } = await getUserSubscriptionStatus(session.user.id);

  if (!isSubscribed) {
    return NextResponse.json(
      { error: "Subscription required to send emails" },
      { status: 403 }
    );
  }

  // Continue with email sending logic
  // ...
}
```

### 5. UI Components for Subscription Management

1. **Create a pricing page** to display subscription options
2. **Add subscription status indicators** in the UI
3. **Show upgrade prompts** when free users hit limits

### 6. Testing the Integration

1. Use Stripe's test mode and test cards
2. Test the entire subscription flow
3. Verify webhook handling
4. Test feature restrictions

This implementation provides a complete solution for your paid system requirements, with proper database schema, Stripe integration, and feature restrictions based on subscription status.
