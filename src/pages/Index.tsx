import { useState } from "react";
import Icon from "@/components/ui/icon";

type Screen = "menu" | "battle-result" | "settings" | "leaderboard";

const RANKS = ["Новичок", "Боец", "Воин", "Мастер", "Легенда", "Чемпион"];
const RANK_COLORS = [
  "text-slate-400",
  "text-green-400",
  "text-blue-400",
  "text-purple-400",
  "text-amber-400",
  "text-red-400",
];
const RANK_ICONS = ["🥉", "🥈", "🥇", "💎", "👑", "🏆"];

const mockLeaderboard = [
  { name: "DragonSlayer", wins: 342, losses: 28, rank: 5, rating: 4820, streak: 12 },
  { name: "NightWolf", wins: 298, losses: 41, rank: 5, rating: 4540, streak: 7 },
  { name: "IronFist", wins: 251, losses: 55, rank: 4, rating: 3980, streak: 3 },
  { name: "ShadowKnight", wins: 210, losses: 70, rank: 4, rating: 3620, streak: 5 },
  { name: "ThunderBolt", wins: 189, losses: 92, rank: 3, rating: 3100, streak: 0 },
  { name: "BlazeFury", wins: 165, losses: 88, rank: 3, rating: 2890, streak: 2 },
  { name: "IceStorm", wins: 140, losses: 110, rank: 2, rating: 2440, streak: 1 },
  { name: "Вы", wins: 87, losses: 43, rank: 2, rating: 1980, streak: 4 },
];

const mockBattleResult = {
  winner: "Игрок 1",
  player1: { name: "DragonSlayer", score: 3, rating: "+45", hp: 35 },
  player2: { name: "NightWolf", score: 1, rating: "-32", hp: 0 },
  duration: "4:32",
  rounds: 4,
  totalHits: 87,
  perfectRounds: 1,
};

const NAV_ITEMS: { screen: Screen; icon: string; label: string }[] = [
  { screen: "menu", icon: "Home", label: "МЕНЮ" },
  { screen: "battle-result", icon: "Swords", label: "БОЙ" },
  { screen: "settings", icon: "Settings", label: "НАСТРОЙКИ" },
  { screen: "leaderboard", icon: "Trophy", label: "РЕЙТИНГ" },
];

export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [player1Name, setPlayer1Name] = useState("Игрок 1");
  const [player2Name, setPlayer2Name] = useState("Игрок 2");
  const [volume, setVolume] = useState(70);
  const [music, setMusic] = useState(50);
  const [sfx, setSfx] = useState(80);
  const [brightness, setBrightness] = useState(75);
  const [graphicsQuality, setGraphicsQuality] = useState<"low" | "medium" | "high">("high");

  return (
    <div className="min-h-screen" style={{ filter: `brightness(${0.6 + brightness * 0.005})` }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* Navigation */}
      {screen !== "menu" && (
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
            <button onClick={() => setScreen("menu")} className="flex items-center gap-2 btn-ghost px-4 py-2 rounded-xl">
              <Icon name="ChevronLeft" size={18} />
              <span className="font-display text-sm tracking-wide">МЕНЮ</span>
            </button>
            <span className="font-display gradient-text text-lg tracking-widest">FIGHT ARENA</span>
            <div className="flex gap-2">
              {NAV_ITEMS.map(({ screen: s, icon }) => (
                <button key={s} onClick={() => setScreen(s)}
                  className={`p-2 rounded-xl transition-all ${screen === s ? "glass-strong glow-blue" : "btn-ghost"}`}>
                  <Icon name={icon} size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN MENU */}
      {screen === "menu" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 glass px-5 py-2 rounded-full mb-6 animate-pulse-glow">
              <span className="text-xl">⚔️</span>
              <span className="text-sm text-blue-300 tracking-widest font-display">FIGHT ARENA v1.0</span>
            </div>
            <h1 className="font-display text-7xl gradient-text mb-2 tracking-wider">FIGHT</h1>
            <h1 className="font-display text-7xl text-white mb-6 tracking-wider"
              style={{ textShadow: "0 0 40px rgba(139,92,246,0.5)" }}>ARENA</h1>
            <p className="text-muted-foreground text-lg">Выбери режим и начни сражение</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
            {[
              { icon: "Swords", label: "ОДИН НА ОДИН", desc: "Классический поединок двух игроков", badge: "2 игрока", color: "from-blue-500 to-purple-600" },
              { icon: "Users", label: "ТУРНИР", desc: "Соревнование до последнего бойца", badge: "2–8 игроков", color: "from-purple-500 to-pink-600" },
              { icon: "Bot", label: "VS КОМПЬЮТЕР", desc: "Тренировочные бои с ИИ-противником", badge: "1 игрок", color: "from-cyan-500 to-blue-600" },
              { icon: "Trophy", label: "РЕЙТИНГОВЫЙ БОЙ", desc: "Зарабатывай очки и поднимайся в топ", badge: "1 игрок", color: "from-amber-500 to-orange-600" },
            ].map((mode, i) => (
              <button key={i}
                className="glass-strong rounded-2xl p-6 text-left group hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon name={mode.icon} size={22} className="text-white" />
                  </div>
                  <span className="text-xs glass px-3 py-1 rounded-full text-blue-300">{mode.badge}</span>
                </div>
                <h3 className="font-display text-white text-lg tracking-wide mb-1">{mode.label}</h3>
                <p className="text-muted-foreground text-sm">{mode.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
            <button onClick={() => setScreen("leaderboard")} className="btn-ghost px-6 py-3 rounded-xl flex items-center gap-2">
              <Icon name="Trophy" size={18} />
              <span className="font-display tracking-wide text-sm">ЛИДЕРБОРД</span>
            </button>
            <button onClick={() => setScreen("settings")} className="btn-ghost px-6 py-3 rounded-xl flex items-center gap-2">
              <Icon name="Settings" size={18} />
              <span className="font-display tracking-wide text-sm">НАСТРОЙКИ</span>
            </button>
            <button onClick={() => setScreen("battle-result")} className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2">
              <Icon name="Play" size={18} />
              <span className="tracking-wide text-sm">НАЧАТЬ БОЙ</span>
            </button>
          </div>

          <div className="mt-16 flex items-center gap-12">
            {[
              { name: player1Name, emoji: "🥊", delay: "0s" },
              { name: player2Name, emoji: "🥋", delay: "0.5s" },
            ].map((p, i) => (
              <div key={i} className="text-center animate-float" style={{ animationDelay: p.delay }}>
                <div className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center text-4xl mb-2 glow-blue">
                  {p.emoji}
                </div>
                <p className="text-sm text-muted-foreground">{p.name}</p>
                <div className="rank-badge px-3 py-1 rounded-full mt-1">
                  <span className="text-xs text-purple-300 font-display">БОЕЦ II</span>
                </div>
              </div>
            ))}
            <div className="font-display text-5xl gradient-text animate-pulse">VS</div>
          </div>
        </div>
      )}

      {/* BATTLE RESULT */}
      {screen === "battle-result" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="font-display text-sm tracking-[0.4em] text-blue-400 mb-2">РЕЗУЛЬТАТ БОЁВ</div>
              <h2 className="font-display text-5xl text-white mb-1"
                style={{ textShadow: "0 0 30px rgba(245,158,11,0.5)" }}>🏆 ПОБЕДА!</h2>
              <p className="text-muted-foreground">{mockBattleResult.winner} побеждает в матче</p>
            </div>

            <div className="glass-strong rounded-3xl p-8 mb-6 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl gradient-blue-purple flex items-center justify-center text-3xl mb-3 mx-auto glow-blue">🥊</div>
                  <p className="font-display text-white text-lg">{mockBattleResult.player1.name}</p>
                  <p className="text-green-400 text-sm font-medium">{mockBattleResult.player1.rating} рейтинга</p>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">HP: {mockBattleResult.player1.hp}%</div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="progress-bar h-full" style={{ width: `${mockBattleResult.player1.hp}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-display text-7xl gradient-text-gold mb-2">
                    {mockBattleResult.player1.score}<span className="text-white/30">:</span>{mockBattleResult.player2.score}
                  </div>
                  <div className="glass px-4 py-2 rounded-full">
                    <span className="text-xs text-muted-foreground">{mockBattleResult.rounds} раунда • {mockBattleResult.duration}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl mb-3 mx-auto">🥋</div>
                  <p className="font-display text-white text-lg">{mockBattleResult.player2.name}</p>
                  <p className="text-red-400 text-sm font-medium">{mockBattleResult.player2.rating} рейтинга</p>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">HP: {mockBattleResult.player2.hp}%</div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${mockBattleResult.player2.hp}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in-up delay-200" style={{ opacity: 0 }}>
              {[
                { label: "Всего ударов", value: mockBattleResult.totalHits, icon: "Zap" },
                { label: "Идеальных раундов", value: mockBattleResult.perfectRounds, icon: "Star" },
                { label: "Длительность", value: mockBattleResult.duration, icon: "Clock" },
              ].map((stat, i) => (
                <div key={i} className="stat-card p-5 text-center">
                  <Icon name={stat.icon} size={22} className="text-blue-400 mx-auto mb-2" />
                  <div className="font-display text-2xl text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5 mb-6 flex items-center justify-between animate-fade-in-up delay-300" style={{ opacity: 0 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl rank-badge flex items-center justify-center text-xl">👑</div>
                <div>
                  <p className="text-sm text-muted-foreground">Ваш рейтинг</p>
                  <p className="font-display text-white">1980 → <span className="text-green-400">2025</span></p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl text-green-400">+45</div>
                <div className="text-xs text-muted-foreground">очков рейтинга</div>
              </div>
            </div>

            <div className="flex gap-3 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
              <button className="btn-ghost flex-1 py-3 rounded-xl font-display tracking-wide text-sm" onClick={() => setScreen("menu")}>
                В МЕНЮ
              </button>
              <button className="btn-ghost flex-1 py-3 rounded-xl font-display tracking-wide text-sm">
                <Icon name="RotateCcw" size={16} className="inline mr-2" />РЕВАНШ
              </button>
              <button className="btn-primary flex-1 py-3 rounded-xl font-display tracking-wide text-sm">
                <Icon name="Play" size={16} className="inline mr-2" />НОВЫЙ БОЙ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {screen === "settings" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="font-display text-sm tracking-[0.4em] text-purple-400 mb-2">КОНФИГУРАЦИЯ</div>
              <h2 className="font-display text-4xl gradient-text">НАСТРОЙКИ</h2>
            </div>

            <div className="space-y-4">
              <div className="glass-strong rounded-2xl p-6 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
                <h3 className="font-display text-white text-sm tracking-widest mb-5 flex items-center gap-2">
                  <Icon name="Users" size={16} className="text-blue-400" />
                  ИГРОКИ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Игрок 1", value: player1Name, set: setPlayer1Name, emoji: "🥊" },
                    { label: "Игрок 2", value: player2Name, set: setPlayer2Name, emoji: "🥋" },
                  ].map((p, i) => (
                    <div key={i}>
                      <label className="text-xs text-muted-foreground mb-2 block">{p.emoji} {p.label}</label>
                      <input
                        value={p.value}
                        onChange={(e) => p.set(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-display tracking-wide text-sm outline-none focus:border-blue-500/60 transition-all"
                        maxLength={16}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6 animate-fade-in-up delay-200" style={{ opacity: 0 }}>
                <h3 className="font-display text-white text-sm tracking-widest mb-5 flex items-center gap-2">
                  <Icon name="Volume2" size={16} className="text-blue-400" />
                  ЗВУК
                </h3>
                <div className="space-y-5">
                  {[
                    { label: "Общая громкость", val: volume, set: setVolume, icon: "Volume2" },
                    { label: "Музыка", val: music, set: setMusic, icon: "Music" },
                    { label: "Звуковые эффекты", val: sfx, set: setSfx, icon: "Zap" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Icon name={s.icon} size={16} className="text-muted-foreground w-4 shrink-0" />
                      <span className="text-sm text-muted-foreground w-44 shrink-0">{s.label}</span>
                      <input
                        type="range" min={0} max={100} value={s.val}
                        onChange={(e) => s.set(Number(e.target.value))}
                        className="slider-track flex-1"
                        style={{ "--val": `${s.val}%` } as React.CSSProperties}
                      />
                      <span className="font-display text-white text-sm w-8 text-right">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
                <h3 className="font-display text-white text-sm tracking-widest mb-5 flex items-center gap-2">
                  <Icon name="Monitor" size={16} className="text-blue-400" />
                  ДИСПЛЕЙ
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Icon name="Sun" size={16} className="text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-44 shrink-0">Яркость</span>
                    <input type="range" min={20} max={100} value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="slider-track flex-1"
                      style={{ "--val": `${brightness}%` } as React.CSSProperties}
                    />
                    <span className="font-display text-white text-sm w-8 text-right">{brightness}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Icon name="Cpu" size={16} className="text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-44 shrink-0">Качество графики</span>
                    <div className="flex gap-2 flex-1">
                      {(["low", "medium", "high"] as const).map((q) => (
                        <button key={q} onClick={() => setGraphicsQuality(q)}
                          className={`flex-1 py-2 rounded-xl text-xs font-display tracking-wide transition-all ${graphicsQuality === q ? "btn-primary" : "btn-ghost"}`}>
                          {q === "low" ? "НИЗКОЕ" : q === "medium" ? "СРЕДНЕЕ" : "ВЫСОКОЕ"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn-primary w-full py-4 rounded-xl font-display tracking-widest animate-fade-in-up delay-400" style={{ opacity: 0 }}>
                СОХРАНИТЬ НАСТРОЙКИ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD */}
      {screen === "leaderboard" && (
        <div className="min-h-screen flex flex-col items-center justify-start px-6 py-24">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="font-display text-sm tracking-[0.4em] text-amber-400 mb-2">МИРОВОЙ РЕЙТИНГ</div>
              <h2 className="font-display text-4xl gradient-text-gold">ЛИДЕРБОРД</h2>
            </div>

            {/* Top 3 podium */}
            <div className="grid grid-cols-3 gap-4 mb-8 items-end animate-fade-in-up delay-100" style={{ opacity: 0 }}>
              {([1, 0, 2] as const).map((idx) => {
                const p = mockLeaderboard[idx];
                const pos = (idx === 0 ? 1 : idx === 1 ? 2 : 3) as 1 | 2 | 3;
                const heightMap = { 1: "h-32", 2: "h-24", 3: "h-20" };
                const emojis = { 1: "🥇", 2: "🥈", 3: "🥉" };
                const barColors = {
                  1: "linear-gradient(to bottom, #f59e0b, transparent)",
                  2: "linear-gradient(to bottom, #94a3b8, transparent)",
                  3: "linear-gradient(to bottom, #b45309, transparent)",
                };
                return (
                  <div key={idx} className={`flex flex-col items-center ${idx === 0 ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                    <div className={`font-display text-2xl mb-1 ${idx === 0 ? "animate-float" : ""}`}>{emojis[pos]}</div>
                    <div className={`glass-strong rounded-2xl p-4 text-center w-full ${pos === 1 ? "glow-gold" : ""}`}>
                      <p className="font-display text-white text-sm mb-1">{p.name}</p>
                      <p className="font-display text-blue-400 text-lg">{p.rating}</p>
                      <p className="text-xs text-muted-foreground">{p.wins}W / {p.losses}L</p>
                    </div>
                    <div className={`${heightMap[pos]} w-full rounded-b-xl mt-1 opacity-30`}
                      style={{ background: barColors[pos] }} />
                  </div>
                );
              })}
            </div>

            {/* Full list */}
            <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in-up delay-200" style={{ opacity: 0 }}>
              <div className="grid grid-cols-12 px-5 py-3 text-xs text-muted-foreground font-display tracking-widest border-b border-white/5">
                <div className="col-span-1">#</div>
                <div className="col-span-4">ИГРОК</div>
                <div className="col-span-2 text-center">РАНГ</div>
                <div className="col-span-2 text-center">РЕЙТИНГ</div>
                <div className="col-span-2 text-center">ПОБЕДЫ</div>
                <div className="col-span-1 text-center">🔥</div>
              </div>
              {mockLeaderboard.map((p, i) => (
                <div key={i}
                  className={`leaderboard-row grid grid-cols-12 px-5 py-4 items-center border-b border-white/5 last:border-0 ${p.name === "Вы" ? "glass glow-blue" : ""}`}>
                  <div className={`col-span-1 font-display text-lg ${i === 0 ? "gradient-text-gold" : i < 3 ? "text-slate-400" : "text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm glass shrink-0 ${p.name === "Вы" ? "glow-blue" : ""}`}>
                      {p.name === "Вы" ? "🎮" : p.name[0]}
                    </div>
                    <span className={`font-display text-sm ${p.name === "Вы" ? "text-blue-300" : "text-white"}`}>{p.name}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm ${RANK_COLORS[p.rank]}`}>
                      {RANK_ICONS[p.rank]} {RANKS[p.rank]}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-display text-white">{p.rating}</div>
                  <div className="col-span-2 text-center">
                    <span className="text-green-400 text-sm">{p.wins}W</span>
                    <span className="text-muted-foreground text-xs"> / {p.losses}L</span>
                  </div>
                  <div className="col-span-1 text-center">
                    {p.streak > 0 && <span className="text-amber-400 font-display text-sm">{p.streak}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Personal stats */}
            <div className="grid grid-cols-4 gap-3 mt-6 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
              {[
                { label: "Ваша позиция", value: "#8", icon: "Hash" },
                { label: "Процент побед", value: "67%", icon: "TrendingUp" },
                { label: "Серия побед", value: "4🔥", icon: "Flame" },
                { label: "Текущий ранг", value: `${RANK_ICONS[2]} ${RANKS[2]}`, icon: "Award" },
              ].map((s, i) => (
                <div key={i} className="stat-card p-4 text-center">
                  <Icon name={s.icon} size={18} className="text-blue-400 mx-auto mb-2" />
                  <div className="font-display text-xl text-white mb-1">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
