import type { JSX } from '@solidjs/web';
import type { ComponentProps  } from 'solid-js';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'body-sm'
  | 'label'
  | 'code'
  | 'muted';

export type TextStatus =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'accent';

export interface TextProps extends ComponentProps<'span'> {
  variant?: TextVariant;
  status?: TextStatus;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'label';
  class?: string;
  children: JSX.Element;
}

export function Text(props: TextProps) {
  const getVariantClasses = (variant?: TextVariant) => {
    switch (variant) {
      case 'h1':
        return 'text-3xl md:text-4xl font-bold uppercase tracking-tight';
      case 'h2':
        return 'text-xl md:text-2xl font-bold uppercase tracking-wide';
      case 'h3':
        return 'text-lg font-bold uppercase';
      case 'body':
        return 'text-sm leading-relaxed font-mono';
      case 'body-sm':
        return 'text-xs leading-relaxed font-mono';
      case 'label':
        return 'font-label-caps text-label-caps uppercase font-bold tracking-wider opacity-80';
      case 'code':
        return 'font-mono text-xs';
      case 'muted':
        return 'text-xs text-gray-500 dark:text-gray-400 font-mono';
      default:
        return 'text-sm font-mono';
    }
  };

  const getStatusClasses = (status?: TextStatus) => {
    switch (status) {
      case 'success':
        return 'text-terminal-green font-bold';
      case 'error':
        return 'text-critical-red font-bold';
      case 'warning':
        return 'text-orange-500 font-bold';
      case 'info':
        return 'text-blue-500 font-bold';
      case 'accent':
        return 'text-blue-600 dark:text-blue-400 font-bold';
      default:
        return '';
    }
  };

  const tag = props.as || (props.variant === 'h1' ? 'h1' : props.variant === 'h2' ? 'h2' : props.variant === 'h3' ? 'h3' : 'span');
  const className = `${getVariantClasses(props.variant)} ${getStatusClasses(props.status)} ${props.class || ''}`.trim();

  if (tag === 'h1') return <h1 {...props} class={className}>{props.children}</h1>;
  if (tag === 'h2') return <h2 {...props} class={className}>{props.children}</h2>;
  if (tag === 'h3') return <h3 {...props} class={className}>{props.children}</h3>;
  if (tag === 'h4') return <h4 {...props} class={className}>{props.children}</h4>;
  if (tag === 'p') return <p {...props} class={className}>{props.children}</p>;
  if (tag === 'label') return <label {...props} class={className}>{props.children}</label>;
  if (tag === 'div') return <div {...props} class={className}>{props.children}</div>;

  return <span {...props} class={className}>{props.children}</span>;
}
