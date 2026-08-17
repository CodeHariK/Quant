import { JSX } from 'solid-js';
import { Text } from './Text';

export type ChipColor = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'accent';

export interface ChipProps {
  label: string | JSX.Element;
  color?: ChipColor;
  onRemove?: (e: MouseEvent) => void;
  onClick?: (e: MouseEvent) => void;
  class?: string;
}

export function Chip(props: ChipProps) {
  const dotColorClasses: Record<ChipColor, string> = {
    success: 'bg-[#2fa84f]',
    error: 'bg-critical-red',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    accent: 'bg-emerald-500',
    neutral: 'bg-gray-400 dark:bg-gray-500',
  };

  const currentDotClass = () => dotColorClasses[props.color || 'neutral'];

  return (
    <div
      onClick={props.onClick}
      class={`px-2.5 py-0.5 uppercase border border-black dark:border-zinc-700 bg-transparent inline-flex items-center gap-1.5 transition-colors font-mono ${props.onClick ? 'cursor-pointer' : ''
        } ${props.class || ''}`}
    >
      <span class={`w-2 h-2 rounded-full inline-block ${currentDotClass()}`} />
      <Text variant='body'>{props.label}</Text>
      {props.onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            props.onRemove?.(e);
          }}
          class="material-symbols-outlined text-[13px] opacity-60 hover:opacity-100 hover:text-critical-red cursor-pointer ml-0.5"
          title="Remove"
        >
          close
        </span>
      )}
    </div>
  );
}
