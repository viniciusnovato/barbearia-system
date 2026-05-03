"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface Props { audioId: string; failed: boolean }

export function ReprocessButton({ audioId, failed }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reprocess() {
    setLoading(true);
    setMsg("Enviando para a IA…");
    try {
      const supabase = createBrowserSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ audio_id: audioId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(`Falhou: ${j.error ?? res.statusText}`);
      } else {
        setMsg(`Pronto. ${j.blocks_count ?? 0} blocos extraídos. Aguarde a classificação…`);
        setTimeout(() => router.refresh(), 1500);
        setTimeout(() => router.refresh(), 6000);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={reprocess}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md text-body-sm font-medium transition-colors ${
          failed ? "bg-status-conflict-bg text-status-conflict-fg ring-1 ring-inset ring-status-conflict-ring hover:brightness-105" :
                   "bg-ai-500 text-white hover:bg-ai-600"
        } disabled:opacity-50`}
      >
        {loading ? (
          <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <span>↻</span>
        )}
        {failed ? "Tentar de novo" : "Reprocessar com IA"}
      </button>
      {msg && <p className="text-caption text-text-muted">{msg}</p>}
    </div>
  );
}
