"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const KEY = "intro-vista";

/** Vídeo de abertura em tela cheia: aparece uma vez por visita, só ao entrar pela página inicial. */
export default function IntroVideo() {
  const pathname = usePathname();
  const [show, setShow] = useState(pathname === "/");
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(true);
  const video = useRef<HTMLVideoElement>(null);

  const finish = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* navegador sem armazenamento: o vídeo só volta ao recarregar */
    }
    setLeaving(true);
    window.setTimeout(() => setShow(false), 700);
  };

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* ignora */
    }
    if (pathname !== "/" || seen) {
      setShow(false);
      return;
    }
    document.documentElement.classList.add("scroll-lock");
    const v = video.current;
    v?.play()?.catch(() => {
      /* reprodução bloqueada: segue sem o vídeo */
      finish();
    });
    // Segurança: se o vídeo travar, entra no site depois de 12 segundos.
    const t = window.setTimeout(finish, 12_000);
    return () => {
      window.clearTimeout(t);
      document.documentElement.classList.remove("scroll-lock");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!show) document.documentElement.classList.remove("scroll-lock");
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-black transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}
      role="dialog"
      aria-label="Abertura"
    >
      <video
        ref={video}
        className="h-full w-full object-cover"
        src="/video/abertura.mp4"
        poster="/video/abertura.jpg"
        muted={muted}
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Ligar o som" : "Desligar o som"}
        className="absolute bottom-6 left-5 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-6 right-5 rounded-full bg-white/15 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/25"
      >
        Entrar no site
      </button>
    </div>
  );
}
