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
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
}

export async function createPayOSPaymentLink(
  config: PayOSConfig,
  data: PaymentData
): Promise<{ qrCode: string; paymentLinkId: string; checkoutUrl: string }> {
  try {
    const signature = generateSignature(data, config.checksumKey);

    const response = await fetch("https://api.payos.vn/v1/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": config.clientId,
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        orderCode: data.orderCode,
        amount: Math.round(data.amount),
        description: data.description,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        buyerAddress: data.buyerAddress,
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
        ...(data.webhookUrl ? { webhookUrl: data.webhookUrl } : {}),
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error(`PayOS API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      qrCode: result.data.qrCode,
      paymentLinkId: result.data.id,
      checkoutUrl: result.data.checkoutUrl,
    };
  } catch (error: any) {
    console.error("PayOS payment link creation error:", error);
    // Provide clearer error messages for common issues
    if (error?.cause?.code === "ENOTFOUND" || error?.message?.includes("fetch failed")) {
      throw new Error("Không thể kết nối đến PayOS. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau khi publish.");
    }
    if (error?.message?.includes("PayOS API error")) {
      throw new Error(`PayOS trả về lỗi. Vui lòng kiểm tra lại Client ID, API Key và Checksum Key trong cài đặt.`);
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
      `https://api.payos.vn/v1/payment-requests/${orderCode}`,
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

export function generateSignature(data: PaymentData, checksumKey: string): string {
  const dataString = `${data.orderCode}|${Math.round(data.amount)}|${data.description}|${data.buyerName}|${data.buyerEmail}|${data.buyerPhone}|${data.buyerAddress}|${data.returnUrl}|${data.cancelUrl}`;
  
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
  const dataString = `${payload.orderCode}|${payload.amount}|${payload.description}|${payload.buyerName}|${payload.buyerEmail}|${payload.buyerPhone}|${payload.buyerAddress}|${payload.returnUrl}|${payload.cancelUrl}`;
  
  const expectedSignature = crypto
    .createHmac("sha256", checksumKey)
    .update(dataString)
    .digest("hex");

  return expectedSignature === signature;
}
