"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Headphones, Pause, Play, RotateCcw, Save, Target, Zap } from "lucide-react";
import type { LeadCrmRecord } from "@/lib/hunter/types";
import type { HunterAccount } from "@/lib/hunter/account";
import { updateFocusSettings } from "@/lib/hunter/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function createLofi(audioContext: AudioContext) {
  const master = audioContext.createGain();
  master.gain.value = 0.08;
  master.connect(audioContext.destination);

  const low = audioContext.createOscillator();
  low.type = "sine";
  low.frequency.value = 78;
  const lowGain = audioContext.createGain();
  lowGain.gain.value = 0.08;
  low.connect(lowGain).connect(master);

  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) channel[i] = Math.random() * 2 - 1;

  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  const noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.018;
  noise.connect(filter).connect(noiseGain).connect(master);

  low.start();
  noise.start();

  return () => {
    try { low.stop(); noise.stop(); } catch {}
    void audioContext.close();
  };
}

export function FocusView({
  account,
  records,
  onAccountChange,
  onStartBatch,
}: {
  account: HunterAccount;
  records: LeadCrmRecord[];
  onAccountChange: (account: HunterAccount) => void;
  onStartBatch: (records: LeadCrmRecord[]) => void;
}) {
  const [target, setTarget] = useState(account.dailyTarget);
  const [minutes, setMinutes] = useState(account.focusMinutes);
  const [secondsLeft, setSecondsLeft] = useState(account.focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [lofi, setLofi] = useState(account.lofiEnabled);
  const [saved, setSaved] = useState(false);
  const stopAudio = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          return minutes * 60;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, minutes]);

  useEffect(() => () => stopAudio.current?.(), []);

  const candidates = useMemo(
    () => records.filter((record) => ["novo","analisado","demonstracao"].includes(record.status) && Boolean(record.lead.phone)),
    [records],
  );
  const batch = candidates.slice(0, 20);
  const progress = Math.min(100, Math.round((account.contactedToday / Math.max(target, 1)) * 100));
  const blocksTotal = Math.ceil(target / 20);
  const blocksDone = Math.floor(account.contactedToday / 20);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  async function save() {
    const next: HunterAccount = { ...account, dailyTarget: target, batchSize: 20, focusMinutes: minutes, lofiEnabled: lofi };
    if (await updateFocusSettings(next)) {
      onAccountChange(next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    }
  }

  async function toggleLofi() {
    const next = !lofi;
    setLofi(next);
    if (next) {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtor) {
        const ctx = new AudioCtor();
        stopAudio.current = createLofi(ctx);
      }
    } else {
      stopAudio.current?.();
      stopAudio.current = null;
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-violet-600">Execução diária</p>
        <h1 className="text-3xl font-black tracking-[-.045em]">Meta + Focus + Lofi Focus</h1>
        <p className="mt-2 text-sm text-slate-500">Escolha a meta do dia e trabalhe em blocos de no máximo 20 empresas.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-blue-600"><Target className="size-4" /> Meta de hoje</span>
              <strong className="mt-3 block text-4xl font-black tracking-[-.06em]">{account.contactedToday}<span className="text-lg text-slate-300">/{target}</span></strong>
              <p className="mt-1 text-xs text-slate-400">{Math.max(target - account.contactedToday, 0)} empresas restantes</p>
            </div>
            <Badge className="bg-violet-50 text-violet-700">{blocksDone}/{blocksTotal} blocos de 20</Badge>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">Meta diária</span>
              <input type="number" min={20} max={5000} step={20} value={target} onChange={(e) => setTarget(Math.max(20, Number(e.target.value) || 20))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-blue-400" />
            </label>
            <Button className="mt-auto" onClick={() => void save()}><Save className="size-4" /> {saved ? "Salvo" : "Salvar meta"}</Button>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-xs text-blue-950">Próximo bloco</strong>
                <p className="mt-1 text-[10px] text-blue-700">{batch.length} leads prontos para abordagem • máximo 20</p>
              </div>
              <Button onClick={() => onStartBatch(batch)} disabled={!batch.length}>Começar bloco <Zap className="size-4" /></Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-slate-500"><Clock3 className="size-4" /> Focus timer</span>
            <button onClick={() => void toggleLofi()} className={`flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-bold transition ${lofi ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
              <Headphones className="size-4" /> {lofi ? "Lofi Focus ON" : "Lofi Focus"}
            </button>
          </div>

          <div className="py-10 text-center">
            <strong className="font-mono text-6xl font-black tracking-[-.08em] text-slate-950">{mm}:{ss}</strong>
            <p className="mt-3 text-xs text-slate-400">Um bloco. Uma lista. Sem trocar de contexto.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setRunning((value) => !value)}>
              {running ? <Pause className="size-4" /> : <Play className="size-4" />} {running ? "Pausar" : "Iniciar"}
            </Button>
            <Button variant="secondary" onClick={() => { setRunning(false); setSecondsLeft(minutes * 60); }}>
              <RotateCcw className="size-4" /> Reiniciar
            </Button>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">Minutos por foco</span>
            <input type="range" min={5} max={60} step={5} value={minutes} onChange={(e) => { const value = Number(e.target.value); setMinutes(value); setRunning(false); setSecondsLeft(value * 60); }} className="w-full" />
            <div className="mt-1 text-right text-[10px] font-bold text-slate-500">{minutes} min</div>
          </label>
        </Card>
      </div>
    </section>
  );
}
