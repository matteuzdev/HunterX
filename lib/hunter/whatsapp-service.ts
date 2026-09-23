import { WhatsAppInstance, Conversation, ChatMessage } from "./types";

// Configurações de conexão (Evolution API ou Mock)
const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "konig_super_secret_api_key";
const INSTANCE_NAME = process.env.WHATSAPP_INSTANCE_NAME || "hunterx_default";

// Armazenamento em memória para modo mock / local
let mockInstance: WhatsAppInstance = {
  instanceName: INSTANCE_NAME,
  status: "disconnected",
  phoneNumber: null,
  profileName: "HunterX Closer",
  updatedAt: new Date().toISOString(),
};

// SVG simulado de QR Code para teste visual instantâneo
const DEMO_QR_CODE = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#ffffff" />
  <rect x="20" y="20" width="50" height="50" fill="#0b1120" />
  <rect x="30" y="30" width="30" height="30" fill="#ffffff" />
  <rect x="40" y="40" width="10" height="10" fill="#2563eb" />
  <rect x="130" y="20" width="50" height="50" fill="#0b1120" />
  <rect x="140" y="30" width="30" height="30" fill="#ffffff" />
  <rect x="150" y="40" width="10" height="10" fill="#2563eb" />
  <rect x="20" y="130" width="50" height="50" fill="#0b1120" />
  <rect x="30" y="140" width="30" height="30" fill="#ffffff" />
  <rect x="40" y="150" width="10" height="10" fill="#2563eb" />
  <rect x="80" y="20" width="20" height="20" fill="#0b1120" />
  <rect x="80" y="50" width="10" height="30" fill="#0b1120" />
  <rect x="100" y="70" width="30" height="20" fill="#0b1120" />
  <rect x="70" y="100" width="40" height="15" fill="#2563eb" />
  <rect x="130" y="100" width="20" height="40" fill="#0b1120" />
  <rect x="90" y="130" width="30" height="30" fill="#0b1120" />
  <rect x="140" y="150" width="40" height="30" fill="#2563eb" />
  <circle cx="100" cy="100" r="12" fill="#10b981" />
</svg>
`);

export class WhatsAppService {
  /**
   * Obtém o status da conexão da instância
   */
  static async getInstanceStatus(): Promise<WhatsAppInstance> {
    try {
      if (process.env.DATA_PROVIDER === "live" || process.env.EVOLUTION_API_URL) {
        const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE_NAME}`, {
          headers: { apikey: EVOLUTION_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          return {
            instanceName: INSTANCE_NAME,
            status: data.instance?.state === "open" ? "connected" : "disconnected",
            phoneNumber: data.instance?.ownerJid?.split("@")[0] || null,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fallback para mock
    }

    return mockInstance;
  }

  /**
   * Conecta a instância ou gera QR Code
   */
  static async connectInstance(): Promise<WhatsAppInstance> {
    try {
      if (process.env.DATA_PROVIDER === "live" || process.env.EVOLUTION_API_URL) {
        const res = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`, {
          headers: { apikey: EVOLUTION_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          return {
            instanceName: INSTANCE_NAME,
            status: data.base64 ? "qrcode" : "connected",
            qrcode: data.base64 || null,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fallback mock
    }

    // Modo simulado interativo
    mockInstance = {
      instanceName: INSTANCE_NAME,
      status: "qrcode",
      qrcode: DEMO_QR_CODE,
      updatedAt: new Date().toISOString(),
    };

    return mockInstance;
  }

  /**
   * Simula a leitura bem sucedida do QR Code
   */
  static async simulateScanSuccess(phoneNumber = "5583999998888", profileName = "WhatsApp Comercial"): Promise<WhatsAppInstance> {
    mockInstance = {
      instanceName: INSTANCE_NAME,
      status: "connected",
      phoneNumber,
      profileName,
      qrcode: null,
      updatedAt: new Date().toISOString(),
    };
    return mockInstance;
  }

  /**
   * Desconecta a instância
   */
  static async disconnectInstance(): Promise<WhatsAppInstance> {
    try {
      if (process.env.DATA_PROVIDER === "live" || process.env.EVOLUTION_API_URL) {
        await fetch(`${EVOLUTION_URL}/instance/logout/${INSTANCE_NAME}`, {
          method: "DELETE",
          headers: { apikey: EVOLUTION_KEY },
        });
      }
    } catch {
      // ignore
    }

    mockInstance = {
      instanceName: INSTANCE_NAME,
      status: "disconnected",
      phoneNumber: null,
      qrcode: null,
      updatedAt: new Date().toISOString(),
    };

    return mockInstance;
  }

  /**
   * Envia uma mensagem via WhatsApp
   */
  static async sendMessage(phoneNumber: string, text: string): Promise<ChatMessage> {
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    try {
      if (process.env.DATA_PROVIDER === "live" || process.env.EVOLUTION_API_URL) {
        const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_KEY,
          },
          body: JSON.stringify({
            number: cleanPhone,
            text,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            id: data.key?.id || `msg-${Date.now()}`,
            conversationId: cleanPhone,
            sender: "human",
            content: text,
            timestamp: new Date().toISOString(),
            status: "sent",
          };
        }
      }
    } catch {
      // Fallback
    }

    return {
      id: `msg-${Date.now()}`,
      conversationId: cleanPhone,
      sender: "human",
      content: text,
      timestamp: new Date().toISOString(),
      status: "delivered",
    };
  }
}

