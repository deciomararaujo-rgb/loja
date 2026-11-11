"use client";

import { useEffect, useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { Field, Modal, useAdmin } from "./admin-ui";

type Report = {
  applied: number;
  matches: { productName: string; path: string; status: "applied" | "same" | "kept" }[];
  ambiguous: string[];
  imageCount: number;
  withoutPhoto: number;
};

const STATUS: Record<string, string> = {
  applied: "Foto aplicada",
  same: "Já estava com esta foto",
  kept: "Mantida a foto enviada pelo painel",
};

/** Busca as fotos em um repositório público do GitHub e aplica nos produtos pelo nome do arquivo. */
export default function PhotoImport({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [repo, setRepo] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    api<{ settings: Record<string, string> }>("/api/admin/settings")
      .then((r) => setRepo((current) => current || r.settings.photosRepo || ""))
      .catch(() => {});
  }, [open, loaded, api]);

  async function run() {
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const result = await api<Report>("/api/admin/photos", { method: "POST", body: { repo } });
      setReport(result);
      onDone();
      toast(result.applied ? `${result.applied} ${result.applied === 1 ? "foto aplicada" : "fotos aplicadas"} na loja.` : "Nenhuma foto nova para aplicar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível importar as fotos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Fotos do GitHub"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn-soft" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={run} disabled={busy || !repo.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
            {busy ? "Procurando fotos…" : "Buscar e aplicar fotos"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <ol className="space-y-2.5 rounded-2xl bg-sand-50 p-4 text-[14.5px] text-ink-soft sm:p-5">
          <li>
            <strong className="font-semibold text-ink">1.</strong> Envie as fotos para um repositório <strong className="font-semibold text-ink">público</strong> do
            GitHub, em pastas com o nome da categoria: <em>Masculinos</em>, <em>Femininos</em>, <em>Body Splash</em>…
          </li>
          <li>
            <strong className="font-semibold text-ink">2.</strong> Dê a cada arquivo o nome do produto, igual ao cadastro. Exemplo:{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-[13px] text-ink">Femininos/Yara Tradicional.jpg</code>
          </li>
          <li>
            <strong className="font-semibold text-ink">3.</strong> Toque em “Buscar e aplicar fotos”. O painel encontra cada foto pelo nome e coloca no produto
            certo, com preço e descrição. Pode repetir sempre que enviar fotos novas.
          </li>
        </ol>

        <Field label="Repositório do GitHub" hint="Formato usuario/repositorio, ou cole o link completo.">
          <input value={repo} onChange={(e) => setRepo(e.target.value)} className="field" placeholder="usuario/repositorio" autoCapitalize="none" spellCheck={false} />
        </Field>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </p>
        ) : null}

        {report ? (
          <div className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                [report.imageCount, "imagens no repositório"],
                [report.applied, "fotos aplicadas agora"],
                [report.withoutPhoto, "produtos ainda sem foto"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-sand-200 bg-white p-3">
                  <p className="text-[1.5rem] font-semibold leading-none tabular-nums">{value}</p>
                  <p className="mt-1.5 text-[12px] leading-tight text-ink-mute">{label}</p>
                </div>
              ))}
            </div>

            {report.matches.length ? (
              <ul className="max-h-64 divide-y divide-sand-200 overflow-y-auto rounded-2xl border border-sand-200 bg-white px-4">
                {report.matches.map((m) => (
                  <li key={`${m.productName}-${m.path}`} className="flex items-start gap-3 py-2.5 text-[14px]">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${m.status === "applied" ? "text-emerald-600" : "text-sand-400"}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-medium">{m.productName}</span>
                      <span className="block break-all text-[12.5px] text-ink-mute">
                        {m.path} · {STATUS[m.status]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-sand-300 bg-white px-4 py-6 text-center text-[14.5px] text-ink-mute">
                Nenhum arquivo com nome de produto foi encontrado. Confira se os nomes dos arquivos são iguais aos nomes dos produtos.
              </p>
            )}

            {report.ambiguous.length ? (
              <div className="rounded-2xl bg-flame-50 p-4 text-[13.5px] text-flame-700">
                <p className="font-semibold">Arquivos que servem para mais de um produto (não aplicados):</p>
                <p className="mt-1 break-all">{report.ambiguous.join(" · ")}</p>
                <p className="mt-1">Renomeie com o nome completo do produto e importe de novo.</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
