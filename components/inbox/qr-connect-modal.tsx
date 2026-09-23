"use client";

import { useState, useEffect } from "react";
import { QrCode, CheckCircle2, RefreshCw, Smartphone, Wifi, X, ShieldAlert, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppInstance } from "@/lib/hunter/types";

export function QRConnectModal({
  open,
  onClose,
  onConnected,
}: {
  open: boolean;
  onClose: () => void;
  onConnected?: (instance: WhatsAppInstance) => void;
}) {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (open) {
      void fetchStatus();
    }
  }, [open]);

  async function fetchStatus() {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/instance");
      if (res.ok) {
        const data = await res.json();
        setInstance(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function generateQRCode() {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      if (res.ok) {
        const data = await res.json();
        setInstance(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulateScan() {
    try {
      setScanning(true);
      const res = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate-scan",
          phoneNumber: "5583996541234",
          profileName: "HunterX Atendimento Oficial",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInstance(data);
        onConnected?.(data);
      }
    } finally {
      setScanning(false);
    }
  }

  async function handleDisconnect() {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/instance", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setInstance(data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const isConnected = instance?.status === "connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="relative w-full max-w-lg overflow-hidden border border-white/10 bg-[#0f172a] text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <QrCode className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Conexão WhatsApp</h2>
              <p className="text-xs text-slate-400">Escaneie o QR Code para sincronizar com o HunterX</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isConnected ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="grid size-16 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Dispositivo Conectado</h3>
              <p className="mt-1 text-xs text-slate-400">Seu WhatsApp está pronto para envio e recepção de mensagens.</p>

              <div className="mt-5 w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Número ativo</span>
                  <strong className="text-white">+{instance?.phoneNumber || "5583996541234"}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Perfil</span>
                  <strong className="text-white">{instance?.profileName || "HunterX Closer"}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Status</span>
                  <Badge className="bg-emerald-500/15 text-emerald-300">Online & Ativo</Badge>
                </div>
              </div>

              <div className="mt-6 flex w-full gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  className="bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {instance?.qrcode ? (
                <div className="relative overflow-hidden rounded-2xl border-4 border-white bg-white p-3 shadow-lg">
                  {/* QR Code dinâmico */}
                  <img
                    src={instance.qrcode}
                    alt="WhatsApp QR Code"
                    className="size-52 rounded-lg object-contain"
                  />
                  <div className="absolute inset-0 pointer-events-none border border-emerald-500/30 rounded-xl" />
                </div>
              ) : (
                <div className="grid size-52 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <Smartphone className="size-12 text-slate-600" />
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-center text-xs text-slate-400">
                <Wifi className="size-3.5 text-emerald-400" />
                <span>Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho</span>
              </div>

              <div className="mt-6 flex w-full flex-col gap-2">
                {!instance?.qrcode ? (
                  <Button
                    onClick={generateQRCode}
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    <QrCode className="mr-2 size-4" /> Gerar QR Code
                  </Button>
                ) : (
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      onClick={generateQRCode}
                      disabled={loading}
                      className="flex-1 border-white/10 text-xs"
                    >
                      <RefreshCw className={`mr-2 size-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar QR
                    </Button>
                    <Button
                      onClick={handleSimulateScan}
                      disabled={scanning}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-xs text-white"
                    >
                      <Sparkles className="mr-2 size-3.5" /> Simular Scan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

