export type CheckoutSessionResult =
  | { ok: true; sessionUrl: string }
  | { ok: false; code: 'stripe_not_connected' | 'server_required'; message: string };

/**
 * The browser must never create a payment intent or receive a secret key.
 * Once Stripe is connected, this client helper should call the API server,
 * which validates the cart against the catalog and creates the session.
 */
export async function createSecureCheckoutSession(): Promise<CheckoutSessionResult> {
  return {
    ok: false,
    code: 'stripe_not_connected',
    message: 'Secure card checkout is unavailable until the Stripe connector is connected.',
  };
}