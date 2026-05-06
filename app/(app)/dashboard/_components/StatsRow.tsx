"use client";

import { motion } from "motion/react";

interface StatsRowProps {
  total: number;
  novosMes: number;
  recorrentes: number;
  ativos: number;
  receitaMes: number;
}

interface CardDef {
  id: keyof StatsRowProps;
  label: string;
  hint: string;
  tone: "neutral" | "primary" | "ai" | "success";
  isCurrency?: boolean;
}

const cards: CardDef[] = [
  { id: "total", label: "Clientes", hint: "Total cadastrados", tone: "neutral" },
  { id: "novosMes", label: "Novos do período", hint: "Cadastrados na janela", tone: "primary" },
  { id: "recorrentes", label: "Recorrentes", hint: "≥ 2 atendimentos", tone: "ai" },
  { id: "ativos", label: "Ativos", hint: "Vieram nos últimos 30 dias", tone: "success" },
  { id: "receitaMes", label: "Receita do período", hint: "Produtos vendidos", tone: "primary", isCurrency: true },
];

export function StatsRow(props: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => {
        const value = props[c.id];
        const display = c.isCurrency ? `R$ ${value.toFixed(0)}` : value;
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-lg bg-surface-card border border-border-subtle p-4 shadow-1"
          >
            <p
              className="font-mono text-mono uppercase text-text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              {c.label}
            </p>
            <p
              className={`font-display mt-2 leading-none ${c.tone === "success" ? "text-success" : c.tone === "ai" ? "text-ai-600" : c.tone === "primary" ? "text-primary-700" : ""}`}
              style={{ fontSize: typeof display === "string" && display.length > 6 ? "1.75rem" : "2.25rem" }}
            >
              {display}
            </p>
            <p className="text-caption text-text-secondary mt-2">{c.hint}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
