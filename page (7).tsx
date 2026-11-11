import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel da loja", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminApp />;
}
