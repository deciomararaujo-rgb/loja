import Link from "next/link";

export default function NotFoundContent() {
  return (
    <div className="container-x flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,7vw,4.6rem)]">Página não encontrada</h1>
      <p className="mt-4 max-w-md text-[17px] text-ink-soft">
        O endereço pode ter mudado ou o produto não está mais disponível. Volte para a loja e continue explorando.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Voltar para o início
      </Link>
    </div>
  );
}
