"use client";

import { useEffect, useRef, useState } from "react";

interface CameraCapturaProps {
  onFoto: (blob: Blob) => void;
  onCancelar: () => void;
  titulo?: string;
}

/**
 * Só a captura de foto pela câmera do aparelho — sem leitura automática
 * de placa. A versão original lia a placa com uma IA (Gemini) por trás;
 * isso exige uma chave de API própria configurada num endpoint do
 * servidor, que não está incluída aqui. Esta parte tira a foto, você
 * confere e digita a placa abaixo.
 */
export default function CameraCaptura({ onFoto, onCancelar, titulo = "Enquadre a placa" }: CameraCapturaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [erro, setErro] = useState("");

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
    canvas.toBlob((blob) => blob && onFoto(blob), "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <p className="absolute bottom-4 left-0 right-0 text-center text-xs uppercase tracking-widest text-white drop-shadow">
          {titulo}
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
        <span className="w-14" />
      </div>
    </div>
  );
}
