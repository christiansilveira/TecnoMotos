"use client";

import { useEffect, useRef, useState } from "react";

interface CameraCapturaProps {
  onFoto: (blob: Blob) => void;
  onCancelar: () => void;
  titulo?: string;
  /**
   * Quando true, permite tirar várias fotos antes de concluir (ex.:
   * peça de vários ângulos, pra Gemini ter mais informação pra extrair).
   * `onFoto` é chamado uma vez por foto tirada, na hora — quem usa este
   * componente acumula a lista do lado de fora.
   */
  multiplo?: boolean;
  /** Quantas fotos já foram tiradas (modo múltiplo) — mostrado no contador. */
  contagemAtual?: number;
  /** Modo múltiplo: chamado quando o usuário termina a sequência de fotos. */
  onConcluir?: () => void;
}

/**
 * Só a captura de foto pela câmera do aparelho — sem leitura automática
 * de placa. A versão original lia a placa com uma IA (Gemini) por trás;
 * isso exige uma chave de API própria configurada num endpoint do
 * servidor, que não está incluída aqui. Esta parte tira a foto, você
 * confere e digita a placa abaixo.
 */
export default function CameraCaptura({
  onFoto,
  onCancelar,
  titulo = "Enquadre a placa",
  multiplo = false,
  contagemAtual = 0,
  onConcluir,
}: CameraCapturaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [erro, setErro] = useState("");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let vivo = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } } })
      .then((stream) => {
        if (!vivo) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => setErro("Sem acesso à câmera. Verifique a permissão do navegador ou digite manualmente."));
    return () => {
      vivo = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const disparar = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onFoto(blob);
        if (multiplo) {
          setFlash(true);
          setTimeout(() => setFlash(false), 140);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {flash && <div className="pointer-events-none absolute inset-0 bg-white/80" />}
        {multiplo && contagemAtual > 0 && (
          <span className="absolute right-4 top-4 flex h-8 min-w-8 items-center justify-center rounded-full bg-black/70 px-2 font-mono text-sm font-bold text-amber-400">
            {contagemAtual}
          </span>
        )}
        <p className="absolute bottom-4 left-0 right-0 text-center text-xs uppercase tracking-widest text-white drop-shadow">
          {multiplo ? `${titulo} — capture quantos ângulos quiser` : titulo}
        </p>
      </div>
      {erro && <p className="bg-black p-4 text-center text-sm text-red-400">{erro}</p>}
      <div className="flex items-center justify-center gap-6 bg-black p-6">
        <button onClick={onCancelar} className="w-14 text-xs uppercase tracking-wide text-zinc-400">
          Cancelar
        </button>
        <button
          onClick={disparar}
          aria-label="Capturar foto"
          className="h-16 w-16 rounded-full border-4 border-zinc-600 bg-white transition-transform active:scale-95"
        />
        {multiplo ? (
          <button
            onClick={onConcluir}
            disabled={contagemAtual === 0}
            className="w-14 text-xs font-bold uppercase tracking-wide text-amber-400 disabled:text-zinc-600"
          >
            Pronto
          </button>
        ) : (
          <span className="w-14" />
        )}
      </div>
    </div>
  );
}
