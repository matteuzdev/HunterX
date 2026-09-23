"use client";

import { useState, useEffect, useRef } from "react";
import {
  QrCode, CheckCircle2, RefreshCw, Smartphone, Wifi, X, Sparkles,
  Settings2, Globe, Key, ShieldCheck, AlertCircle, Copy, Check
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"connect" | "settings">("connect");
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Estados de configuração da Evolution API
  const [apiUrl, setApiUrl] = useState("http://localhost:8080");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("hunterx_default");
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega status e configurações ao abrir
  useEffect(() => {
    if (open) {
      void fetchStatus();
      void loadApiConfig();
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [open]);

  // Auto-polling quando o QR Code estiver na tela
  useEffect(() => {
    if (open && instance?.status === "qrcode") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/whatsapp/instance");
          if (res.ok) {
            const data: WhatsAppInstance = await res.json();
            if (data.status === "connected") {
              setInstance(data);
              onConnected?.(data);
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          }
        } catch {
          // ignore polling errors
        }
      }, 3500);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [open, instance?.status]);

  async function loadApiConfig() {
    try {
      const res = await fetch("/api/whatsapp/config");
      if (res.ok) {
        const data = await res.json();
        if (data.apiUrl) setApiUrl(data.apiUrl);
        if (data.instanceName) setInstanceName(data.instanceName);
      }
    } catch {
      // ignore
    }
  }

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

  async function handleTestApi() {
    try {
      setTestingApi(true);
      setTestResult(null);
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          apiUrl,
          apiKey,
          instanceName,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || "Erro ao conectar" });
    } finally {
      setTestingApi(false);
    }
  }

  async function handleSaveConfig() {
    try {
      setSavingConfig(true);
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          apiKey,
          instanceName,
        }),
      });
      if (res.ok) {
        setActiveTab("connect");
        void generateQRCode();
      }
    } finally {
      setSavingConfig(false);
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

  function handleCopyPairingCode(code: string) {
    void navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (!open) return null;

  const isConnected = instance?.status === "connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-5" />
        </button>

        {/* Header do Modal */}
        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <QrCode className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Conexão WhatsApp</h2>
              <p className="text-xs text-slate-500">Integração nativa via Evolution API v2 & Baileys</p>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="mt-5 flex gap-2 border-b border-slate-100">
            <button
              onClick={() => setActiveTab("connect")}
              className={`border-b-2 px-3 pb-2.5 text-xs font-bold transition ${
                activeTab === "connect"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Conexão & QR Code
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`border-b-2 px-3 pb-2.5 text-xs font-bold transition ${
                activeTab === "settings"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Configurar Evolution API
            </button>
          </div>
        </div>

        {/* Conteúdo Aba: Conexão & QR Code */}
        {activeTab === "connect" && (
          <div className="p-6">
            {isConnected ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Dispositivo Conectado</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {instance?.isRealConnection
                    ? "Conexão ativa com sua Evolution API real."
                    : "Instância conectada e pronta para mensagens."}
                </p>

                <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Número ativo</span>
                    <strong className="text-slate-900">+{instance?.phoneNumber || "5583996541234"}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Instância</span>
                    <strong className="text-slate-900">{instance?.instanceName || "hunterx_default"}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Tipo de Conexão</span>
                    <strong className={instance?.isRealConnection ? "text-emerald-700 font-bold" : "text-slate-700"}>
                      {instance?.isRealConnection ? "Evolution API v2 (Produção)" : "Simulador / Ambiente Local"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Status</span>
                    <Badge className="bg-emerald-50 text-emerald-700 font-bold">Online & Operacional</Badge>
                  </div>
                </div>

                <div className="mt-6 flex w-full gap-3">
                  <Button variant="secondary" className="flex-1" onClick={onClose}>
                    Fechar Janela
                  </Button>
                  <Button
                    variant="danger"
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
                    <div className="mx-auto size-60 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-md">
                      <img
                        src={instance.qrcode}
                        alt="WhatsApp QR Code"
                        className="size-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                      <Wifi className="size-3.5 text-blue-600 animate-pulse" />
                      <span>WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho</span>
                    </div>

                    {instance?.pairingCode && (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs">
                        <span className="text-slate-500">Código de pareamento:</span>
                        <code className="font-mono font-bold text-slate-900">{instance.pairingCode}</code>
                        <button
                          onClick={() => handleCopyPairingCode(instance.pairingCode!)}
                          className="ml-1 text-slate-400 hover:text-blue-600"
                        >
                          {copiedCode ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <Smartphone className="size-12 text-slate-400" />
                    <p className="mt-3 text-xs font-semibold text-slate-700">Nenhum QR Code gerado ainda</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Clique abaixo para iniciar a conexão com a Evolution API.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex w-full flex-col gap-2.5">
                  {!instance?.qrcode ? (
                    <Button
                      onClick={generateQRCode}
                      disabled={loading}
                      variant="primary"
                      className="w-full"
                    >
                      <QrCode className="mr-2 size-4" /> Gerar QR Code de Conexão
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={generateQRCode}
                      disabled={loading}
                      className="w-full text-xs"
                    >
                      <RefreshCw className={`mr-2 size-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar QR Code
                    </Button>
                  )}

                  {instance?.error && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                      <div>
                        <strong className="block font-bold">Falha de Comunicação</strong>
                        <p className="mt-0.5 text-[11px] leading-relaxed">{instance.error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab("settings")}
                    className="mt-1 text-center text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Configurar URL e Chave da Evolution API
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo Aba: Configuração da Evolution API */}
        {activeTab === "settings" && (
          <div className="space-y-4 p-6">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">URL do Servidor Evolution API</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8080 ou https://evolution.seusite.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Endereço onde sua Evolution API v2 está hospedada.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">API Key (Autenticação)</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Chave secreta configurada no .env da Evolution"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Nome da Instância</label>
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="hunterx_default"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {testResult && (
              <div
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                  testResult.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {testResult.success ? (
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                )}
                <div>
                  <strong className="block font-bold">
                    {testResult.success ? "Conexão Estabelecida" : "Falha na Conexão"}
                  </strong>
                  <p className="mt-0.5 text-[11px]">{testResult.message}</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestApi}
                disabled={testingApi}
                className="flex-1 text-xs"
              >
                <RefreshCw className={`mr-1.5 size-3.5 ${testingApi ? "animate-spin" : ""}`} />
                Testar Conexão
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex-1 text-xs"
              >
                Salvar & Conectar
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
