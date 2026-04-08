import crypto from "crypto";

interface PayOSConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

interface PaymentData {
  orderCode: number;
  amount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export async function createPayOSPaymentLink(
  config: PayOSConfig,
  data: PaymentData
): Promise<{ qrCode: string; paymentLinkId: string; checkoutUrl: string }> {
  const amount = Math.round(data.amount);
  // Signature per official PayOS docs: sorted alphabetically
  // amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl
  const signature = generateSignature(
    { orderCode: data.orderCode, amount, description: data.description, cancelUrl: data.cancelUrl, returnUrl: data.returnUrl },
    config.checksumKey
  );

  const body: Record<string, any> = {
    orderCode: data.orderCode,
    amount,
    description: data.description,
    cancelUrl: data.cancelUrl,
    returnUrl: data.returnUrl,
    signature,
  };
  if (data.buyerName) body.buyerName = data.buyerName;
  if (data.buyerEmail) body.buyerEmail = data.buyerEmail;
  if (data.buyerPhone) body.buyerPhone = data.buyerPhone;
  if (data.buyerAddress) body.buyerAddress = data.buyerAddress;
  if (data.webhookUrl) body.webhookUrl = data.webhookUrl;
  if (data.items && data.items.length > 0) body.items = data.items;

  try {
    // Use official PayOS API endpoint
    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": config.clientId,
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok || result.code !== "00") {
      const msg = result?.desc || result?.message || response.statusText;
      throw new Error(`PayOS API error: ${msg} (code: ${result?.code})`);
    }

    return {
      qrCode: result.data?.qrCode || "",
      paymentLinkId: result.data?.paymentLinkId || result.data?.id || "",
      checkoutUrl: result.data?.checkoutUrl || "",
    };
  } catch (error: any) {
    console.error("PayOS payment link creation error:", error);
    if (error?.cause?.code === "ENOTFOUND" || error?.message?.includes("fetch failed")) {
      throw new Error("Không thể kết nối đến PayOS. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau khi publish.");
    }
    throw error;
  }
}

export async function getPayOSPaymentStatus(
  config: PayOSConfig,
  orderCode: number
): Promise<{ status: string; amount: number; transactionDateTime: string }> {
  try {
    const response = await fetch(
      `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`,
      {
        method: "GET",
        headers: {
          "x-client-id": config.clientId,
          "x-api-key": config.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`PayOS API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      status: result.data.status,
      amount: result.data.amount,
      transactionDateTime: result.data.transactionDateTime,
    };
  } catch (error) {
    console.error("PayOS payment status error:", error);
    throw error;
  }
}

/**
 * Generate PayOS signature per official docs:
 * amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl
 */
export function generateSignature(data: { orderCode: number; amount: number; description: string; cancelUrl: string; returnUrl: string }, checksumKey: string): string {
  const dataString = `amount=${Math.round(data.amount)}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;
  return crypto
    .createHmac("sha256", checksumKey)
    .update(dataString)
    .digest("hex");
}

export function verifyPayOSWebhook(
  payload: any,
  checksumKey: string,
  signature: string
): boolean {
  // Webhook data signature uses same alphabetical format
  const dataString = `amount=${payload.amount}&cancelUrl=${payload.cancelUrl || ""}&description=${payload.description}&orderCode=${payload.orderCode}&returnUrl=${payload.returnUrl || ""}`;
  const expectedSignature = crypto
    .createHmac("sha256", checksumKey)
    .update(dataString)
    .digest("hex");
  return expectedSignature === signature;
}
