"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { responsive, sized, srcSetFor } from "@/lib/img";

export type HeroSlide = { image: string; video?: string; href: string; label: string };

/** Tempo de cada foto na tela (os vídeos passam quando terminam). */
const IMAGE_MS = 5000;
const FADE_MS = 1000;

// Fotos que vieram com o site têm três versões com o fundo continuado além das bordas:
// "alto" (telas em pé), "medio" (telas quase quadradas) e "largo" (telas largas).
const EXTENDED = /^\/banners\/destaque-\d+\.jpg$/;
const variant = (image: string, name: string) => image.replace(/\.jpg$/, `-${name}.jpg`);

/**
 * Topo da página inicial: a primeira coisa que aparece ao entrar no site, ocupando a tela inteira.
 * Os destaques passam sozinhos, na ordem da lista: os vídeos tocam (sem som) até o fim e, depois deles,
 * vêm as fotos; no final volta para o primeiro. Tocar em um destaque abre a seção ou o produto dele.
 */
export default function HomeHero({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [onScreen, setOnScreen] = useState(true);
  // As fotos só são baixadas quando estão para aparecer (a atual e a próxima).
  const [warm, setWarm] = useState<number[]>(() => (count > 1 ? [0, 1] : [0]));
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const shown = useRef(0);
  const started = useRef(-1);
  const press = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const go = useCallback((step: number) => setActive((a) => (((a + step) % count) + count) % count), [count]);

  // Só passa enquanto está aparecendo na tela e a aba está aberta.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let inView = true;
    const update = () => setOnScreen(inView && !document.hidden);
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting;
              update();
            },
            { threshold: 0.15 },
          )
        : null;
    io?.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const next = (active + 1) % count;
    setWarm((list) => (list.includes(active) && list.includes(next) ? list : [...new Set([...list, active, next])]));
    // O destaque que sai continua visível por baixo enquanto o próximo aparece por cima.
    if (shown.current === active) return;
    setPrev(shown.current);
    shown.current = active;
    const timer = window.setTimeout(() => setPrev(-1), FADE_MS + 100);
    return () => window.clearTimeout(timer);
  }, [active, count]);

  useEffect(() => {
    const fresh = started.current !== active;
    videos.current.forEach((video, i) => {
      if (!video) return;
      if (i !== active || !onScreen) {
        video.pause();
        return;
      }
      if (fresh) {
        try {
          video.currentTime = 0;
        } catch {
          /* ainda carregando: começa do início de qualquer forma */
        }
      }
      video.muted = true;
      video.play()?.catch(() => {
        /* reprodução automática bloqueada pelo aparelho: fica a cena de espera */
      });
    });
    if (onScreen) started.current = active;
  }, [active, onScreen]);

  // As fotos passam depois de alguns segundos.
  useEffect(() => {
    if (!onScreen || count < 2 || slides[active]?.video) return;
    const timer = window.setTimeout(() => go(1), IMAGE_MS);
    return () => window.clearTimeout(timer);
  }, [active, onScreen, count, slides, go]);

  const onDown = (e: PointerEvent<HTMLElement>) => {
    press.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onUp = (e: PointerEvent<HTMLElement>) => {
    const start = press.current;
    press.current = null;
    if (!start || count < 2) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };

  if (count === 0) return null;

  return (
    <section
      ref={root}
      className="hero"
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => {
        press.current = null;
      }}
    >
      {slides.map((slide, i) => {
        const on = i === active;
        // Os vídeos que vêm com o site têm uma cópia em outro formato para os navegadores que não tocam MP4.
        const webm = slide.video?.startsWith("/video/") && slide.video.endsWith(".mp4") ? slide.video.replace(/\.mp4$/, ".webm") : null;
        const photo = !slide.video && (on || i === prev || warm.includes(i)) ? responsive(slide.image, 1200) : null;
        return (
          <Link
            key={`${slide.video ?? slide.image}-${i}`}
            href={slide.href}
            prefetch={false}
            draggable={false}
            tabIndex={on ? 0 : -1}
            aria-hidden={on ? undefined : true}
            aria-label={slide.label || "Ver produtos"}
            className={`hero-slide ${on ? "is-active" : i === prev ? "is-prev" : ""}`}
            onClick={(e) => {
              if (swiped.current) {
                swiped.current = false;
                e.preventDefault();
              }
            }}
          >
            {slide.video ? (
              <video
                ref={(el) => {
                  videos.current[i] = el;
                }}
                className="hero-media"
                poster={slide.image}
                muted
                playsInline
                loop={count === 1}
                preload={on || i === (active + 1) % count ? "auto" : "none"}
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                onEnded={() => {
                  if (count > 1) go(1);
                }}
              >
                <source src={slide.video} type="video/mp4" />
                {webm ? <source src={webm} type="video/webm" /> : null}
              </video>
            ) : photo && EXTENDED.test(slide.image) ? (
              // A foto preenche a tela toda; o navegador escolhe a versão conforme o formato da tela.
              <picture>
                <source
                  media="(max-aspect-ratio: 1/1)"
                  srcSet={srcSetFor(variant(slide.image, "alto"), [640, 828, 1080, 1200])}
                  sizes="100vw"
                />
                <source
                  media="(max-aspect-ratio: 19/10)"
                  srcSet={srcSetFor(variant(slide.image, "medio"), [828, 1080, 1200, 1920])}
                  sizes="100vw"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sized(variant(slide.image, "largo"), 1920)}
                  srcSet={srcSetFor(variant(slide.image, "largo"), [1920, 2048, 3840])}
                  sizes="150vw"
                  alt={slide.label}
                  className="hero-media hero-photo is-extended"
                  draggable={false}
                  decoding="async"
                />
              </picture>
            ) : photo ? (
              <>
                {/* Foto enviada pelo painel: aparece inteira, com a mesma foto desfocada preenchendo o resto da tela. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={responsive(slide.image, 384).src} alt="" aria-hidden className="hero-backdrop" draggable={false} decoding="async" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes={photo.srcSet ? "100vw" : undefined}
                  alt={slide.label}
                  className="hero-media hero-photo"
                  draggable={false}
                  decoding="async"
                />
              </>
            ) : null}
          </Link>
        );
      })}

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1 sm:bottom-5">
          {slides.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Mostrar ${slide.label || `destaque ${i + 1}`}`}
              aria-current={i === active ? "true" : undefined}
              className="grid h-8 place-items-center px-1.5"
            >
              <span
                className={`block h-1.5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.18)] transition-all duration-500 ${
                  i === active ? "w-7 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
