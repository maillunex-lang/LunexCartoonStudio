import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types';

type Job = { id: string; status: string; percent: number; completedSegments: number; totalSegments: number; error?: string | null; download?: string | null };
const base = import.meta.env.BASE_URL + 'api/lunex-render/jobs';

export function ServerExportPanel({ project }: { project: Project }) {
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [size, setSize] = useState<'preview' | 'fullhd'>('preview');
  const duration = project.scenes.reduce((sum, s) => sum + s.duration, 0);
  useEffect(() => {
    if (!job?.id || !['queued', 'rendering'].includes(job.status)) return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(base + '/' + encodeURIComponent(job.id));
        if (!response.ok) throw new Error('Не удалось проверить состояние задания');
        const next: Job = await response.json();
        if (!stopped) setJob(next);
      } catch (e) { if (!stopped) setError(String(e)); }
    }, 1500);
    return () => { stopped = true; clearInterval(timer); };
  }, [job?.id, job?.status]);
  const cancel = async () => { if (!job) return; try { const response = await fetch(base + '/' + encodeURIComponent(job.id), {method: 'DELETE'}); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Не удалось отменить'); setJob(data); } catch(e) {setError(String(e));} };
  const start = async () => {
    setBusy(true); setError(''); setJob(null);
    try {
      const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, width: size === 'fullhd' ? 1920 : 640, height: size === 'fullhd' ? 1080 : 360 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Сервер не принял проект');
      setJob(data);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <div className="p-4 border border-ink-600 rounded-lg space-y-3" data-lunex-server-export>
    <div className="font-semibold text-sm">Серверный MP4 (H.264, 30 FPS)</div>
    <div className="text-xs text-ink-300">Экспорт 2D + 3D на VPS. До 5 минут, пока без звука. Экспериментальный режим.</div>
    <select className="w-full bg-ink-800 border border-ink-600 rounded px-2 py-2 text-sm" value={size} onChange={e => setSize(e.target.value as 'preview' | 'fullhd')} disabled={busy || !!job && ['queued', 'rendering'].includes(job.status)}>
      <option value="preview">Быстрый тест: 640×360</option>
      <option value="fullhd">Full HD: 1920×1080</option>
    </select>
    <button type="button" className="btn-primary w-full" onClick={start} disabled={busy || duration > 300 || duration <= 0 || !!job && ['queued', 'rendering'].includes(job.status)}>
      {busy ? 'Отправка…' : 'Рендерить MP4 на сервере'}
    </button>
    {duration > 300 && <p className="text-xs text-red-400">Максимум 5 минут.</p>}
    {job && <div className="text-xs space-y-2" aria-live="polite">
      <div>Задание: {job.status} · {job.percent}% ({job.completedSegments}/{job.totalSegments} сегментов)</div>
      <div className="h-2 bg-ink-700 rounded overflow-hidden"><div className="h-full bg-violet-500" style={{width: job.percent + '%'}} /></div>
      {job.status === 'completed' && job.download && <a className="btn-primary block text-center" href={import.meta.env.BASE_URL.replace(/\/$/, '') + job.download} download>Скачать готовый MP4</a>}
      {['queued','rendering'].includes(job.status) && <button type="button" className="w-full border border-ink-600 rounded p-2" onClick={cancel}>Отменить рендер</button>}
      {job.error && <div className="text-red-400">{job.error}</div>}
    </div>}
    {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
  </div>;
}
