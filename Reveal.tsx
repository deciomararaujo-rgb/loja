"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/* Um único observador para a página inteira. Os elementos que aparecem juntos na tela
   entram em sequência (de cima para baixo, da esquerda para a direita). */

type Show = (delay: number) => void;
const targets = new Map<Element, Show>();
let io: IntersectionObserver | null = null;

const STEP_MS = 70;
const MAX_STEPS = 7;

function observer() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting && targets.has(entry.target))
        .sort(
          (a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left,
        )
        .forEach((entry, i) => {
          const show = targets.get(entry.target);
          targets.delete(entry.target);
          io?.unobserve(entry.target);
          show?.(Math.min(i, MAX_STEPS) * STEP_MS);
        });
    },
    { rootMargin: "0px 0px -7% 0px", threshold: 0.06 },
  );
  return io;
}

/**
 * Faz o conteúdo surgir quando entra na tela (sobe de leve e aparece).
 * Dentro dele, `.rv-zoom` dá um leve zoom na foto e `.rv-text` faz o texto entrar logo depois.
 */
export default function Reveal({
  children,
  className = "",
  delay,
}: {
  children: ReactNode;
  className?: string;
  /** Atraso fixo em milissegundos. Sem ele, o atraso é calculado pela posição na tela. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ shown: false, delay: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setState({ shown: true, delay: 0 });
      return;
    }
    targets.set(el, (auto) => setState({ shown: true, delay: delay ?? auto }));
    observer().observe(el);
    return () => {
      targets.delete(el);
      io?.unobserve(el);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      style={state.delay ? ({ "--rv-delay": `${state.delay}ms` } as CSSProperties) : undefined}
      className={`reveal ${state.shown ? "is-shown" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
