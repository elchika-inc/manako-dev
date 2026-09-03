export interface SubscriptionInfo {
  id: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  items: SubscriptionItemInfo[];
  /** 新規 Checkout 受付が有効かどうか。true が既定（fail-open）。 */
  checkoutEnabled: boolean;
}

export interface SubscriptionItemInfo {
  moduleId: string;
  stripeItemId: string;
}

/**
 * subscriptions.status に格納されうる値。Stripe の `Subscription.Status` を
 * そのまま写す (webhooks/stripe.ts が `stripeSub.status` を無変換で保存する)。
 *
 * `incomplete_expired` と `paused` は Stripe 側に存在するがこの型から漏れていた。
 * つまりこの型の「6値しか入らない」という主張が誤りで、コードは正しかった。
 * ランタイムは変更せず、型を実態へ合わせている。
 * Stripe の型定義 (stripe/types/Subscriptions.d.ts) と同じ8値。
 */
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export interface CheckoutRequest {
  priceId: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface PortalResponse {
  portalUrl: string;
}
