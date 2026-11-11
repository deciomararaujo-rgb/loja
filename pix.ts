// Gera o código "Pix Copia e Cola" (BR Code estático, padrão EMV do Banco Central).

const clean = (value: string, max: number) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .\-@]/g, "")
    .trim()
    .slice(0, max);

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

function crc16(input: string) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function pixPayload(opts: { key: string; name: string; city: string; amountCents: number; txid: string }) {
  const key = opts.key.trim();
  const account = tlv("00", "br.gov.bcb.pix") + tlv("01", key.includes("@") ? key.toLowerCase() : key);
  const txid = opts.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const body =
    tlv("00", "01") +
    tlv("26", account) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", (opts.amountCents / 100).toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", clean(opts.name, 25).toUpperCase() || "LOJA") +
    tlv("60", clean(opts.city, 15).toUpperCase() || "BRASIL") +
    tlv("62", tlv("05", txid)) +
    "6304";
  return body + crc16(body);
}
