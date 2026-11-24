'use client';
// Every plant is drawn in code. Five growth stages per species, plus weeds.
import { motion } from 'motion/react';

const CX = 70, GY = 176;
const STEM = '#2E8B57', LEAF = '#46B274', LEAF_D = '#2F9460';
const HEIGHT = [0, 24, 60, 94, 114];

const Soil = () => (
  <g>
    <ellipse cx={CX} cy={GY + 3} rx="36" ry="10" fill="#5A3D29" />
    <ellipse cx={CX} cy={GY + 1} rx="33" ry="8" fill="#72503A" />
    <ellipse cx={CX - 10} cy={GY - 1} rx="12" ry="3" fill="#8A6347" opacity=".6" />
  </g>
);

const Leaf = ({ y, side, s, fill = LEAF }: { y: number; side: number; s: number; fill?: string }) => (
  <path d="M0,0 C7,-13 24,-14 31,-3 C23,7 8,7 0,0Z" fill={fill} transform={`translate(${CX},${y}) scale(${side * s},${s}) rotate(-18)`} />
);

function Stem({ h, leaves, bend = 5 }: { h: number; leaves: number; bend?: number }) {
  const s = 0.42 + h / 260;
  return (
    <g>
      <path d={`M${CX},${GY} C${CX + bend},${GY - h * 0.4} ${CX - bend},${GY - h * 0.7} ${CX},${GY - h}`} stroke={STEM} strokeWidth={h > 50 ? 5 : 4} fill="none" strokeLinecap="round" />
      {Array.from({ length: leaves }, (_, i) => (
        <Leaf key={i} y={GY - h * (0.2 + (0.55 * i) / Math.max(1, leaves - 1 || 1))} side={i % 2 ? 1 : -1} s={s} fill={i % 2 ? LEAF : LEAF_D} />
      ))}
    </g>
  );
}

const Seed = () => (
  <g>
    <ellipse cx={CX} cy={GY - 5} rx="7" ry="5" fill="#C89B5A" transform={`rotate(-20 ${CX} ${GY - 5})`} />
    <path d={`M${CX - 3},${GY - 6} q3,-3 6,0`} stroke="#8A6332" strokeWidth="1.2" fill="none" />
    <g className="twinkle" stroke="#F6C453" strokeWidth="2" strokeLinecap="round">
      <path d={`M${CX - 16},${GY - 22} v-6 M${CX - 19},${GY - 25} h6`} />
      <path d={`M${CX + 15},${GY - 30} v-5 M${CX + 12.5},${GY - 32.5} h5`} />
    </g>
  </g>
);

const Sprout = () => (
  <g>
    <path d={`M${CX},${GY} C${CX + 2},${GY - 10} ${CX - 2},${GY - 16} ${CX},${GY - 24}`} stroke={STEM} strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d={`M${CX},${GY - 22} C${CX - 6},${GY - 38} ${CX - 22},${GY - 36} ${CX - 22},${GY - 26} C${CX - 14},${GY - 20} ${CX - 6},${GY - 20} ${CX},${GY - 22}Z`} fill={LEAF} />
    <path d={`M${CX},${GY - 22} C${CX + 6},${GY - 40} ${CX + 23},${GY - 38} ${CX + 23},${GY - 28} C${CX + 15},${GY - 21} ${CX + 6},${GY - 20} ${CX},${GY - 22}Z`} fill={LEAF_D} />
  </g>
);

const Sparkles = ({ top }: { top: number }) => (
  <g className="twinkle" fill="#FFE08A">
    {[[-34, 8, 3], [36, -4, 2.5], [-26, -26, 2], [30, 30, 2]].map(([dx, dy, r], i) => (
      <path key={i} style={{ animationDelay: `${i * 0.5}s` }} transform={`translate(${CX + dx},${top + dy}) scale(${r / 2.5})`} d="M0,-5 L1.3,-1.3 L5,0 L1.3,1.3 L0,5 L-1.3,1.3 L-5,0 L-1.3,-1.3Z" />
    ))}
  </g>
);

function Sunflower({ stage }: { stage: number }) {
  const h = HEIGHT[stage], top = GY - h, big = stage === 4;
  return (
    <g>
      <Stem h={h} leaves={[0, 0, 3, 4, 5][stage]} />
      {stage === 2 && <g><ellipse cx={CX} cy={top - 5} rx="7" ry="10" fill={LEAF_D} /><path d={`M${CX - 4},${top - 12} q4,-7 8,0`} fill="#F6B73C" /></g>}
      {stage >= 3 && (
        <g transform={`translate(${CX},${top - 4}) scale(${big ? 1.25 : 1})`}>
          {Array.from({ length: 14 }, (_, i) => <ellipse key={i} cx="0" cy="-15" rx="4.6" ry="10" fill={i % 2 ? '#F6B73C' : '#FFCC4D'} transform={`rotate(${(360 / 14) * i})`} />)}
          <circle r="9.5" fill="#6B3E1E" /><circle r="6" fill="#8A5428" /><circle cx="-2.5" cy="-2.5" r="2" fill="#A86B36" />
        </g>
      )}
      {big && <Sparkles top={top - 10} />}
    </g>
  );
}

const TulipHead = ({ x, y, s, c }: { x: number; y: number; s: number; c: string }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-12,2 C-15,-14 -8,-22 -5,-9 C-3,-24 3,-24 5,-9 C8,-22 15,-14 12,2 C9,11 -9,11 -12,2Z" fill={c} />
    <path d="M-5,-9 C-3,-2 -2,4 0,8 C2,4 3,-2 5,-9 C3,-20 -3,-20 -5,-9Z" fill="#fff" opacity=".22" />
  </g>
);
function Tulip({ stage }: { stage: number }) {
  const h = HEIGHT[stage], top = GY - h;
  return (
    <g>
      {stage === 4 && <g transform={`rotate(-16 ${CX} ${GY})`}><Stem h={h * 0.78} leaves={1} /><TulipHead x={CX} y={GY - h * 0.78 - 6} s={0.85} c="#F58FB0" /></g>}
      {stage === 4 && <g transform={`rotate(15 ${CX} ${GY})`}><Stem h={h * 0.7} leaves={1} /><TulipHead x={CX} y={GY - h * 0.7 - 6} s={0.8} c="#FF9F6B" /></g>}
      <Stem h={h} leaves={[0, 0, 2, 3, 3][stage]} bend={3} />
      {stage === 2 && <TulipHead x={CX} y={top - 3} s={0.5} c="#EC5B7B" />}
      {stage >= 3 && <TulipHead x={CX} y={top - 6} s={stage === 4 ? 1.15 : 1} c="#EC5B7B" />}
      {stage === 4 && <Sparkles top={top - 10} />}
    </g>
  );
}

const Spike = ({ h, n }: { h: number; n: number }) => (
  <g>
    <Stem h={h} leaves={2} bend={2} />
    {Array.from({ length: n }, (_, i) => (
      <circle key={i} cx={CX + (i % 2 ? 3.2 : -3.2)} cy={GY - h + i * 5 - 4} r={3 + i * 0.28} fill={i % 3 ? '#8E7CE0' : '#B3A4F2'} />
    ))}
    <circle cx={CX} cy={GY - h - 8} r="2.6" fill="#B3A4F2" />
  </g>
);
function Lavender({ stage }: { stage: number }) {
  const h = HEIGHT[stage];
  return (
    <g>
      {stage >= 3 && <g transform={`rotate(-17 ${CX} ${GY})`}><Spike h={h * 0.82} n={5} /></g>}
      {stage >= 3 && <g transform={`rotate(17 ${CX} ${GY})`}><Spike h={h * 0.86} n={5} /></g>}
      {stage === 4 && <g transform={`rotate(-33 ${CX} ${GY})`}><Spike h={h * 0.62} n={4} /></g>}
      {stage === 4 && <g transform={`rotate(32 ${CX} ${GY})`}><Spike h={h * 0.6} n={4} /></g>}
      {stage === 2 ? <g><Stem h={h} leaves={3} bend={2} /><circle cx={CX} cy={GY - h - 3} r="4" fill="#B3A4F2" /></g> : <Spike h={h} n={stage === 4 ? 8 : 6} />}
      {stage === 4 && <Sparkles top={GY - h} />}
    </g>
  );
}

function Fern({ stage }: { stage: number }) {
  const n = [0, 0, 5, 7, 9][stage], len = [0, 0, 52, 82, 104][stage];
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5, L = len * (1 - Math.abs(t) * 0.45);
        return (
          <g key={i} transform={`rotate(${t * 130} ${CX} ${GY})`}>
            <path d={`M${CX},${GY} C${CX + 11},${GY - L * 0.35} ${CX + 9},${GY - L * 0.8} ${CX},${GY - L} C${CX - 9},${GY - L * 0.8} ${CX - 11},${GY - L * 0.35} ${CX},${GY}Z`} fill={i % 2 ? '#3DA86C' : '#2F9460'} />
            <path d={`M${CX},${GY} V${GY - L * 0.92}`} stroke="#1F7448" strokeWidth="1.2" opacity=".55" />
          </g>
        );
      })}
      {stage === 4 && <g><path d={`M${CX},${GY} V${GY - 118}`} stroke={STEM} strokeWidth="3" strokeLinecap="round" /><path d={`M${CX},${GY - 118} a7,7 0 1 1 7,7`} stroke={STEM} strokeWidth="3" fill="none" strokeLinecap="round" /><Sparkles top={GY - 96} /></g>}
    </g>
  );
}

const Blossom = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-4.5" rx="3" ry="4.5" fill="#F58FB0" transform={`rotate(${a})`} />)}
    <circle r="2.4" fill="#FFD76A" />
  </g>
);
function Cactus({ stage }: { stage: number }) {
  const w = [0, 16, 24, 30, 34][stage], hh = [0, 20, 48, 76, 94][stage], y = GY - hh, G = '#3FA36B', GD = '#2F8757';
  return (
    <g>
      {stage >= 2 && <path d={`M${CX - w / 2 + 2},${GY - hh * 0.38} h-${w * 0.55} v-${hh * 0.3}`} stroke={GD} strokeWidth={w * 0.36} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {stage >= 3 && <path d={`M${CX + w / 2 - 2},${GY - hh * 0.52} h${w * 0.55} v-${hh * 0.26}`} stroke={GD} strokeWidth={w * 0.34} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <rect x={CX - w / 2} y={y} width={w} height={hh + 4} rx={w / 2} fill={G} />
      <path d={`M${CX - w * 0.18},${y + 8} V${GY - 4} M${CX + w * 0.18},${y + 8} V${GY - 4}`} stroke="#63BF89" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      {stage >= 2 && Array.from({ length: Math.floor(hh / 14) }, (_, i) => <path key={i} d={`M${CX - w / 2},${y + 14 + i * 14} l-3,-2 M${CX + w / 2},${y + 20 + i * 14} l3,-2`} stroke="#E9F5EC" strokeWidth="1.2" strokeLinecap="round" />)}
      {stage >= 3 && <Blossom x={CX} y={y - 1} s={stage === 4 ? 1.5 : 1.2} />}
      {stage === 4 && <><Blossom x={CX - w / 2 + 2 - w * 0.55} y={GY - hh * 0.68 - 6} /><Blossom x={CX + w / 2 - 2 + w * 0.55} y={GY - hh * 0.78 - 6} /><Sparkles top={y + 10} /></>}
    </g>
  );
}

function Tree({ stage }: { stage: number }) {
  const tw = [0, 0, 6, 9, 12][stage], th = [0, 0, 46, 66, 78][stage], top = GY - th;
  const canopy: [number, number, number, string][] =
    stage === 2 ? [[0, -12, 22, '#46B274']]
      : stage === 3 ? [[-18, -6, 22, '#2F9460'], [18, -8, 23, '#3DA86C'], [0, -26, 26, '#46B274']]
        : [[-26, 0, 24, '#2F9460'], [26, -2, 25, '#2F9460'], [-14, -24, 26, '#3DA86C'], [15, -26, 27, '#46B274'], [0, -42, 24, '#58C286']];
  return (
    <g>
      <path d={`M${CX - tw / 2},${GY} L${CX - tw / 3},${top} L${CX + tw / 3},${top} L${CX + tw / 2},${GY}Z`} fill="#8A5A3B" />
      {stage >= 3 && <path d={`M${CX},${top + 22} l-14,-16 M${CX},${top + 14} l13,-14`} stroke="#8A5A3B" strokeWidth="4" strokeLinecap="round" />}
      {canopy.map(([dx, dy, r, c], i) => <circle key={i} cx={CX + dx} cy={top + dy} r={r} fill={c} />)}
      {stage === 3 && [[-16, -10], [14, -16], [2, -34], [-4, -4]].map(([dx, dy], i) => <Blossom key={i} x={CX + dx} y={top + dy} s={0.75} />)}
      {stage === 4 && [[-28, -4], [24, -10], [-10, -30], [14, -36], [0, -8], [-18, 10], [30, 8]].map(([dx, dy], i) => (
        <g key={i}><circle cx={CX + dx} cy={top + dy} r="4.6" fill="#F2994A" /><circle cx={CX + dx - 1.4} cy={top + dy - 1.4} r="1.4" fill="#FFD9A8" /></g>
      ))}
      {stage === 4 && <Sparkles top={top - 30} />}
    </g>
  );
}

function Weed({ level }: { level: number }) {
  if (!level) {
    return (
      <g>
        <path d={`M${CX - 8},${GY - 2} l5,-9 l4,7 l5,-11 l3,13`} stroke="#9DB7A3" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
        <Sparkles top={GY - 46} />
      </g>
    );
  }
  const n = level + 2, len = 34 + level * 17;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1) - 0.5, L = len * (1 - Math.abs(t) * 0.35), dx = t * (50 + level * 12), ex = CX + dx, ey = GY - L;
        const mx = CX + dx * 0.25, my = GY - L * 0.75;
        return (
          <g key={i}>
            <path d={`M${CX},${GY} Q${mx},${my} ${ex},${ey}`} stroke={i % 2 ? '#4A3B52' : '#5C4868'} strokeWidth={3.4} fill="none" strokeLinecap="round" />
            {[0.3, 0.55, 0.8].map((k) => {
              const px = (1 - k) ** 2 * CX + 2 * (1 - k) * k * mx + k * k * ex, py = (1 - k) ** 2 * GY + 2 * (1 - k) * k * my + k * k * ey, sd = (i + Math.round(k * 10)) % 2 ? 1 : -1;
              return <path key={k} d={`M${px},${py} l${7 * sd},-5 l${-3 * sd},7Z`} fill="#7B6488" />;
            })}
            <path d={`M${ex},${ey} l-5,-8 l5,3 l1,-9 l3,9 l6,-4 l-4,9Z`} fill={i % 2 ? '#8A9B4A' : '#6F7F3C'} />
          </g>
        );
      })}
    </g>
  );
}

const SPECIES: Record<string, (p: { stage: number }) => React.ReactNode> = {
  sunflower: Sunflower, tulip: Tulip, lavender: Lavender, fern: Fern, cactus: Cactus, tree: Tree,
};

export type PlantLook = { kind: 'grow' | 'weed'; species: string; stage: number; level: number; wilted: boolean };

export function Plant({ look, width = 140, still = false, delay = 0 }: { look: PlantLook; width?: number; still?: boolean; delay?: number }) {
  const { kind, species, stage, level, wilted } = look;
  const Body = SPECIES[species] ?? Sunflower;
  const cactusLike = species === 'cactus' || species === 'tree';
  return (
    <svg viewBox="0 0 140 200" width={width} height={(width * 200) / 140} className="plant" aria-hidden>
      <Soil />
      <motion.g
        key={`${kind}-${species}-${stage}-${level}`}
        initial={still ? false : { scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 11, delay }}
        style={{ transformBox: 'view-box', transformOrigin: `${CX}px ${GY}px` }}
      >
        <g className={still ? '' : kind === 'weed' ? 'sway weedy' : wilted ? 'wilt' : cactusLike ? 'sway slow' : 'sway'} style={{ animationDelay: `${-delay * 7 - (stage + level) * 0.6}s` }}>
          {kind === 'weed' ? <Weed level={level} /> : stage === 0 ? <Seed /> : stage === 1 && species !== 'cactus' ? <Sprout /> : <Body stage={stage} />}
        </g>
      </motion.g>
    </svg>
  );
}
