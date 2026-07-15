/**
 * Vercel Serverless Proxy untuk Google Apps Script.
 * URL bawaan sudah diisi agar langsung bekerja.
 * Untuk keamanan/kemudahan pindah deployment, dapat ditimpa melalui
 * Environment Variable: GAS_API_URL
 */

const FALLBACK_GAS_URL = "https://script.google.com/macros/s/AKfycbzeppJXfuADm7ccEGAFB-Czp2i4otE8knr05dxLyMI17CkTVnpVySzCzKXAeSG5kAdS/exec";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Gunakan metode POST." });
  }

  const gasUrl = process.env.GAS_API_URL || FALLBACK_GAS_URL;
  if (!gasUrl || !gasUrl.startsWith("https://script.google.com/")) {
    return res.status(500).json({ ok: false, error: "GAS_API_URL belum valid." });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const upstream = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(req.body || {}),
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timeout);

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        ok: false,
        error: "Respons Google Apps Script bukan JSON. Pastikan deployment Web App aktif dan aksesnya Anyone."
      });
    }

    return res.status(upstream.ok ? 200 : 502).json(data);
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "Google Apps Script terlalu lama merespons. Coba beberapa saat lagi."
      : "Gagal menghubungi Google Apps Script.";
    return res.status(502).json({ ok: false, error: message });
  }
}
