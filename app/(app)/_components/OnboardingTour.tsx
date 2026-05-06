"use client";

import { useEffect, useState } from "react";
import { completeTourAction } from "../configuracoes/actions";

const STEPS = [
  {
    title: "Bem-vindo ao Visagismo 👋",
    body: "Em 5 passos rápidos te mostro o essencial. Você pode reabrir esse tour depois em Configurações.",
  },
  {
    title: "1. Painel · sua casa",
    body: "Veja seus stats do mês, clientes que precisam de contato e os últimos atendimentos. Comece o dia por aqui.",
  },
  {
    title: "2. Clientes",
    body: "Cadastre cada cliente uma vez. A lista mostra automaticamente quem está dormindo, quem é novo, quem voltou. Filtros prontos no topo.",
  },
  {
    title: "3. Dossiê + IA",
    body: "Em cada cliente abra um dossiê. Grave a conversa (áudio ou vídeo) e a IA Gemini preenche os 22 campos automaticamente. Você só revisa e aprova.",
  },
  {
    title: "4. Catálogo de produtos",
    body: "Cadastre seus produtos uma vez. Em cada dossiê, escolha quais foram indicados e quais o cliente comprou. A receita do mês aparece no Painel.",
  },
  {
    title: "5. ⌘K e atalhos",
    body: "Aperte ⌘K (ou Ctrl+K) para busca rápida: digite o nome do cliente e abre direto. Funciona de qualquer tela.",
  },
];

export function OnboardingTour({ completed }: { completed: boolean }) {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (completed) return;
    // Mostra após 800ms para o layout estabilizar
    const t = setTimeout(() => setStep(0), 800);
    return () => clearTimeout(t);
  }, [completed]);

  if (step === null) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function close() {
    setStep(null);
    await completeTourAction();
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-2xl bg-surface-card border border-border-strong shadow-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary-500" : "bg-neutral-200"}`}
              />
            ))}
          </div>
          <h2 className="font-display text-h2 mb-3">{current.title}</h2>
          <p className="text-body text-text-secondary leading-relaxed">{current.body}</p>
        </div>
        <footer className="flex items-center justify-between px-6 py-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={close}
            className="text-body-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Pular
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="h-10 px-4 rounded-md text-body-sm text-text-secondary hover:bg-surface-sunken transition-colors"
              >
                Voltar
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={close}
                className="h-10 px-5 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors"
              >
                Começar 🚀
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="h-10 px-5 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors"
              >
                Próximo →
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
