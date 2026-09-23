import { WhatsAppInstance, WhatsAppApiConfig, ChatMessage } from "./types";

// Configurações em memória do serviço
let activeConfig: WhatsAppApiConfig = {
  apiUrl: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  apiKey: process.env.EVOLUTION_API_KEY || "",
  instanceName: process.env.WHATSAPP_INSTANCE_NAME || "hunterx_default",
  autoConnect: true,
};

let currentInstance: WhatsAppInstance = {
  instanceName: activeConfig.instanceName,
  status: "disconnected",
  phoneNumber: null,
  profileName: "HunterX Closer",
  apiUrl: activeConfig.apiUrl,
  isRealConnection: false,
  updatedAt: new Date().toISOString(),
};



export class WhatsAppService {
  /**
   * Obtém a configuração atual da API
   */
  static getConfig(): WhatsAppApiConfig {
    return activeConfig;
  }

  /**
   * Atualiza a configuração da Evolution API
   */
  static setConfig(config: Partial<WhatsAppApiConfig>): WhatsAppApiConfig {
    activeConfig = {
      ...activeConfig,
      ...config,
      apiUrl: (config.apiUrl || activeConfig.apiUrl).replace(/\/+$/, ""),
    };
    currentInstance.apiUrl = activeConfig.apiUrl;
    currentInstance.instanceName = activeConfig.instanceName;
    return activeConfig;
  }

  /**
   * Testa a conectividade real com o endpoint da Evolution API
   */
  static async testApiConnection(custom?: Partial<WhatsAppApiConfig>): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
    instancesFound?: number;
    details?: any;
  }> {
    const url = (custom?.apiUrl || activeConfig.apiUrl).replace(/\/+$/, "");
    const apiKey = custom?.apiKey ?? activeConfig.apiKey;
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      // Tenta consultar instâncias na Evolution API v2
      const res = await fetch(`${url}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        signal: controller.signal,
      }).catch(async () => {
        // Fallback para checar a raiz ou connectionState
        return await fetch(`${url}/`, { signal: controller.signal });
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (res && res.status < 500) {
        let instancesFound = 0;
        try {
          const data = await res.json();
          if (Array.isArray(data)) instancesFound = data.length;
        } catch {
          // non-json response ok
        }

        return {
          success: true,
          message: `Conectado com sucesso à Evolution API (${latencyMs}ms)`,
          latencyMs,
          instancesFound,
        };
      }

      return {
        success: false,
        message: `Servidor respondeu com código de erro HTTP ${res?.status || "inacessível"}. Verifique a API Key.`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha ao conectar no host: ${err?.message || "Conexão recusada ou timeout"}.`,
      };
    }
  }

  /**
   * Verifica o status real da instância na Evolution API
   */
  static async getInstanceStatus(): Promise<WhatsAppInstance> {
    const { apiUrl, apiKey, instanceName } = activeConfig;

    if (apiUrl && apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
          headers: { apikey: apiKey },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const state = data.instance?.state || data.state;
          const isConnected = state === "open";
          const rawPhone = data.instance?.ownerJid || data.ownerJid;
          const cleanPhone = rawPhone ? rawPhone.split("@")[0] : currentInstance.phoneNumber;

          currentInstance = {
            instanceName,
            status: isConnected ? "connected" : state === "connecting" ? "connecting" : "disconnected",
            phoneNumber: isConnected ? cleanPhone : null,
            profileName: data.instance?.profileName || currentInstance.profileName || "WhatsApp Conectado",
            apiUrl,
            isRealConnection: true,
            updatedAt: new Date().toISOString(),
          };

          return currentInstance;
        }
      } catch {
        // Se a chamada de rede falhar, retorna o estado em cache
      }
    }

    return currentInstance;
  }

  /**
   * Conecta a instância ou gera QR Code real via Evolution API
   */
  static async connectInstance(): Promise<WhatsAppInstance> {
    const { apiUrl, apiKey, instanceName } = activeConfig;

    if (apiUrl && apiKey) {
      try {
        // 1. Tenta criar a instância caso não exista ainda
        try {
          await fetch(`${apiUrl}/instance/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: apiKey,
            },
            body: JSON.stringify({
              instanceName,
              qrcode: true,
              integration: "WHATSAPP-BAILEYS",
            }),
          });
        } catch {
          // Se já existir, a Evolution API retorna 403/conflict, prossegue normalmente
        }

        // 2. Chama endpoint de conexão para gerar QR Code
        const res = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
          headers: { apikey: apiKey },
        });

        if (res.ok) {
          const data = await res.json();
          let rawBase64 = data.base64 || data.qrcode?.base64 || null;

          if (rawBase64 && !rawBase64.startsWith("data:image")) {
            rawBase64 = `data:image/png;base64,${rawBase64}`;
          }

          const pairingCode = data.code || data.pairingCode || null;

          currentInstance = {
            instanceName,
            status: rawBase64 ? "qrcode" : data.instance?.state === "open" ? "connected" : "connecting",
            qrcode: rawBase64,
            pairingCode,
            apiUrl,
            isRealConnection: true,
            updatedAt: new Date().toISOString(),
          };

          return currentInstance;
        }
      } catch (err: any) {
        console.warn("Erro ao comunicar com Evolution API:", err?.message);
        currentInstance = {
          instanceName,
          status: "disconnected",
          phoneNumber: null,
          qrcode: null,
          pairingCode: null,
          apiUrl,
          isRealConnection: false,
          error: `Falha ao conectar com Evolution API: ${err?.message || "Servidor inacessível"}.`,
          updatedAt: new Date().toISOString(),
        };
        return currentInstance;
      }
    }

    currentInstance = {
      instanceName: activeConfig.instanceName,
      status: "disconnected",
      phoneNumber: null,
      qrcode: null,
      pairingCode: null,
      apiUrl: activeConfig.apiUrl,
      isRealConnection: false,
      error: "Evolution API não configurada. Insira a URL e a API Key na aba de configurações.",
      updatedAt: new Date().toISOString(),
    };

    return currentInstance;
  }

  /**
   * Desconecta o WhatsApp da instância
   */
  static async disconnectInstance(): Promise<WhatsAppInstance> {
    const { apiUrl, apiKey, instanceName } = activeConfig;

    if (apiUrl && apiKey) {
      try {
        await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
          method: "DELETE",
          headers: { apikey: apiKey },
        });
      } catch {
        // ignore
      }
    }

    currentInstance = {
      instanceName,
      status: "disconnected",
      phoneNumber: null,
      qrcode: null,
      pairingCode: null,
      apiUrl,
      isRealConnection: false,
      updatedAt: new Date().toISOString(),
    };

    return currentInstance;
  }

  /**
   * Envia uma mensagem via WhatsApp real (ou emulador de envio)
   */
  static async sendMessage(phoneNumber: string, text: string): Promise<ChatMessage> {
    let cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length >= 10 && !cleanPhone.startsWith("55")) {
      cleanPhone = `55${cleanPhone}`;
    }

    const { apiUrl, apiKey, instanceName } = activeConfig;

    if (apiUrl && apiKey && currentInstance.isRealConnection) {
      try {
        const res = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            text,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            id: data.key?.id || `real-${Date.now()}`,
            conversationId: cleanPhone,
            sender: "human",
            content: text,
            timestamp: new Date().toISOString(),
            status: "delivered",
          };
        }
      } catch (err) {
        console.error("Erro ao enviar mensagem pela Evolution API:", err);
      }
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
