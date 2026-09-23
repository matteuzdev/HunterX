# 🤖 HunterX Agno Agent Service (Python + Agno)

Microsserviço de alta velocidade para agentes de IA autônomos, utilizando o framework **Agno** (a evolução do *Phidata*).

---

## ⚡ Como Rodar Localmente

1. **Acesse a pasta do backend:**
   ```bash
   cd backend-agents
   ```

2. **Crie e ative o ambiente virtual Python:**
   ```bash
   python -m venv venv
   # No Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # No Linux/Mac:
   source venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure suas chaves no `.env`:**
   Copie `.env.example` para `.env` e preencha sua `OPENAI_API_KEY` (ou `ANTHROPIC_API_KEY`).

5. **Inicie o servidor:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Verifique a saúde do serviço:**
   Acesse no navegador: `http://localhost:8000/health` ou a documentação Swagger em `http://localhost:8000/docs`.

---

## 🔗 Integração com o Next.js (HunterX)

O Next.js verifica a variável de ambiente `AGNO_SERVICE_URL`.
- Se configurada (ex: `AGNO_SERVICE_URL=http://localhost:8000`), o HunterX despacha o raciocínio dos agentes diretamente para o Agno em Python.
- Se o serviço estiver offline ou na Vercel sem o Python rodando, o Next.js automaticamente utiliza o fallback nativo em TypeScript, garantindo que o sistema nunca caia.

