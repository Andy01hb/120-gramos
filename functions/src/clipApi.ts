import { defineSecret, defineString } from 'firebase-functions/params';

// Base64 of "API_KEY:SECRET_KEY" from dashboard.clip.mx (Basic auth token).
// Set with: firebase functions:secrets:set CLIP_AUTH_TOKEN
export const clipAuthToken = defineSecret('CLIP_AUTH_TOKEN');

// Clip API host. Same host for test and production — the credentials decide the mode.
export const clipApiBase = defineString('CLIP_API_BASE', { default: 'https://api.payclip.io' });

// Public URL of the clipWebhook function. Set after the first deploy:
// firebase functions:config is legacy; use a param via .env or `firebase deploy` prompts.
export const clipWebhookUrl = defineString('CLIP_WEBHOOK_URL', { default: '' });

export interface ClipCreatePaymentInput {
  /** Amount in MXN pesos (e.g. 200.50), not cents. */
  amount: number;
  /** External reference we control — we use the Firestore order id. */
  reference: string;
  /** Serial number of the Clip reader (terminal). */
  serialNumberPos: string;
  /** Where Clip posts the status-changed notification. */
  webhookUrl?: string;
}

export interface ClipCreatePaymentResponse {
  pinpad_request_id: string;
  reference: string;
  amount: string;
  serial_number_pos: string;
}

export interface ClipPaymentStatus {
  pinpad_request_id: string;
  reference: string;
  amount: string;
  amount_paid?: string;
  tip_amount?: string;
  create_date?: string;
  status: string; // COMPLETED | PENDING | FAILED
  detail?: {
    results?: Array<{
      id: string;
      status: string; // approved | ...
      amount: number;
      currency?: string;
      payment_method?: {
        type?: string;
        card?: { last_digits?: string; issuer?: string };
      };
    }>;
  };
}

function authHeader(): string {
  return `Basic ${clipAuthToken.value()}`;
}

/** Starts a card charge on a physical Clip terminal. */
export async function clipCreatePayment(input: ClipCreatePaymentInput): Promise<ClipCreatePaymentResponse> {
  const res = await fetch(`${clipApiBase.value()}/f2f/pinpad/v1/payment`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      reference: input.reference,
      serial_number_pos: input.serialNumberPos,
      ...(input.webhookUrl ? { webhook_url: input.webhookUrl } : {}),
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Clip create payment failed (${res.status}): ${text}`);
  }
  return JSON.parse(text) as ClipCreatePaymentResponse;
}

/** Reads the real status of a PinPad payment. Never trust the webhook payload — call this. */
export async function clipGetPayment(pinpadRequestId: string): Promise<ClipPaymentStatus> {
  const url = `${clipApiBase.value()}/f2f/pinpad/v1/payment?pinpadRequestId=${encodeURIComponent(pinpadRequestId)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(),
      'Pinpad-Include-Detail': 'true',
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Clip get payment failed (${res.status}): ${text}`);
  }
  return JSON.parse(text) as ClipPaymentStatus;
}
