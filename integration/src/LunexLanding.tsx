import { Link } from 'react-router-dom';
import { Film, Clapperboard, Layers3, Play, Sparkles, ArrowRight, WandSparkles, MonitorPlay } from 'lucide-react';

const features = [
  { icon: Clapperboard, title: 'Сцены и мультфильмы', text: 'Создавай истории из отдельных сцен и собирай их в один ролик.' },
  { icon: Layers3, title: '2D + 3D вместе', text: 'Объединяй рисунки, объекты и анимацию в одном проекте.' },
  { icon: MonitorPlay, title: 'Экспорт в MP4', text: 'Рендер на сервере: до 5 минут, Full HD, 30 кадров/с.' },
];
export default function LunexLanding() {
  return <main className="min-h-screen bg-[#080b17] text-white overflow-hidden">
    <div className="pointer-events-none absolute top-8 left-[-120px] h-[360px] w-[360px] rounded-full bg-violet-700/20 blur-[100px]" />
    <div className="pointer-events-none absolute top-[180px] right-[-100px] h-[360px] w-[360px] rounded-full bg-sky-500/15 blur-[100px]" />
    <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-8">
      <Link to="/" className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-500 shadow-lg shadow-violet-500/20"><Film className="h-6 w-6" /></div>
        <div className="min-w-0"><div className="truncate text-base font-bold tracking-tight sm:text-lg">Lunex <span className="text-violet-300">Cartoon Studio</span></div><div className="text-[10px] tracking-[.16em] text-slate-400 uppercase">Студия мультфильмов</div></div>
      </Link>
      <Link to="/projects" className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-xl sm:px-5 sm:text-sm">Мои проекты</Link>
    </header>
    <section className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-14">
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-200"><Sparkles className="h-4 w-4" /> Твоя анимационная студия в браузере</div>
        <h1 className="max-w-xl text-[clamp(2.3rem,7vw,4.6rem)] font-black leading-[1.08] tracking-tight">Придумай историю.<br /><span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">Оживи её.</span></h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">Создавай собственные мультфильмы в 2D и 3D. Анимируй персонажей, собирай сцены и экспортируй готовое видео в MP4.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link to="/projects" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-6 py-4 text-base font-bold shadow-xl shadow-violet-700/25 transition hover:brightness-110"><WandSparkles className="h-5 w-5" /> Создать мультфильм <ArrowRight className="h-5 w-5" /></Link>
          <Link to="/projects" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.06] px-6 py-4 font-semibold backdrop-blur-xl"><Play className="h-5 w-5" /> Открыть редактор</Link>
        </div>
        <p className="mt-5 text-xs text-slate-500">Бета-версия · До 5 минут · Full HD · Без звука</p>
      </div>
      <div className="relative overflow-hidden rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-[#24204b]/90 via-[#131c37] to-[#0c1428] p-5 shadow-2xl shadow-violet-900/20 sm:p-8">
        <div className="mb-6 flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-pink-400"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-400"/><div className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><span className="ml-auto text-xs text-slate-400">Lunex Studio · Preview</span></div>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,#433b85_0%,#181a3d_55%,#0d1229_100%)]">
          <div className="absolute left-[13%] top-[19%] h-12 w-12 rotate-12 rounded-xl bg-fuchsia-500/70 blur-[1px] sm:h-16 sm:w-16"/>
          <div className="absolute right-[14%] top-[17%] h-14 w-14 rounded-full bg-sky-400/70 blur-[1px] sm:h-20 sm:w-20"/>
          <div className="absolute bottom-[15%] left-[25%] h-10 w-24 -rotate-12 rounded-full bg-violet-500/50 blur-lg"/>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/20 bg-gradient-to-br from-violet-400 via-fuchsia-500 to-blue-500 shadow-[0_0_70px_rgba(139,92,246,.5)] sm:h-32 sm:w-32"><Film className="h-12 w-12 text-white sm:h-16 sm:w-16" /></div>
          <div className="absolute bottom-3 left-4 rounded-lg border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur-md">2D + 3D анимация</div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-400"><span>Сцены · Кадры · Анимация</span><span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-emerald-300">MP4 H.264</span></div>
      </div>
    </section>
    <section className="relative mx-auto grid max-w-6xl gap-4 px-5 pb-16 sm:grid-cols-3 sm:px-8">
      {features.map(({icon:Icon,title,text})=><div key={title} className="rounded-3xl border border-white/10 bg-white/[.045] p-6 backdrop-blur-xl"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><Icon className="h-6 w-6"/></div><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></div>)}
    </section>
    <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">Lunex Cartoon Studio · Твоя история начинается здесь</footer>
  </main>;
}
