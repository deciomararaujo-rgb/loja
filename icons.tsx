export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Ilustração usada enquanto o produto ainda não tem foto cadastrada. */
export function BottleArt({ kind }: { kind: "perfume" | "splash" | "jar" | "pump" | "gift" }) {
  const common = {
    viewBox: "0 0 120 150",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-[46%] w-auto",
  };
  if (kind === "splash") {
    return (
      <svg {...common}>
        <rect x="45" y="8" width="30" height="24" rx="4" />
        <path d="M50 32v8h20v-8" />
        <rect x="38" y="40" width="44" height="100" rx="10" fill="currentColor" fillOpacity="0.06" />
        <rect x="46" y="74" width="28" height="30" rx="3" />
        <path d="M52 86h16M55 93h10" />
      </svg>
    );
  }
  if (kind === "jar") {
    return (
      <svg {...common}>
        <rect x="24" y="46" width="72" height="22" rx="6" />
        <path d="M29 68v46a12 12 0 0 0 12 12h38a12 12 0 0 0 12-12V68" fill="currentColor" fillOpacity="0.06" />
        <path d="M44 92h32M50 101h20" />
      </svg>
    );
  }
  if (kind === "pump") {
    return (
      <svg {...common}>
        <path d="M60 32V14h18l6 6" />
        <rect x="50" y="32" width="20" height="12" rx="2" />
        <path d="M40 56a12 12 0 0 1 12-12h16a12 12 0 0 1 12 12v72a10 10 0 0 1-10 10H50a10 10 0 0 1-10-10z" fill="currentColor" fillOpacity="0.06" />
        <rect x="48" y="78" width="24" height="30" rx="3" />
        <path d="M54 90h12" />
      </svg>
    );
  }
  if (kind === "gift") {
    return (
      <svg {...common}>
        <rect x="24" y="58" width="72" height="76" rx="6" fill="currentColor" fillOpacity="0.06" />
        <rect x="18" y="40" width="84" height="18" rx="5" />
        <path d="M60 40v94" />
        <path d="M60 40c-8-16-28-14-24-4 3 7 16 5 24 4zm0 0c8-16 28-14 24-4-3 7-16 5-24 4z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="47" y="12" width="26" height="20" rx="3" />
      <path d="M53 32v10h14V32" />
      <rect x="27" y="42" width="66" height="94" rx="14" fill="currentColor" fillOpacity="0.06" />
      <rect x="43" y="72" width="34" height="34" rx="4" />
      <path d="M51 86h18M54 93h12" />
    </svg>
  );
}
