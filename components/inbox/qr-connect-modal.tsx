"use client";

import { useState, useEffect } from "react";
import { QrCode, CheckCircle2, RefreshCw, Smartphone, Wifi, X, Sparkles } from "lucide-react";
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
        body: JSON.stringify({ action: "simulate_scan" }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-5" />
        </button>

        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <QrCode className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Conexão WhatsApp</h2>
              <p className="text-xs text-slate-500">Escaneie o QR Code no seu aplicativo WhatsApp</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isConnected ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Dispositivo Conectado</h3>
              <p className="mt-1 text-xs text-slate-500">Seu WhatsApp está pronto para envio e recepção de mensagens.</p>

              <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Número ativo</span>
                  <strong className="text-slate-900">+{instance?.phoneNumber || "5583996541234"}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Perfil</span>
                  <strong className="text-slate-900">{instance?.profileName || "HunterX Comercial"}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status</span>
                  <Badge className="bg-emerald-50 text-emerald-700">Online & Ativo</Badge>
                </div>
              </div>

              <div className="mt-6 flex w-full gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Fechar
                </Button>
                <Button
                  variant="destructive"
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
                <div className="space-y-4 text-center">
                  <div className="mx-auto size-60 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-sm">
                    <img
                      src={instance.qrcode}
                      alt="WhatsApp QR Code"
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                    <Wifi className="size-3.5 text-blue-600" />
                    <span>WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho</span>
                  </div>
                </div>
              ) : (
                <div className="grid size-52 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                  <Smartphone className="size-12 text-slate-400" />
                </div>
              )}

              <div className="mt-6 flex w-full flex-col gap-2">
                {!instance?.qrcode ? (
                  <Button
                    onClick={generateQRCode}
                    disabled={loading}
                    variant="primary"
                    className="w-full"
                  >
                    <QrCode className="mr-2 size-4" /> Gerar QR Code
                  </Button>
                ) : (
                  <div className="flex w-full gap-2">
                    <Button
                      variant="secondary"
                      onClick={generateQRCode}
                      disabled={loading}
                      className="flex-1 text-xs"
                    >
                      <RefreshCw className={`mr-2 size-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar QR
                    </Button>
                    <Button
                      onClick={handleSimulateScan}
                      disabled={scanning}
                      variant="primary"
                      className="flex-1 text-xs"
                    >
                      <Sparkles className="mr-2 size-3.5" /> Simular Conexão
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
