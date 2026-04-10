interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
}

interface PaymentData {
  invoiceId: string;
  amount: number;
  description: string;
  buyerName: string;
  buyerEmail: string;
  returnUrl: string;
  cancelUrl: string;
}

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getPayPalAccessToken(config: PayPalConfig): Promise<string> {
  // Check if token is still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken as string;
  }

  const baseUrl =
    config.mode === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`PayPal OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;

    return accessToken as string;
  } catch (error) {
    console.error("PayPal access token error:", error);
    throw error;
  }
}

export async function createPayPalPaymentLink(
  config: PayPalConfig,
  data: PaymentData
): Promise<{ approvalUrl: string; orderId: string }> {
  try {
    const token = await getPayPalAccessToken(config);
    const baseUrl =
      config.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: data.invoiceId,
            amount: {
              currency_code: "USD",
              value: (data.amount / 1000000).toFixed(2), // Convert from VND to USD
            },
            description: data.description,
            payee: {
              email_address: data.buyerEmail,
            },
          },
        ],
        payer: {
          name: {
            given_name: data.buyerName.split(" ")[0],
            surname: data.buyerName.split(" ").slice(1).join(" "),
          },
          email_address: data.buyerEmail,
        },
        application_context: {
          return_url: data.returnUrl,
          cancel_url: data.cancelUrl,
          brand_name: "My Store",
          locale: "vi_VN",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`PayPal API error: ${response.statusText}`);
    }

    const result = await response.json();
    const approvalUrl = result.links.find(
      (link: any) => link.rel === "approve"
    )?.href;

    return {
      approvalUrl,
      orderId: result.id,
    };
  } catch (error) {
    console.error("PayPal payment link creation error:", error);
    throw error;
  }
}

export async function capturePayPalPayment(
  config: PayPalConfig,
  orderId: string
): Promise<{ status: string; amount: number; transactionId: string }> {
  try {
    const token = await getPayPalAccessToken(config);
    const baseUrl =
      config.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

    const response = await fetch(
      `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`PayPal capture error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      status: result.status,
      amount: parseFloat(
        result.purchase_units[0].payments.captures[0].amount.value
      ),
      transactionId: result.purchase_units[0].payments.captures[0].id,
    };
  } catch (error) {
    console.error("PayPal payment capture error:", error);
    throw error;
  }
}

export async function getPayPalPaymentStatus(
  config: PayPalConfig,
  orderId: string
): Promise<{ status: string; amount: number }> {
  try {
    const token = await getPayPalAccessToken(config);
    const baseUrl =
      config.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`PayPal API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      status: result.status,
      amount: parseFloat(result.purchase_units[0].amount.value),
    };
  } catch (error) {
    console.error("PayPal payment status error:", error);
    throw error;
  }
}
