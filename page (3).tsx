import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await getSettings();
  const { pagamento } = await searchParams;
  const initialPayment = pagamento === "whatsapp" || pagamento === "cartao" ? pagamento : "pix";

  return (
    <div className="container-x py-8 lg:py-14">
      <p className="eyebrow">Checkout</p>
      <h1 className="display mt-3 text-[clamp(2.3rem,5.4vw,3.8rem)]">Finalizar compra</h1>
      <div className="mt-8 lg:mt-10">
        <CheckoutForm
          initialPayment={initialPayment}
          cfg={{
            shippingCents: s.shippingCents,
            shippingDays: s.shippingDays,
            maxInstallments: s.maxInstallments,
            interestFree: s.interestFree,
            pickupEnabled: s.pickupEnabled,
          }}
        />
      </div>
    </div>
  );
}
