"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** Campo de busca da página de resultados. Funciona pelo botão ou pela tecla Enter. */
export default function SearchPageForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const go = () => {
    const value = q.trim();
    if (value) router.push(`/busca?q=${encodeURIComponent(value)}`);
  };

  return (
    <form
      action="/busca"
      role="search"
      className="relative mt-7 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <label htmlFor="busca-pagina" className="sr-only">
        Buscar produtos
      </label>
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" aria-hidden />
      <input
        id="busca-pagina"
        name="q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go();
          }
        }}
        enterKeyHint="search"
        placeholder="Nome do perfume, marca ou linha"
        className="h-14 w-full rounded-full border border-sand-300 bg-white pl-14 pr-32 text-base focus:border-flame-500 focus:outline-none focus:ring-4 focus:ring-flame-100"
      />
      <button type="button" onClick={go} className="btn btn-primary absolute right-1.5 top-1.5 min-h-11 px-6">
        Buscar
      </button>
    </form>
  );
}
