import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "menu" | "battle" | "battle-result" | "settings" | "leaderboard" | "shop";
type GameMode = "solo" | "pvp" | "tournament" | "ranked";
type Zone = "head" | "body" | "legs";
type Phase = "choose" | "resolve";

// ─── Constants ────────────────────────────────────────────────────────────────
const ZONE_META: Record<Zone, { label: string; emoji: string; damage: number; blockEmoji: string }> = {
  head: { label: "ГОЛОВА",  emoji: "🥊", damage: 14, blockEmoji: "🛡️" },
  body: { label: "ЖИВОТ",   emoji: "👊", damage: 11, blockEmoji: "🛡️" },
  legs: { label: "НОГИ",    emoji: "🦵", damage: 8,  blockEmoji: "🛡️" },
};
const ZONES: Zone[] = ["head", "body", "legs"];
const MAX_ROUNDS = 15;
const PLAYER_HP = 80;
const DOUBLE_HIT_ROUNDS = [5, 10, 15]; // after these rounds, double hit becomes available once

const RANKS = ["Новичок", "Боец", "Воин", "Мастер", "Легенда", "Чемпион"];
const RANK_COLORS = ["text-slate-400","text-green-400","text-blue-400","text-purple-400","text-amber-400","text-red-400"];
const RANK_ICONS = ["🥉","🥈","🥇","💎","👑","🏆"];

function getRank(rating: number) {
  if (rating < 300) return 0;
  if (rating < 800) return 1;
  if (rating < 1500) return 2;
  if (rating < 2500) return 3;
  if (rating < 4000) return 4;
  return 5;
}

const mockLeaderboard = [
  { name: "DragonSlayer", wins: 342, losses: 28, rank: 5, rating: 4820, streak: 12 },
  { name: "NightWolf",    wins: 298, losses: 41, rank: 5, rating: 4540, streak: 7 },
  { name: "IronFist",     wins: 251, losses: 55, rank: 4, rating: 3980, streak: 3 },
  { name: "ShadowKnight", wins: 210, losses: 70, rank: 4, rating: 3620, streak: 5 },
  { name: "ThunderBolt",  wins: 189, losses: 92, rank: 3, rating: 3100, streak: 0 },
  { name: "BlazeFury",    wins: 165, losses: 88, rank: 3, rating: 2890, streak: 2 },
  { name: "IceStorm",     wins: 140, losses: 110, rank: 2, rating: 2440, streak: 1 },
  { name: "Вы",           wins: 87,  losses: 43, rank: 2, rating: 1980, streak: 4 },
];

// ─── Shop items ───────────────────────────────────────────────────────────────
const FIGHTERS_SHOP = [
  { id: "glass", name: "Стеклянная пушка", desc: "Меньше HP, больше урон", price: 2500, emoji: "💥" },
  { id: "tank",  name: "Танк",             desc: "Больше HP, меньше урон", price: 2500, emoji: "🛡️" },
  { id: "crit",  name: "Критик",           desc: "Шанс крита 50% после 5 раунда", price: 3000, emoji: "⚡" },
  { id: "dodge", name: "Уклонист",         desc: "Шанс уклонения 30% после 5 раунда", price: 3000, emoji: "💨" },
];
const ENERGY_UPGRADES = [
  { step: 1, price: 300, bonus: "+1 к максимуму" },
  { step: 2, price: 500, bonus: "+1 к максимуму" },
  { step: 3, price: 700, bonus: "+2 к максимуму" },
  { step: 4, price: 900, bonus: "+2 к максимуму" },
  { step: 5, price: 1100, bonus: "+2 к максимуму" },
  { step: 6, price: 1300, bonus: "+2 к максимуму" },
];

// ─── Battle State ─────────────────────────────────────────────────────────────
interface BattleState {
  playerHP: number;
  enemyHP: number;
  round: number;
  phase: Phase;
  log: string[];
  totalHits: number;
  perfectRounds: number;
  startTime: number;
  doubleHitAvailable: boolean;
  doubleHitUsed: boolean;
  // player selections
  selectedAttacks: Zone[];   // 1 normally, up to 2 on double
  selectedBlocks: Zone[];    // 1 normally, up to 2 on double
}

function initBattle(): BattleState {
  return {
    playerHP: PLAYER_HP, enemyHP: PLAYER_HP,
    round: 1, phase: "choose", log: [],
    totalHits: 0, perfectRounds: 0,
    startTime: Date.now(),
    doubleHitAvailable: false, doubleHitUsed: false,
    selectedAttacks: [], selectedBlocks: [],
  };
}

// ─── Result ───────────────────────────────────────────────────────────────────
interface BattleResult {
  winner: "player" | "enemy" | "draw";
  isKO: boolean;
  rounds: number;
  totalHits: number;
  perfectRounds: number;
  duration: string;
  coinsEarned: number;
  ratingEarned: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Index() {
  // Player stats (persisted in session)
  const [playerName]   = useState("Игрок 1");
  const [coins, setCoins]    = useState(350);
  const [rating, setRating]  = useState(1980);
  const [energy, setEnergy]  = useState(7);
  const [maxEnergy, setMaxEnergy] = useState(10);
  const [purchasedFighters, setPurchasedFighters] = useState<string[]>([]);
  const [energyUpgradeStep, setEnergyUpgradeStep] = useState(0);
  const [adUsedToday, setAdUsedToday]  = useState(0);
  const [buyUsedToday, setBuyUsedToday] = useState(0);
  const energyTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [screen, setScreen]         = useState<Screen>("menu");
  const [gameMode, setGameMode]     = useState<GameMode>("solo");
  const [shopTab, setShopTab]       = useState<"fighters" | "energy">("fighters");
  const [brightness, setBrightness] = useState(75);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [player1Name, setPlayer1Name] = useState("Игрок 1");
  const [player2Name, setPlayer2Name] = useState("Игрок 2");
  const [volume, setVolume] = useState(70);
  const [music, setMusic]   = useState(50);
  const [sfx, setSfx]       = useState(80);
  const [graphicsQuality, setGraphicsQuality] = useState<"low"|"medium"|"high">("high");

  // Battle
  const [battle, setBattle]           = useState<BattleState>(initBattle());
  const [result, setResult]           = useState<BattleResult | null>(null);
  const [resolveData, setResolveData] = useState<{ msgs: string[]; playerDmg: number; enemyDmg: number } | null>(null);
  const [shakeP, setShakeP] = useState(false);
  const [shakeE, setShakeE] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-restore energy every 3 min
  useEffect(() => {
    energyTimer.current = setInterval(() => {
      setEnergy(e => e < maxEnergy ? e + 1 : e);
    }, 3 * 60 * 1000);
    return () => { if (energyTimer.current) clearInterval(energyTimer.current); };
  }, [maxEnergy]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle.log]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function startBattle(mode: GameMode) {
    if (energy <= 0) { setShowEnergyModal(true); return; }
    setEnergy(e => e - 1);
    setGameMode(mode);
    setBattle(initBattle());
    setResolveData(null);
    setResult(null);
    setScreen("battle");
  }

  function toggleAttack(zone: Zone) {
    setBattle(s => {
      const maxSel = s.doubleHitAvailable && !s.doubleHitUsed ? 2 : 1;
      if (s.selectedAttacks.includes(zone)) {
        return { ...s, selectedAttacks: s.selectedAttacks.filter(z => z !== zone) };
      }
      if (s.selectedAttacks.length >= maxSel) {
        return { ...s, selectedAttacks: [s.selectedAttacks[s.selectedAttacks.length - 1], zone].slice(-maxSel) };
      }
      return { ...s, selectedAttacks: [...s.selectedAttacks, zone] };
    });
  }

  function toggleBlock(zone: Zone) {
    setBattle(s => {
      const maxSel = s.doubleHitAvailable && !s.doubleHitUsed ? 2 : 1;
      if (s.selectedBlocks.includes(zone)) {
        return { ...s, selectedBlocks: s.selectedBlocks.filter(z => z !== zone) };
      }
      if (s.selectedBlocks.length >= maxSel) {
        return { ...s, selectedBlocks: [s.selectedBlocks[s.selectedBlocks.length - 1], zone].slice(-maxSel) };
      }
      return { ...s, selectedBlocks: [...s.selectedBlocks, zone] };
    });
  }

  function aiChoose(): { attacks: Zone[]; blocks: Zone[] } {
    const isDouble = battle.doubleHitAvailable && !battle.doubleHitUsed && Math.random() < 0.5;
    const shuffled = [...ZONES].sort(() => Math.random() - 0.5);
    return {
      attacks: isDouble ? shuffled.slice(0, 2) : [shuffled[0]],
      blocks:  isDouble ? shuffled.slice(0, 2) : [shuffled[Math.floor(Math.random() * 3)]],
    };
  }

  function resolveRound() {
    if (battle.selectedAttacks.length === 0 || battle.selectedBlocks.length === 0) return;

    const ai = aiChoose();
    const s = { ...battle };
    const msgs: string[] = [`— Раунд ${s.round} —`];
    let pDmg = 0;
    let eDmg = 0;
    let hitCount = 0;
    let playerPerfect = true;

    // Player attacks enemy
    for (const zone of s.selectedAttacks) {
      const blocked = ai.blocks.includes(zone);
      if (blocked) {
        msgs.push(`🛡️ Удар в ${ZONE_META[zone].label.toLowerCase()} — заблокировано!`);
      } else {
        const dmg = ZONE_META[zone].damage;
        eDmg += dmg;
        hitCount++;
        msgs.push(`${ZONE_META[zone].emoji} Удар в ${ZONE_META[zone].label.toLowerCase()} — ${dmg} урона!`);
      }
    }

    // Enemy attacks player
    for (const zone of ai.attacks) {
      const blocked = s.selectedBlocks.includes(zone);
      if (blocked) {
        msgs.push(`✅ Заблокировал удар в ${ZONE_META[zone].label.toLowerCase()}!`);
      } else {
        const dmg = ZONE_META[zone].damage;
        pDmg += dmg;
        playerPerfect = false;
        msgs.push(`⚠️ Пропустил удар в ${ZONE_META[zone].label.toLowerCase()} — ${dmg} урона!`);
      }
    }

    s.playerHP = Math.max(0, s.playerHP - pDmg);
    s.enemyHP  = Math.max(0, s.enemyHP  - eDmg);
    s.totalHits += hitCount;
    if (playerPerfect && eDmg > 0) s.perfectRounds++;
    if (s.doubleHitAvailable && !s.doubleHitUsed && s.selectedAttacks.length === 2) s.doubleHitUsed = true;
    s.log = [...s.log, ...msgs];
    s.phase = "resolve";

    setResolveData({ msgs, playerDmg: pDmg, enemyDmg: eDmg });
    if (eDmg > 0) { setShakeE(true); setTimeout(() => setShakeE(false), 500); }
    if (pDmg > 0) { setShakeP(true); setTimeout(() => setShakeP(false), 500); }
    setBattle(s);

    setTimeout(() => {
      const next = { ...s };
      const ko = next.playerHP <= 0 || next.enemyHP <= 0;
      const lastRound = next.round >= MAX_ROUNDS;

      if (ko || lastRound) {
        const playerWon = next.enemyHP < next.playerHP;
        const draw = next.enemyHP === next.playerHP;
        const isKO = ko && !draw;
        const secs = Math.floor((Date.now() - next.startTime) / 1000);
        const duration = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

        let coinsEarned = 0;
        let ratingEarned = 0;
        if (draw) { coinsEarned = 5; ratingEarned = 0; }
        else if (playerWon && isKO) { coinsEarned = 15; ratingEarned = 150; }
        else if (playerWon) { coinsEarned = 10; ratingEarned = 100; }

        setCoins(c => c + coinsEarned);
        setRating(r => r + ratingEarned);

        setResult({
          winner: draw ? "draw" : playerWon ? "player" : "enemy",
          isKO, rounds: next.round,
          totalHits: next.totalHits, perfectRounds: next.perfectRounds,
          duration, coinsEarned, ratingEarned,
        });
        setScreen("battle-result");
      } else {
        // Next round
        next.round++;
        next.phase = "choose";
        next.selectedAttacks = [];
        next.selectedBlocks = [];
        // Check if double hit unlocks this round
        if (DOUBLE_HIT_ROUNDS.includes(next.round - 1)) {
          next.doubleHitAvailable = true;
          next.doubleHitUsed = false;
        }
        setResolveData(null);
        setBattle(next);
      }
    }, 2500);
  }

  function buyEnergy(method: "ad" | "coins") {
    if (energy >= maxEnergy) return;
    if (method === "ad") {
      if (adUsedToday >= 10) return;
      setEnergy(e => Math.min(maxEnergy, e + 1));
      setAdUsedToday(d => d + 1);
    } else {
      if (buyUsedToday >= 10 || coins < 5) return;
      setCoins(c => c - 5);
      setEnergy(e => Math.min(maxEnergy, e + 1));
      setBuyUsedToday(d => d + 1);
    }
    setShowEnergyModal(false);
  }

  function buyFighter(id: string, price: number) {
    if (coins < price || purchasedFighters.includes(id)) return;
    setCoins(c => c - price);
    setPurchasedFighters(prev => [...prev, id]);
  }

  function buyEnergyUpgrade(step: number, price: number, bonus: number) {
    if (energyUpgradeStep >= step || coins < price) return;
    setCoins(c => c - price);
    setMaxEnergy(m => m + bonus);
    setEnergyUpgradeStep(step);
  }

  // ─── Derived ──────────────────────────────────────────────────────────────────
  const rank = getRank(rating);
  const doubleActive = battle.doubleHitAvailable && !battle.doubleHitUsed;
  const maxSel = doubleActive ? 2 : 1;
  const canFight = battle.selectedAttacks.length > 0 && battle.selectedBlocks.length > 0;
  const enemyName = gameMode === "solo" ? "Компьютер" : player2Name;

  // ─── HP bar ───────────────────────────────────────────────────────────────────
  function HPBar({ hp, label, color = "blue" }: { hp: number; label: string; color?: string }) {
    const pct = Math.round((hp / PLAYER_HP) * 100);
    const bg = color === "blue"
      ? "linear-gradient(90deg,#3b82f6,#8b5cf6)"
      : "linear-gradient(90deg,#ec4899,#8b5cf6)";
    return (
      <div className="flex items-center gap-3">
        <span className="font-display text-xs text-white w-20 truncate">{label}</span>
        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: bg }} />
        </div>
        <span className={`font-display text-xs w-8 text-right ${hp < 20 ? "text-red-400" : "text-white"}`}>{hp}</span>
      </div>
    );
  }

  // ─── Zone button ─────────────────────────────────────────────────────────────
  function ZoneBtn({ zone, mode, selected, onToggle, maxReached }: {
    zone: Zone; mode: "attack" | "block"; selected: boolean; onToggle: () => void; maxReached: boolean;
  }) {
    const meta = ZONE_META[zone];
    const accentSel = mode === "attack" ? "border-blue-500 bg-blue-500/20" : "border-purple-500 bg-purple-500/20";
    const accentHov = mode === "attack" ? "hover:border-blue-400/50 hover:bg-white/5" : "hover:border-purple-400/50 hover:bg-white/5";
    const disabled = !selected && maxReached;
    return (
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all duration-200
          ${selected ? `${accentSel} scale-105 shadow-lg` : disabled ? "border-white/5 opacity-30 cursor-not-allowed" : `border-white/10 ${accentHov}`}`}>
        <span className="text-4xl">{mode === "attack" ? meta.emoji : meta.blockEmoji}</span>
        <span className="font-display text-white text-xs tracking-wide">{meta.label}</span>
        {mode === "attack" && <span className="text-xs text-muted-foreground">{meta.damage} урона</span>}
        {selected && <div className="w-2 h-2 rounded-full bg-current mt-1 animate-pulse" />}
      </button>
    );
  }

  // ─── Stats bar (menu/battle top) ──────────────────────────────────────────────
  function StatsBar({ compact = false }: { compact?: boolean }) {
    return (
      <div className={`flex items-center gap-${compact ? "3" : "4"}`}>
        <div className="flex items-center gap-1 glass px-3 py-1.5 rounded-full">
          <span className="text-amber-400 text-sm">🪙</span>
          <span className="font-display text-white text-xs">{coins}</span>
        </div>
        <div className="flex items-center gap-1 glass px-3 py-1.5 rounded-full">
          <span className="text-blue-400 text-sm">🏅</span>
          <span className="font-display text-white text-xs">{rating}</span>
        </div>
        <button
          onClick={() => setShowEnergyModal(true)}
          className={`flex items-center gap-1 glass px-3 py-1.5 rounded-full ${energy === 0 ? "border border-red-500/50 animate-pulse" : ""}`}>
          <span className="text-yellow-400 text-sm">⚡</span>
          <span className={`font-display text-xs ${energy === 0 ? "text-red-400" : "text-white"}`}>{energy}/{maxEnergy}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ filter: `brightness(${0.6 + brightness * 0.005})` }}>
      {/* BG orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
      </div>

      {/* Energy modal */}
      {showEnergyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-3xl p-8 max-w-sm w-full text-center animate-fade-in-up">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="font-display text-white text-xl mb-2">ЭНЕРГИЯ</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {energy >= maxEnergy ? "Энергия полная!" : `У вас ${energy}/${maxEnergy} энергии`}
            </p>
            {energy < maxEnergy && (
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => buyEnergy("ad")}
                  disabled={adUsedToday >= 10}
                  className={`w-full py-3 rounded-xl font-display text-sm tracking-wide transition-all
                    ${adUsedToday >= 10 ? "glass opacity-40 cursor-not-allowed text-muted-foreground" : "btn-primary"}`}>
                  📺 Реклама (+1 энергия) {adUsedToday >= 10 ? "— лимит" : `— ${10 - adUsedToday} осталось`}
                </button>
                <button
                  onClick={() => buyEnergy("coins")}
                  disabled={buyUsedToday >= 10 || coins < 5}
                  className={`w-full py-3 rounded-xl font-display text-sm tracking-wide transition-all
                    ${buyUsedToday >= 10 || coins < 5 ? "glass opacity-40 cursor-not-allowed text-muted-foreground" : "btn-ghost"}`}>
                  🪙 5 монет → +1 энергия {buyUsedToday >= 10 ? "— лимит" : ""}
                </button>
              </div>
            )}
            <button onClick={() => setShowEnergyModal(false)} className="btn-ghost w-full py-2 rounded-xl text-sm">
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* ─── NAV (non-battle, non-menu) ─── */}
      {screen !== "menu" && screen !== "battle" && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
          <div className="glass rounded-2xl px-5 py-2.5 flex items-center justify-between max-w-4xl mx-auto">
            <button onClick={() => setScreen("menu")} className="flex items-center gap-2 btn-ghost px-3 py-1.5 rounded-xl">
              <Icon name="ChevronLeft" size={16} />
              <span className="font-display text-xs tracking-wide">МЕНЮ</span>
            </button>
            <span className="font-display gradient-text text-base tracking-widest">FIGHT ARENA</span>
            <StatsBar compact />
          </div>
        </div>
      )}

      {/* ═══════════════════════ MAIN MENU ═══════════════════════ */}
      {screen === "menu" && (
        <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-8 pb-12">
          {/* Top bar */}
          <div className="w-full max-w-2xl glass rounded-2xl px-5 py-3 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center text-xl">🥊</div>
              <div>
                <p className="font-display text-white text-sm">{player1Name}</p>
                <p className={`text-xs ${RANK_COLORS[rank]}`}>{RANK_ICONS[rank]} {RANKS[rank]}</p>
              </div>
            </div>
            <StatsBar />
          </div>

          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="font-display text-6xl gradient-text mb-1 tracking-wider">FIGHT</h1>
            <h1 className="font-display text-6xl text-white mb-2 tracking-wider"
              style={{ textShadow: "0 0 40px rgba(139,92,246,0.5)" }}>ARENA</h1>
            <p className="text-muted-foreground text-sm">Выбери режим и начни сражение</p>
          </div>

          {/* Mode grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-6">
            {[
              { icon: "User",    label: "1 ИГРОК",        desc: "Бой с компьютерным противником", badge: "vs ИИ",      color: "from-cyan-500 to-blue-600",   mode: "solo" as GameMode,       active: true },
              { icon: "Swords",  label: "ОДИН НА ОДИН",   desc: "Поединок двух игроков",          badge: "2 игрока",   color: "from-blue-500 to-purple-600", mode: "pvp" as GameMode,        active: true },
              { icon: "Users",   label: "ТУРНИР",         desc: "Соревнование до последнего",     badge: "Скоро",      color: "from-purple-500 to-pink-600", mode: "tournament" as GameMode, active: false },
              { icon: "Trophy",  label: "РЕЙТИНГОВЫЙ",    desc: "Зарабатывай очки и поднимайся", badge: "Скоро",      color: "from-amber-500 to-orange-600",mode: "ranked" as GameMode,     active: false },
            ].map((m, i) => (
              <button key={i}
                onClick={() => m.active ? startBattle(m.mode) : undefined}
                className={`glass-strong rounded-2xl p-5 text-left group transition-all duration-300 relative overflow-hidden
                  ${m.active ? "hover:scale-[1.02] cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                style={{ animationDelay: `${i * 0.08}s` }}>
                {!m.active && (
                  <div className="absolute top-2 right-2 glass px-2 py-0.5 rounded-full text-xs text-muted-foreground">Скоро</div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center ${m.active ? "group-hover:scale-110" : ""} transition-transform`}>
                    <Icon name={m.icon} size={20} className="text-white" />
                  </div>
                  <span className="text-xs glass px-2 py-0.5 rounded-full text-blue-300">{m.badge}</span>
                </div>
                <h3 className="font-display text-white text-base tracking-wide mb-0.5">{m.label}</h3>
                <p className="text-muted-foreground text-xs">{m.desc}</p>
              </button>
            ))}
          </div>

          {/* Bottom buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "МАГАЗИН",    icon: "ShoppingBag", action: () => setScreen("shop") },
              { label: "РЕЙТИНГ",    icon: "Trophy",      action: () => setScreen("leaderboard") },
              { label: "НАСТРОЙКИ",  icon: "Settings",    action: () => setScreen("settings") },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} className="btn-ghost px-5 py-2.5 rounded-xl flex items-center gap-2">
                <Icon name={btn.icon} size={16} />
                <span className="font-display tracking-wide text-xs">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════ BATTLE SCREEN ═══════════════════════ */}
      {screen === "battle" && (
        <div className="min-h-screen flex flex-col px-3 py-4 max-w-2xl mx-auto">
          {/* Battle header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setScreen("menu")} className="btn-ghost px-3 py-1.5 rounded-xl text-xs font-display flex items-center gap-1">
              <Icon name="X" size={13} /> ВЫЙТИ
            </button>
            <div className="glass px-5 py-1.5 rounded-full flex items-center gap-2">
              <span className="font-display text-sm gradient-text tracking-widest">РАУНД {battle.round}</span>
              <span className="text-muted-foreground text-xs">/ {MAX_ROUNDS}</span>
            </div>
            <StatsBar compact />
          </div>

          {/* HP Bars */}
          <div className="glass-strong rounded-2xl p-4 mb-3 space-y-2.5">
            <HPBar hp={battle.playerHP} label={player1Name} color="blue" />
            <HPBar hp={battle.enemyHP} label={enemyName} color="pink" />
          </div>

          {/* Fighters */}
          <div className="flex items-center justify-between gap-2 mb-3 px-2">
            <div className={`text-center transition-transform duration-100 ${shakeP ? "translate-x-1" : ""}`}>
              <div className={`text-6xl ${battle.phase === "choose" ? "animate-float" : ""}`}>🥊</div>
              <div className={`text-xs font-display mt-1 ${battle.playerHP < 20 ? "text-red-400" : "text-blue-300"}`}>
                {battle.playerHP < 20 ? "⚠️ КРИТИЧНО" : "✅ В ФОРМЕ"}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
              {doubleActive && battle.phase === "choose" && (
                <div className="glass px-3 py-1 rounded-full text-xs text-amber-400 font-display animate-pulse">
                  ⚡ ДВОЙНОЙ УДАР!
                </div>
              )}
              {battle.phase === "resolve" && resolveData && (
                <div className="space-y-1 w-full">
                  {resolveData.msgs.filter(m => !m.startsWith("—")).slice(0, 3).map((m, i) => (
                    <div key={i} className={`glass px-2 py-1 rounded-lg text-xs text-center
                      ${m.includes("урона") && m.includes("💥") || m.includes("урона") && m.includes("Удар") ? "text-green-400" :
                        m.includes("заблокировано") || m.includes("Заблокировал") ? "text-blue-300" : "text-red-400"}`}>
                      {m}
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground text-center animate-pulse">Следующий раунд...</div>
                </div>
              )}
              {battle.phase === "choose" && !doubleActive && (
                <div className="font-display text-2xl gradient-text animate-pulse">VS</div>
              )}
            </div>

            <div className={`text-center transition-transform duration-100 ${shakeE ? "-translate-x-1" : ""}`}>
              <div className={`text-6xl ${battle.phase === "choose" ? "animate-float" : ""}`} style={{ animationDelay: "0.3s" }}>🤖</div>
              <div className={`text-xs font-display mt-1 ${battle.enemyHP < 20 ? "text-red-400" : "text-purple-300"}`}>
                {battle.enemyHP < 20 ? "⚠️ КРИТИЧНО" : "🤖 АКТИВЕН"}
              </div>
            </div>
          </div>

          {/* Action panel */}
          {battle.phase === "choose" && (
            <div className="space-y-3 animate-fade-in-up">
              {/* ATTACK */}
              <div className="glass-strong rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display text-xs text-blue-400 tracking-widest">
                    ⚔️ АТАКА {doubleActive ? `(выбрано ${battle.selectedAttacks.length}/2)` : `(выбрано ${battle.selectedAttacks.length}/1)`}
                  </p>
                  {doubleActive && <span className="text-xs text-amber-400 glass px-2 py-0.5 rounded-full">⚡ Двойной удар</span>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ZONES.map(z => (
                    <ZoneBtn key={z} zone={z} mode="attack"
                      selected={battle.selectedAttacks.includes(z)}
                      onToggle={() => toggleAttack(z)}
                      maxReached={battle.selectedAttacks.length >= maxSel && !battle.selectedAttacks.includes(z)} />
                  ))}
                </div>
              </div>

              {/* BLOCK */}
              <div className="glass-strong rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display text-xs text-purple-400 tracking-widest">
                    🛡️ ЗАЩИТА {doubleActive ? `(выбрано ${battle.selectedBlocks.length}/2)` : `(выбрано ${battle.selectedBlocks.length}/1)`}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ZONES.map(z => (
                    <ZoneBtn key={z} zone={z} mode="block"
                      selected={battle.selectedBlocks.includes(z)}
                      onToggle={() => toggleBlock(z)}
                      maxReached={battle.selectedBlocks.length >= maxSel && !battle.selectedBlocks.includes(z)} />
                  ))}
                </div>
              </div>

              {/* Fight button */}
              <button
                disabled={!canFight || battle.phase !== "choose"}
                onClick={resolveRound}
                className={`w-full py-4 rounded-xl font-display tracking-widest text-base transition-all
                  ${canFight ? "btn-primary animate-pulse-glow" : "glass opacity-30 cursor-not-allowed text-muted-foreground"}`}>
                {canFight ? "⚔️ АТАКОВАТЬ!" : "Выбери атаку и защиту"}
              </button>
            </div>
          )}

          {/* Log */}
          {battle.log.length > 0 && (
            <div ref={logRef} className="mt-3 glass rounded-2xl p-3 max-h-24 overflow-y-auto space-y-0.5">
              {battle.log.map((line, i) => (
                <p key={i} className={`text-xs ${line.startsWith("—") ? "text-blue-400 font-display pt-1" : "text-muted-foreground"}`}>
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ BATTLE RESULT ═══════════════════════ */}
      {screen === "battle-result" && result && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8 animate-fade-in-up">
              <div className="font-display text-xs tracking-[0.4em] text-blue-400 mb-2">РЕЗУЛЬТАТ БОЯ</div>
              <h2 className="font-display text-5xl text-white mb-1" style={{ textShadow: "0 0 30px rgba(245,158,11,0.5)" }}>
                {result.winner === "player" ? (result.isKO ? "🏆 НОКАУТ!" : "🏆 ПОБЕДА!") :
                 result.winner === "enemy"  ? "💀 ПОРАЖЕНИЕ" : "🤝 НИЧЬЯ"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {result.winner === "player" ? `Победа ${result.isKO ? "нокаутом" : "по очкам"}` :
                 result.winner === "enemy"  ? "Противник победил" : "Взаимный нокаут"}
              </p>
            </div>

            {/* Rewards */}
            <div className="glass-strong rounded-2xl p-6 mb-4 animate-fade-in-up grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-2">{result.coinsEarned > 0 ? "🪙" : "—"}</div>
                <div className={`font-display text-2xl ${result.coinsEarned > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {result.coinsEarned > 0 ? `+${result.coinsEarned}` : "0"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">монет заработано</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">{result.ratingEarned > 0 ? "🏅" : "—"}</div>
                <div className={`font-display text-2xl ${result.ratingEarned > 0 ? "text-blue-400" : "text-muted-foreground"}`}>
                  {result.ratingEarned > 0 ? `+${result.ratingEarned}` : "0"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">рейтинга получено</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-in-up">
              {[
                { label: "Раундов", value: result.rounds, icon: "Hash" },
                { label: "Ударов", value: result.totalHits, icon: "Zap" },
                { label: "Время", value: result.duration, icon: "Clock" },
              ].map((s, i) => (
                <div key={i} className="stat-card p-4 text-center">
                  <Icon name={s.icon} size={18} className="text-blue-400 mx-auto mb-1" />
                  <div className="font-display text-xl text-white">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Current stats */}
            <div className="glass rounded-xl p-4 mb-6 flex justify-between items-center animate-fade-in-up">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">🪙</span>
                <span className="font-display text-white">{coins} монет</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🏅</span>
                <span className="font-display text-white">{rating} рейтинга</span>
                <span className={`text-xs ${RANK_COLORS[getRank(rating)]}`}>{RANK_ICONS[getRank(rating)]} {RANKS[getRank(rating)]}</span>
              </div>
            </div>

            <div className="flex gap-3 animate-fade-in-up">
              <button className="btn-ghost flex-1 py-3 rounded-xl font-display text-xs tracking-wide" onClick={() => setScreen("menu")}>
                В МЕНЮ
              </button>
              <button className="btn-primary flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                onClick={() => startBattle(gameMode)}>
                <Icon name="RotateCcw" size={14} className="inline mr-1" />РЕВАНШ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ SHOP ═══════════════════════ */}
      {screen === "shop" && (
        <div className="min-h-screen flex flex-col items-center pt-24 px-4 pb-12">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-6">
              <div className="font-display text-xs tracking-[0.4em] text-amber-400 mb-1">ВНУТРИИГРОВОЙ</div>
              <h2 className="font-display text-4xl gradient-text">МАГАЗИН</h2>
            </div>

            {/* Coins display */}
            <div className="glass px-5 py-3 rounded-2xl flex items-center justify-center gap-3 mb-6">
              <span className="text-2xl">🪙</span>
              <span className="font-display text-white text-xl">{coins} монет</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {(["fighters", "energy"] as const).map(tab => (
                <button key={tab} onClick={() => setShopTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl font-display text-xs tracking-wide transition-all
                    ${shopTab === tab ? "btn-primary" : "btn-ghost"}`}>
                  {tab === "fighters" ? "⚔️ БОЙЦЫ" : "⚡ ЭНЕРГИЯ"}
                </button>
              ))}
            </div>

            {/* Fighters tab */}
            {shopTab === "fighters" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIGHTERS_SHOP.map(f => {
                  const owned = purchasedFighters.includes(f.id);
                  return (
                    <div key={f.id} className="glass-strong rounded-2xl p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-3xl">{f.emoji}</span>
                        <div>
                          <p className="font-display text-white text-sm">{f.name}</p>
                          <p className="text-muted-foreground text-xs">{f.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-amber-400 font-display text-sm">🪙 {f.price}</span>
                        <button
                          onClick={() => buyFighter(f.id, f.price)}
                          disabled={owned || coins < f.price}
                          className={`px-4 py-1.5 rounded-xl font-display text-xs tracking-wide transition-all
                            ${owned ? "glass text-green-400 cursor-default" :
                              coins < f.price ? "glass opacity-40 cursor-not-allowed text-muted-foreground" : "btn-primary"}`}>
                          {owned ? "✓ Куплено" : "Купить"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Energy tab */}
            {shopTab === "energy" && (
              <div className="space-y-3">
                <div className="glass rounded-2xl p-4 text-center mb-2">
                  <p className="text-muted-foreground text-sm">Текущий максимум энергии: <span className="text-white font-display">{maxEnergy}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Расширяй до 20, покупая улучшения</p>
                </div>
                {ENERGY_UPGRADES.map((u) => {
                  const bonusNum = u.step <= 2 ? 1 : 2;
                  const owned = energyUpgradeStep >= u.step;
                  const available = energyUpgradeStep === u.step - 1;
                  return (
                    <div key={u.step} className={`glass-strong rounded-2xl p-4 flex items-center justify-between ${!available && !owned ? "opacity-40" : ""}`}>
                      <div>
                        <p className="font-display text-white text-sm">{u.bonus}</p>
                        <p className="text-xs text-muted-foreground">Улучшение {u.step}/6</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-display text-sm">🪙 {u.price}</span>
                        <button
                          onClick={() => buyEnergyUpgrade(u.step, u.price, bonusNum)}
                          disabled={owned || !available || coins < u.price}
                          className={`px-4 py-1.5 rounded-xl font-display text-xs tracking-wide transition-all
                            ${owned ? "glass text-green-400 cursor-default" :
                              !available ? "glass text-muted-foreground cursor-not-allowed" :
                              coins < u.price ? "glass opacity-40 cursor-not-allowed text-muted-foreground" : "btn-primary"}`}>
                          {owned ? "✓" : !available ? "🔒" : "Купить"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════ LEADERBOARD ═══════════════════════ */}
      {screen === "leaderboard" && (
        <div className="min-h-screen flex flex-col items-center pt-24 px-4 pb-12">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="font-display text-xs tracking-[0.4em] text-amber-400 mb-1">МИРОВОЙ РЕЙТИНГ</div>
              <h2 className="font-display text-4xl" style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ЛИДЕРБОРД</h2>
            </div>

            <div className="glass-strong rounded-2xl overflow-hidden mb-4">
              <div className="grid grid-cols-12 px-4 py-2 text-xs text-muted-foreground font-display tracking-widest border-b border-white/5">
                <div className="col-span-1">#</div>
                <div className="col-span-4">ИГРОК</div>
                <div className="col-span-3 text-center">РАНГ</div>
                <div className="col-span-2 text-center">РЕЙТИНГ</div>
                <div className="col-span-2 text-center">В/П</div>
              </div>
              {mockLeaderboard.map((p, i) => (
                <div key={i}
                  className={`leaderboard-row grid grid-cols-12 px-4 py-3 items-center border-b border-white/5 last:border-0 ${p.name === "Вы" ? "glass glow-blue" : ""}`}>
                  <div className={`col-span-1 font-display text-base ${i === 0 ? "text-amber-400" : i < 3 ? "text-slate-400" : "text-muted-foreground"}`}>{i + 1}</div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs glass shrink-0 ${p.name === "Вы" ? "glow-blue" : ""}`}>
                      {p.name === "Вы" ? "🎮" : p.name[0]}
                    </div>
                    <span className={`font-display text-xs ${p.name === "Вы" ? "text-blue-300" : "text-white"}`}>{p.name}</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className={`text-xs ${RANK_COLORS[p.rank]}`}>{RANK_ICONS[p.rank]}</span>
                    <span className={`text-xs ml-1 ${RANK_COLORS[p.rank]}`}>{RANKS[p.rank]}</span>
                  </div>
                  <div className="col-span-2 text-center font-display text-white text-xs">{p.rating}</div>
                  <div className="col-span-2 text-center text-xs">
                    <span className="text-green-400">{p.wins}</span>
                    <span className="text-muted-foreground">/{p.losses}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Ваш рейтинг", value: rating, icon: "Award" },
                { label: "Ваш ранг",    value: `${RANK_ICONS[rank]} ${RANKS[rank]}`, icon: "Star" },
                { label: "Монеты",      value: coins, icon: "Coins" },
              ].map((s, i) => (
                <div key={i} className="stat-card p-4 text-center">
                  <Icon name={s.icon} size={16} className="text-blue-400 mx-auto mb-1" />
                  <div className="font-display text-lg text-white">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ SETTINGS ═══════════════════════ */}
      {screen === "settings" && (
        <div className="min-h-screen flex flex-col items-center pt-24 px-4 pb-12">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="font-display text-xs tracking-[0.4em] text-purple-400 mb-1">КОНФИГУРАЦИЯ</div>
              <h2 className="font-display text-4xl gradient-text">НАСТРОЙКИ</h2>
            </div>
            <div className="space-y-4">
              <div className="glass-strong rounded-2xl p-5">
                <h3 className="font-display text-white text-xs tracking-widest mb-4 flex items-center gap-2">
                  <Icon name="Users" size={14} className="text-blue-400" />ИГРОКИ
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Игрок 1", value: player1Name, set: setPlayer1Name, emoji: "🥊" },
                    { label: "Игрок 2", value: player2Name, set: setPlayer2Name, emoji: "🥋" }].map((p, i) => (
                    <div key={i}>
                      <label className="text-xs text-muted-foreground mb-1 block">{p.emoji} {p.label}</label>
                      <input value={p.value} onChange={e => p.set(e.target.value)} maxLength={16}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-display text-xs outline-none focus:border-blue-500/60 transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-5">
                <h3 className="font-display text-white text-xs tracking-widest mb-4 flex items-center gap-2">
                  <Icon name="Volume2" size={14} className="text-blue-400" />ЗВУК
                </h3>
                <div className="space-y-4">
                  {[{ label: "Громкость", val: volume, set: setVolume, icon: "Volume2" },
                    { label: "Музыка",    val: music,  set: setMusic,  icon: "Music" },
                    { label: "Эффекты",   val: sfx,    set: setSfx,    icon: "Zap" }].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Icon name={s.icon} size={14} className="text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{s.label}</span>
                      <input type="range" min={0} max={100} value={s.val}
                        onChange={e => s.set(Number(e.target.value))}
                        className="slider-track flex-1" />
                      <span className="font-display text-white text-xs w-6 text-right">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-5">
                <h3 className="font-display text-white text-xs tracking-widest mb-4 flex items-center gap-2">
                  <Icon name="Monitor" size={14} className="text-blue-400" />ДИСПЛЕЙ
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Icon name="Sun" size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-20 shrink-0">Яркость</span>
                    <input type="range" min={20} max={100} value={brightness}
                      onChange={e => setBrightness(Number(e.target.value))}
                      className="slider-track flex-1" />
                    <span className="font-display text-white text-xs w-6 text-right">{brightness}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon name="Cpu" size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-20 shrink-0">Графика</span>
                    <div className="flex gap-1.5 flex-1">
                      {(["low","medium","high"] as const).map(q => (
                        <button key={q} onClick={() => setGraphicsQuality(q)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-display tracking-wide transition-all ${graphicsQuality === q ? "btn-primary" : "btn-ghost"}`}>
                          {q === "low" ? "НИЗ" : q === "medium" ? "СРД" : "ВЫС"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn-primary w-full py-3 rounded-xl font-display tracking-widest text-sm">
                СОХРАНИТЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
