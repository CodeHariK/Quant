import type { JSX } from '@solidjs/web';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export interface BadgeProps {
  label: string | JSX.Element;
  variant?: BadgeVariant;
  class?: string;
}

export function Badge(props: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-600 border-green-500/30',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    error: 'bg-red-500/10 text-red-600 border-red-500/30',
    neutral: 'bg-outline-variant/30 text-muted border-outline-variant',
  };

  const currentClass = () => variantClasses[props.variant || 'neutral'];

  return (
    <span class={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${currentClass()} ${props.class || ''}`}>
      {props.label}
    </span>
  );
}
