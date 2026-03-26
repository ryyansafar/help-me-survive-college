'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';
import { useAppHaptics, type AppHapticFeedback } from '@/lib/hooks/useAppHaptics';

type HapticLinkProps = ComponentProps<typeof Link> & {
  disableHaptics?: boolean;
  feedback?: AppHapticFeedback;
};

export default function HapticLink({
  disableHaptics = false,
  feedback = 'selection',
  onClick,
  ...props
}: HapticLinkProps) {
  const haptics = useAppHaptics();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (!event.defaultPrevented && !disableHaptics) {
      haptics.fire(feedback);
    }
  };

  return <Link {...props} onClick={handleClick} />;
}
