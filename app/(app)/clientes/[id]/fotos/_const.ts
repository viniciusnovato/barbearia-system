export const ANGLES = [
  { id: "frontal", label: "Frontal" },
  { id: "perfil_esquerdo", label: "Perfil esquerdo" },
  { id: "perfil_direito", label: "Perfil direito" },
  { id: "tres_quartos", label: "Três quartos" },
  { id: "topo", label: "Topo do cabelo" },
  { id: "outro", label: "Outro ângulo" },
] as const;

export type AngleId = typeof ANGLES[number]["id"];
