"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── DESIGN TOKENS ───
const T = {
  bg: "#FAFAF7",
  bgAlt: "#F2F0EB",
  surface: "#FFFFFF",
  surfaceHover: "#F7F6F3",
  border: "#E8E5DE",
  borderLight: "#F0EDE6",
  text: "#1A1A18",
  textSecondary: "#6B6860",
  textTertiary: "#9C9890",
  accent: "#2D5A3D",
  accentLight: "#3A7250",
  accentMuted: "rgba(45, 90, 61, 0.08)",
  accentGlow: "rgba(45, 90, 61, 0.15)",
  warm: "#8B6E4E",
  warmLight: "#A68B6B",
  warmMuted: "rgba(139, 110, 78, 0.08)",
  coral: "#C4604A",
  coralMuted: "rgba(196, 96, 74, 0.08)",
  navy: "#2C3A4A",
  navyMuted: "rgba(44, 58, 74, 0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
  shadowHover: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)",
  radius: "12px",
  radiusSm: "8px",
  font: "'DM Sans', sans-serif",
  fontDisplay: "'Bungee', cursive",
  fontMono: "'DM Mono', monospace",
};

// ─── FAKE DATA ───
const DEMO_QUESTIONS = [
  "Why is our team not effectively hitting their quota?",
  "What are customers saying about our mobile experience?",
  "How are we positioned against CompetitorX?",
];

const LAYER1_RESPONSES: Record<string, any> = {
  "Why is our team not effectively hitting their quota?": {
    summary: "Recent trends indicate the product is not competitively priced for the value buyers perceive.",
    bullets: [
      "Win rates dropped 18% in deals where pricing was the primary objection",
      "Competitors are entering deals 22% lower on average",
      "Sales cycle length has increased from 45 to 68 days",
    ],
    sentiment: -0.34,
    confidence: 0.87,
    sources: 142,
    timeframe: "Last 90 days",
    trendData: [
      { month: "Sep", value: 78 }, { month: "Oct", value: 72 }, { month: "Nov", value: 65 },
      { month: "Dec", value: 58 }, { month: "Jan", value: 52 }, { month: "Feb", value: 48 },
    ],
  },
  default: {
    summary: "Cerebro is synthesizing insights across your connected data sources.",
    bullets: [
      "Analyzing patterns across 2,847 customer interactions",
      "Cross-referencing with market intelligence data",
      "Correlating with internal performance metrics",
    ],
    sentiment: 0.12,
    confidence: 0.82,
    sources: 89,
    timeframe: "Last 30 days",
    trendData: [
      { month: "Sep", value: 62 }, { month: "Oct", value: 65 }, { month: "Nov", value: 58 },
      { month: "Dec", value: 71 }, { month: "Jan", value: 68 }, { month: "Feb", value: 74 },
    ],
  },
};

const LAYER2_NODES = [
  {
    id: "pricing", label: "Competitive Pricing Gap",
    detail: "Competitors have recently been cited as entering deals at 15-22% lower price points across 34 qualified opportunities.",
    color: T.coral, colorMuted: T.coralMuted, icon: "↓", strength: 0.89, mentions: 47,
  },
  {
    id: "value", label: "Value Articulation Gap",
    detail: "Core features were not properly tied to business outcomes by the sales team in 61% of lost deals.",
    color: T.accent, colorMuted: T.accentMuted, icon: "◇", strength: 0.74, mentions: 38,
  },
  {
    id: "qualification", label: "Poor Deal Qualification",
    detail: "28% of lost deals showed early disqualification signals that were not acted upon, extending average sales cycle by 23 days.",
    color: T.warm, colorMuted: T.warmMuted, icon: "○", strength: 0.68, mentions: 24,
  },
  {
    id: "timing", label: "Market Timing Misalignment",
    detail: "Budget cycles and procurement timelines were misread in 19% of enterprise deals this quarter.",
    color: T.navy, colorMuted: T.navyMuted, icon: "◈", strength: 0.52, mentions: 16,
  },
];

const LAYER3_DATA: Record<string, any> = {
  pricing: {
    title: "Competitive Pricing Intelligence",
    deepInsight: "LinkedIn activity from Q4 indicates CompetitorX launched an aggressive market penetration campaign. However, buyer sentiment analysis reveals their engagement is predominantly from marketing influencers rather than actual procurement decision-makers — suggesting purchased reach rather than organic demand. Their 15% price undercut appears unsustainable based on their publicly reported margins.",
    recommendation: "Hold pricing but restructure deal packaging: introduce a 'Quick Start' tier at 80% of current entry price with core features, allowing expansion selling. This neutralizes the pricing objection without devaluing the full platform.",
    recommendationImpact: "Projected to recover 40-60% of pricing-related losses within one quarter.",
    externalSources: [
      { source: "LinkedIn Sales Navigator", finding: "CompetitorX mentions up 340%, but 72% from non-buyer personas" },
      { source: "G2 Reviews", finding: "CompetitorX NPS dropped 12 points post-launch — reliability concerns emerging" },
      { source: "Glassdoor", finding: "CompetitorX hiring freeze in engineering suggests cash conservation" },
    ],
    internalSignals: [
      { source: "Gong Call Analysis", finding: "Pricing objection raised in minute 12 avg — before value prop fully delivered" },
      { source: "Salesforce Pipeline", finding: "Deals with ROI calculator attached close at 2.1x rate" },
      { source: "Customer Success", finding: "Existing customers report 340% ROI — story not reaching prospects" },
    ],
    chartData: [
      { name: "Us", current: 100 }, { name: "Quick Start", current: 80 }, { name: "Enterprise", current: 145 },
    ],
    historicalPricing: [
      { q: "Q1 '24", ours: 98, theirs: 95 }, { q: "Q2 '24", ours: 100, theirs: 92 },
      { q: "Q3 '24", ours: 100, theirs: 85 }, { q: "Q4 '24", ours: 100, theirs: 78 },
    ],
  },
  value: {
    title: "Value Articulation Analysis",
    deepInsight: "Call recordings reveal sales reps spend 68% of discovery calls on feature walkthroughs rather than business impact discussions. Top-performing reps (top 10%) spend the inverse ratio. The gap is not product knowledge — it's consultative selling methodology. Enablement materials focus on 'what it does' rather than 'what it means for the buyer.'",
    recommendation: "Deploy a 'Value-First' call framework with mandatory business impact discovery before any demo. Create 5 industry-specific ROI narratives with customer proof points.",
    recommendationImpact: "Top-performing rep methodology applied broadly projects a 31% win rate improvement.",
    externalSources: [
      { source: "Gartner", finding: "Buyers are 57% through purchase decision before engaging sales" },
      { source: "Industry Benchmark", finding: "Consultative sellers outperform product-led sellers 2.4x" },
    ],
    internalSignals: [
      { source: "Gong", finding: "Feature-first calls: 18% win rate. Value-first calls: 47% win rate" },
      { source: "Enablement", finding: "Last training update was 9 months ago — pre-product updates" },
      { source: "CRM Notes", finding: "Only 22% of opps have documented business case" },
    ],
    chartData: [
      { name: "Feature-led", current: 18 }, { name: "Value-led", current: 47 }, { name: "Top Reps", current: 62 },
    ],
    historicalPricing: [
      { q: "Q1 '24", ours: 42, theirs: 38 }, { q: "Q2 '24", ours: 38, theirs: 40 },
      { q: "Q3 '24", ours: 35, theirs: 41 }, { q: "Q4 '24", ours: 31, theirs: 43 },
    ],
  },
  qualification: {
    title: "Deal Qualification Deep Dive",
    deepInsight: "Analysis of 156 closed-lost deals reveals a consistent pattern: opportunities that eventually churned showed a 'red flag' signal — typically budget uncertainty or missing technical decision-maker — within the first two meetings. These signals were documented in CRM notes but not flagged by the existing lead scoring system. Average cost of pursuing a doomed deal: $14,200 in sales resources.",
    recommendation: "Implement a 'Day 14 Gate' — a mandatory qualification checkpoint at 14 days into the pipeline requiring confirmed budget authority and technical sponsor. Auto-flag deals missing these criteria for manager review.",
    recommendationImpact: "Projected to save 1,200 rep hours per quarter and improve pipeline accuracy by 35%.",
    externalSources: [
      { source: "Forrester", finding: "B2B companies waste 33% of sales resources on unqualified pipeline" },
      { source: "Industry Data", finding: "MEDDIC-adopting companies see 28% higher win rates" },
    ],
    internalSignals: [
      { source: "CRM Analysis", finding: "67% of lost deals had 'budget TBD' past day 30" },
      { source: "Manager Reviews", finding: "Deal reviews happening at day 45 avg — too late for course correction" },
      { source: "Rep Surveys", finding: "84% of reps say they 'knew early' a deal would lose but felt pressure to keep it alive" },
    ],
    chartData: [
      { name: "Good Fit", current: 52 }, { name: "Poor Fit (kept)", current: 8 }, { name: "Poor Fit (cut)", current: 0 },
    ],
    historicalPricing: [
      { q: "Q1 '24", ours: 72, theirs: 25 }, { q: "Q2 '24", ours: 68, theirs: 28 },
      { q: "Q3 '24", ours: 65, theirs: 31 }, { q: "Q4 '24", ours: 71, theirs: 28 },
    ],
  },
  timing: {
    title: "Market Timing Analysis",
    deepInsight: "Enterprise procurement cycles shifted significantly in H2 2024. Budget approvals now require an additional sign-off layer at 60% of target accounts, adding 15-20 days to close. Sales playbooks have not been updated to account for this shift. Reps are projecting close dates based on 2023 cycle assumptions.",
    recommendation: "Adjust pipeline stage definitions to reflect new procurement realities. Add 'procurement mapping' as a required field at Stage 3. Train reps on multi-threaded selling to accelerate internal champion building.",
    recommendationImpact: "More accurate forecasting and 15% reduction in slipped deals.",
    externalSources: [
      { source: "CFO Survey", finding: "78% of CFOs added procurement oversight in 2024" },
      { source: "Market Data", finding: "Average B2B SaaS deal cycle increased 21% industry-wide" },
    ],
    internalSignals: [
      { source: "Pipeline Data", finding: "Stage 3→4 conversion dropped from 64% to 48%" },
      { source: "Forecast Accuracy", finding: "Commit deals slipping at 2.3x the rate of 12 months ago" },
      { source: "Win/Loss", finding: "No-decision outcomes up 34% — not losing, just stalling" },
    ],
    chartData: [
      { name: "2023 Cycle", current: 45 }, { name: "2024 Actual", current: 68 }, { name: "Adjusted", current: 55 },
    ],
    historicalPricing: [
      { q: "Q1 '24", ours: 45, theirs: 42 }, { q: "Q2 '24", ours: 52, theirs: 48 },
      { q: "Q3 '24", ours: 61, theirs: 55 }, { q: "Q4 '24", ours: 68, theirs: 58 },
    ],
  },
};

const CONNECTED_SOURCES = [
  { name: "Salesforce", records: "12,847" },
  { name: "Gong", records: "3,291" },
  { name: "Gmail", records: "48,102" },
  { name: "Intercom", records: "8,456" },
  { name: "G2 Reviews", records: "847" },
  { name: "LinkedIn", records: "2,104" },
];

// ─── THREE.JS PARTICLE FIELD ───
function ParticleField({ intensity = 0.5 }: { intensity?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const matRef = useRef<THREE.PointsMaterial | null>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const palette = [
      [0.18, 0.35, 0.24], [0.55, 0.43, 0.31], [0.77, 0.38, 0.29],
      [0.17, 0.23, 0.29], [0.4, 0.38, 0.35],
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
      velocities[i * 3] = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.04, vertexColors: true, transparent: true,
      opacity: 0.6, sizeAttenuation: true, blending: THREE.AdditiveBlending,
    });
    matRef.current = mat;

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const lineMat = new THREE.LineBasicMaterial({ color: 0x2D5A3D, transparent: true, opacity: 0.06 });
    const lineGeo = new THREE.BufferGeometry();
    const linePos: number[] = [];
    for (let i = 0; i < 60; i++) {
      const a = Math.floor(Math.random() * count);
      const b = Math.floor(Math.random() * count);
      linePos.push(positions[a*3], positions[a*3+1], positions[a*3+2], positions[b*3], positions[b*3+1], positions[b*3+2]);
    }
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    const handleMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * -2;
    };
    container.addEventListener("mousemove", handleMouse);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i*3] += velocities[i*3]; pos[i*3+1] += velocities[i*3+1]; pos[i*3+2] += velocities[i*3+2];
        if (Math.abs(pos[i*3]) > 6) velocities[i*3] *= -1;
        if (Math.abs(pos[i*3+1]) > 4) velocities[i*3+1] *= -1;
        if (Math.abs(pos[i*3+2]) > 4) velocities[i*3+2] *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.02;
      camera.position.y += (mouseRef.current.y * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      particles.rotation.y += 0.0003;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = container.clientWidth; const nh = container.clientHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      container.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (matRef.current) matRef.current.opacity = 0.3 + intensity * 0.5;
  }, [intensity]);

  return <div ref={mountRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "auto" }} />;
}

// ─── COMPLEXITY SLIDER ───
function ComplexitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ["ELI5", "", "Standard", "", "Expert"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, letterSpacing: 1, textTransform: "uppercase" as const, minWidth: 28 }}>Simple</span>
      <div style={{ flex: 1, position: "relative", height: 32, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: T.border, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 0, width: `${(value / 4) * 100}%`, height: 3, background: T.accent, borderRadius: 2, transition: "width 0.2s" }} />
        <input type="range" min="0" max="4" value={value} onChange={(e) => onChange(parseInt(e.target.value))}
          style={{ position: "absolute", width: "100%", height: 32, opacity: 0, cursor: "pointer", zIndex: 2, margin: 0 }} />
        <div style={{
          position: "absolute", left: `calc(${(value / 4) * 100}% - 10px)`, width: 20, height: 20,
          background: T.surface, border: `2px solid ${T.accent}`, borderRadius: "50%",
          transition: "left 0.2s", boxShadow: T.shadow, pointerEvents: "none" as const,
        }} />
        {labels.map((l, i) => l ? (
          <div key={i} style={{
            position: "absolute", left: `${(i / 4) * 100}%`, top: 22, transform: "translateX(-50%)",
            fontFamily: T.fontMono, fontSize: 8, color: i === value ? T.accent : T.textTertiary,
            letterSpacing: 0.5, fontWeight: i === value ? 600 : 400, transition: "color 0.2s",
          }}>{l}</div>
        ) : null)}
      </div>
      <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, letterSpacing: 1, textTransform: "uppercase" as const, minWidth: 28, textAlign: "right" as const }}>Deep</span>
    </div>
  );
}

// ─── MIND MAP ───
function MindMap({ nodes, selectedNode, onSelectNode }: { nodes: typeof LAYER2_NODES; selectedNode: string | null; onSelectNode: (id: string) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
      <svg viewBox="-280 -260 560 520" width="100%" style={{ maxWidth: 520, maxHeight: 440 }}>
        <circle r={28} cx={0} cy={0} fill={T.accent} opacity={0.1} />
        <circle r={20} cx={0} cy={0} fill={T.surface} stroke={T.accent} strokeWidth={2} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={14} fill={T.accent} fontFamily={T.font}>?</text>
        <text textAnchor="middle" y={80} fontSize={10} fill={T.textTertiary} fontFamily={T.fontMono} letterSpacing={1}>SELECT A PATH</text>
        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * 160;
          const y = Math.sin(angle) * 160;
          const isSelected = selectedNode === node.id;
          return (
            <g key={node.id} transform={`translate(${x}, ${y})`} onClick={() => onSelectNode(node.id)} style={{ cursor: "pointer" }}>
              <line x1={0} y1={0} x2={-x} y2={-y} stroke={isSelected ? node.color : T.border} strokeWidth={isSelected ? 2 : 1} strokeDasharray={isSelected ? "none" : "4 4"} opacity={isSelected ? 0.8 : 0.4} />
              <circle r={42} fill="none" stroke={T.borderLight} strokeWidth={2} />
              <circle r={42} fill="none" stroke={node.color} strokeWidth={2.5}
                strokeDasharray={`${node.strength * 264} ${264 - node.strength * 264}`}
                strokeDashoffset={66} strokeLinecap="round" opacity={isSelected ? 1 : 0.5} />
              <circle r={36} fill={isSelected ? node.colorMuted : T.surface}
                stroke={isSelected ? node.color : T.border} strokeWidth={isSelected ? 2 : 1} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={18} fill={node.color} dy={-4}>{node.icon}</text>
              <text textAnchor="middle" dominantBaseline="central" fontSize={9} fill={T.textTertiary} dy={14} fontFamily={T.fontMono}>{node.mentions}</text>
              <text textAnchor="middle" dominantBaseline="central" fontSize={10.5}
                fill={isSelected ? T.text : T.textSecondary} fontWeight={isSelected ? 600 : 400}
                y={56} fontFamily={T.font}>
                {node.label.length > 22 ? node.label.slice(0, 20) + "…" : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── MAIN APP ───
export default function Cerebro() {
  const [currentView, setCurrentView] = useState("landing");
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedL2Node, setSelectedL2Node] = useState<string | null>(null);
  const [complexity, setComplexity] = useState(2);
  const [isTyping, setIsTyping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [particleIntensity, setParticleIntensity] = useState(0.3);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const l1Data = LAYER1_RESPONSES[activeQuery] || LAYER1_RESPONSES.default;
  const l3Data = selectedL2Node ? LAYER3_DATA[selectedL2Node] : null;

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return;
    setActiveQuery(query);
    setIsTyping(true);
    setShowResult(false);
    setCurrentView("layer1");
    setParticleIntensity(0.6);
    setSelectedL2Node(null);
    setTimeout(() => { setIsTyping(false); setShowResult(true); }, 1800);
  }, [query]);

  const handleL2Select = useCallback((nodeId: string) => {
    setSelectedL2Node(nodeId === selectedL2Node ? null : nodeId);
  }, [selectedL2Node]);

  const goToLayer3 = useCallback(() => {
    if (!selectedL2Node) return;
    setCurrentView("layer3");
    setParticleIntensity(0.9);
  }, [selectedL2Node]);

  const goBack = useCallback(() => {
    if (currentView === "layer3") { setCurrentView("layer1"); setParticleIntensity(0.6); }
    else if (currentView === "layer1") {
      setCurrentView("landing"); setParticleIntensity(0.3);
      setActiveQuery(""); setShowResult(false); setQuery(""); setSelectedL2Node(null);
    }
  }, [currentView]);

  const cssAnimations = `
    @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;

  // ─── LANDING ───
  const renderLanding = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", position: "relative", zIndex: 1, padding: "40px 20px" }}>
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <img src="/cerebro-logo.png" alt="Cerebro" style={{ width: 120, height: "auto", marginBottom: 24, opacity: 0.85 }} />
        <div style={{ fontFamily: T.fontDisplay, fontSize: 38, color: T.text, letterSpacing: 4, marginBottom: 8 }}>CEREBRO</div>
        <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, letterSpacing: 3, textTransform: "uppercase" as const }}>Voice of Everything</div>
      </div>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: "20px 24px" }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 12 }}>What do you want to know?</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <textarea ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Ask anything across your connected data..."
              rows={2}
              style={{ flex: 1, border: "none", outline: "none", resize: "none", fontFamily: T.font, fontSize: 16, color: T.text, background: "transparent", lineHeight: 1.5 }} />
            <button onClick={handleSubmit} disabled={!query.trim()}
              style={{ width: 40, height: 40, borderRadius: 10, background: query.trim() ? T.accent : T.bgAlt, border: "none", cursor: query.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }}>
              <span style={{ color: query.trim() ? "#fff" : T.textTertiary, fontSize: 18 }}>→</span>
            </button>
          </div>
          <div style={{ marginTop: 16, borderTop: `1px solid ${T.borderLight}`, paddingTop: 12 }}>
            <ComplexitySlider value={complexity} onChange={setComplexity} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {DEMO_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => setQuery(q)}
              style={{ padding: "8px 14px", borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, color: T.textSecondary, cursor: "pointer", transition: "all 0.2s" }}>
              {q}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 64, textAlign: "center" }}>
        <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textTertiary, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 12 }}>Connected Sources</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          {CONNECTED_SOURCES.map((s, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: T.accentMuted, border: `1px solid ${T.borderLight}`, fontFamily: T.fontMono, fontSize: 10, color: T.textSecondary }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent }} />
              {s.name} <span style={{ color: T.textTertiary }}>{s.records}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── LAYER 1 ───
  const renderLayer1 = () => (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <button onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, fontSize: 13, color: T.textSecondary }}>
          <span style={{ fontSize: 16 }}>←</span> New Question
        </button>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.text, letterSpacing: 2 }}>CEREBRO</div>
        <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, letterSpacing: 1 }}>{l1Data.sources} sources analyzed</div>
      </div>
      <div style={{ fontFamily: T.font, fontSize: 22, fontWeight: 500, color: T.text, marginBottom: 32, lineHeight: 1.4, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        &ldquo;{activeQuery}&rdquo;
      </div>
      {isTyping ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "40px 0" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, animation: "pulse 1.2s ease-in-out infinite" }} />
          <span style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary }}>Moving through your data...</span>
        </div>
      ) : showResult && (
        <div style={{ animation: "fadeUp 0.6s ease forwards" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.accent, marginBottom: 10 }}>Layer 1 · Signal</div>
              <div style={{ fontFamily: T.font, fontSize: 20, fontWeight: 500, color: T.text, lineHeight: 1.5, marginBottom: 20 }}>{l1Data.summary}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {l1Data.bullets.map((b: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, marginTop: 7, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary, lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                <div style={{ padding: "4px 10px", borderRadius: 6, background: T.bgAlt, fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary }}>
                  Confidence: {Math.round(l1Data.confidence * 100)}%
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 6, background: T.bgAlt, fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary }}>{l1Data.timeframe}</div>
                <div style={{ padding: "4px 10px", borderRadius: 6, background: l1Data.sentiment < 0 ? T.coralMuted : T.accentMuted, fontFamily: T.fontMono, fontSize: 10, color: l1Data.sentiment < 0 ? T.coral : T.accent }}>
                  Sentiment: {l1Data.sentiment > 0 ? "+" : ""}{l1Data.sentiment.toFixed(2)}
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.shadow }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.textTertiary, marginBottom: 16 }}>Trend · 6 Months</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={l1Data.trendData}>
                  <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.accent} stopOpacity={0.15} /><stop offset="95%" stopColor={T.accent} stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textTertiary, fontFamily: T.fontMono }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Area type="monotone" dataKey="value" stroke={T.accent} strokeWidth={2} fill="url(#trendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ textAlign: "center", position: "relative", margin: "24px 0 32px" }}>
            <div style={{ height: 1, background: T.border }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: T.bg, padding: "0 16px", fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.textTertiary }}>Layer 2 · Explore</div>
          </div>
          <MindMap nodes={LAYER2_NODES} selectedNode={selectedL2Node} onSelectNode={handleL2Select} />
          {selectedL2Node && (
            <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 24, marginTop: 20, boxShadow: T.shadow, animation: "fadeUp 0.4s ease forwards" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                    {LAYER2_NODES.find(n => n.id === selectedL2Node)?.label}
                  </div>
                  <div style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary, lineHeight: 1.6 }}>
                    {LAYER2_NODES.find(n => n.id === selectedL2Node)?.detail}
                  </div>
                </div>
                <button onClick={goToLayer3}
                  style={{ padding: "10px 20px", borderRadius: 8, background: T.accent, border: "none", cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: 500, color: "#fff", marginLeft: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
                  Go Deeper →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ─── LAYER 3 ───
  const renderLayer3 = () => {
    if (!l3Data) return null;
    const nodeInfo = LAYER2_NODES.find(n => n.id === selectedL2Node);
    const barColors = [T.accent, T.warm, T.coral];
    return (
      <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, fontSize: 13, color: T.textSecondary }}>
            <span style={{ fontSize: 16 }}>←</span> Back to Map
          </button>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.text, letterSpacing: 2 }}>CEREBRO</div>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.accent, padding: "4px 10px", borderRadius: 6, background: T.accentMuted }}>Layer 3 · Deep Dive</div>
        </div>
        <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textTertiary, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ cursor: "pointer" }} onClick={() => { setCurrentView("landing"); setParticleIntensity(0.3); }}>Question</span>
          <span>›</span>
          <span style={{ cursor: "pointer" }} onClick={goBack}>Explore</span>
          <span>›</span>
          <span style={{ color: nodeInfo?.color }}>{nodeInfo?.label}</span>
        </div>
        <div style={{ fontFamily: T.font, fontSize: 24, fontWeight: 600, color: T.text, marginBottom: 8 }}>{l3Data.title}</div>
        <div style={{ animation: "fadeUp 0.5s ease forwards" }}>
          <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 28, marginBottom: 24, marginTop: 24, boxShadow: T.shadow }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.textTertiary, marginBottom: 12 }}>Intelligence Summary</div>
            <div style={{ fontFamily: T.font, fontSize: 15, color: T.text, lineHeight: 1.7 }}>{l3Data.deepInsight}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.shadow }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.textTertiary, marginBottom: 16 }}>Comparison</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={l3Data.chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textTertiary, fontFamily: T.fontMono }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.font }} />
                  <Bar dataKey="current" radius={[4, 4, 0, 0] as any}>
                    {l3Data.chartData.map((_: any, i: number) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.shadow }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.textTertiary, marginBottom: 16 }}>Historical Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={l3Data.historicalPricing}>
                  <XAxis dataKey="q" tick={{ fontSize: 10, fill: T.textTertiary, fontFamily: T.fontMono }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.font }} />
                  <Line type="monotone" dataKey="ours" stroke={T.accent} strokeWidth={2} dot={{ r: 3, fill: T.accent }} />
                  <Line type="monotone" dataKey="theirs" stroke={T.coral} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: T.coral }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: T.fontMono, color: T.textTertiary }}>
                  <div style={{ width: 12, height: 2, background: T.accent, borderRadius: 1 }} /> Ours
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: T.fontMono, color: T.textTertiary }}>
                  <div style={{ width: 12, height: 2, background: T.coral, borderRadius: 1 }} /> Theirs
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.shadow }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.coral, marginBottom: 14 }}>External Intelligence</div>
              {l3Data.externalSources.map((s: any, i: number) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: i < l3Data.externalSources.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.warm, marginBottom: 4 }}>{s.source}</div>
                  <div style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>{s.finding}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.shadow }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.accent, marginBottom: 14 }}>Internal Signals</div>
              {l3Data.internalSignals.map((s: any, i: number) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: i < l3Data.internalSignals.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.accent, marginBottom: 4 }}>{s.source}</div>
                  <div style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>{s.finding}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.accentMuted, borderRadius: T.radius, border: `1px solid ${T.accent}22`, padding: 28, marginBottom: 24 }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: T.accent, marginBottom: 12 }}>Recommended Action</div>
            <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 500, color: T.text, lineHeight: 1.6, marginBottom: 12 }}>{l3Data.recommendation}</div>
            <div style={{ fontFamily: T.font, fontSize: 13, color: T.accent, padding: "8px 14px", background: "rgba(45, 90, 61, 0.08)", borderRadius: 8, display: "inline-block" }}>
              ⟶ {l3Data.recommendationImpact}
            </div>
          </div>
          <div style={{ maxWidth: 300, margin: "0 auto", padding: "16px 0" }}>
            <ComplexitySlider value={complexity} onChange={setComplexity} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", position: "relative", fontFamily: T.font, color: T.text }}>
      <style>{cssAnimations}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, opacity: currentView === "landing" ? 0.4 : currentView === "layer3" ? 0.15 : 0.25, transition: "opacity 1s ease" }}>
        <ParticleField intensity={particleIntensity} />
      </div>
      {currentView === "landing" && renderLanding()}
      {currentView === "layer1" && renderLayer1()}
      {currentView === "layer3" && renderLayer3()}
    </div>
  );
}
