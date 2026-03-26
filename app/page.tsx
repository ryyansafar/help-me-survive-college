import type { Metadata } from 'next';
import HapticLink from '@/components/ui/HapticLink';

export const metadata: Metadata = {
  title: 'help-me-survive-college — ESE, Attendance & CGPA Calculators',
  description:
    'Free college calculators for ESE grade planning, attendance tracking, and CGPA calculation. Know your minimum ESE marks, plan your bunks, and project your CGPA — no login needed.',
};

const tools = [
  {
    href: '/grade-calculator',
    accent: '#00ffff',
    glow: 'rgba(0, 255, 255, 0.12)',
    label: 'grade calculator',
    tagline: 'ESE target strategy',
    description:
      'Enter your current sessional marks and see the minimum ESE score needed for every grade — from S (10 GP) down to P (5.5 GP). Supports theory, integrated, lab, and mini project courses.',
    keywords: ['ese calculator', 'minimum marks', 'grade planning'],
  },
  {
    href: '/attendance-calculator',
    accent: '#ff00ff',
    glow: 'rgba(255, 0, 255, 0.12)',
    label: 'attendance calculator',
    tagline: 'bunk management',
    description:
      "Find out exactly how many classes you can safely skip. If you're in the red, get the exact number of consecutive classes needed to recover. Includes a 10-class projection grid.",
    keywords: ['75% attendance', 'bunk calculator', 'shortage recovery'],
  },
  {
    href: '/cgpa-calculator',
    accent: '#ffaa00',
    glow: 'rgba(255, 170, 0, 0.12)',
    label: 'cgpa calculator',
    tagline: 'cumulative gpa forecasting',
    description:
      'Calculate your CGPA by adding semester SGPAs or individual subjects with grade points and credits. Auto-fills previous semester data when switching modes.',
    keywords: ['cgpa calculator', 'semester gpa', 'grade point average'],
  },
];

export default function HomePage() {
  return (
    <main className="container">
      <div style={{ marginBottom: 40 }}>
        <div className="hub-intro">
          → pick a calculator below. no account, no ads, no nonsense.
        </div>

        <div className="tool-cards-grid">
          {tools.map((tool) => (
            <HapticLink
              key={tool.href}
              href={tool.href}
              className="tool-card"
              feedback="medium"
              style={{
                '--card-accent': tool.accent,
                '--card-glow': tool.glow,
              } as React.CSSProperties}
            >
              <div className="tool-card-header">
                <span className="tool-card-label">{tool.label}</span>
                <span className="tool-card-tagline">/ {tool.tagline}</span>
              </div>
              <p className="tool-card-desc">{tool.description}</p>
              <div className="kw-tags">
                {tool.keywords.map((kw) => (
                  <span key={kw} className="kw-tag">{kw}</span>
                ))}
              </div>
            </HapticLink>
          ))}
        </div>
      </div>
    </main>
  );
}
