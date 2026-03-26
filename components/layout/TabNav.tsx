'use client';

import { usePathname } from 'next/navigation';
import HapticLink from '@/components/ui/HapticLink';

const TABS = [
  { href: '/grade-calculator',      label: 'grade calc' },
  { href: '/attendance-calculator', label: 'attendance calc' },
  { href: '/cgpa-calculator',       label: 'cgpa calc' },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="tabs-nav" aria-label="Calculators">
      <div className="tabs">
        {TABS.map((tab) => (
          <HapticLink
            key={tab.href}
            href={tab.href}
            className={`tab${pathname === tab.href ? ' active' : ''}`}
            disableHaptics={pathname === tab.href}
            feedback="selection"
            prefetch={true}
          >
            {tab.label}
          </HapticLink>
        ))}
      </div>
    </nav>
  );
}
