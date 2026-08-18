import type { JSX } from '@solidjs/web';
import type { ComponentProps  } from 'solid-js';

// --- Input Component ---
export interface InputProps extends ComponentProps<'input'> {
  label?: string;
  containerClass?: string;
  error?: string;
  class?: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  required?: boolean;
  onInput?: (e: InputEvent & { currentTarget: HTMLInputElement; target: HTMLInputElement }) => void;
}

export function Input(props: InputProps) {
  return (
    <div class={`flex flex-col ${props.containerClass || ''}`}>
      {props.label && (
        <label class="font-label-caps text-label-caps text-muted-gray uppercase mb-1 font-bold">
          {props.label}
        </label>
      )}
      <input
        {...props}
        class={`border border-black bg-white px-3 py-2 font-code-md text-code-md text-black placeholder:text-muted-gray focus:outline-none focus:ring-1 focus:ring-black transition-colors ${props.class || ''
          }`}
      />
      {props.error && <span class="font-code-md text-code-md text-critical-red mt-1">{props.error}</span>}
    </div>
  );
}

// --- FilledButton Component ---
export interface ButtonProps extends ComponentProps<'button'> {
  children: JSX.Element;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent) => void;
}

function getButtonSizeClasses(size?: 'sm' | 'md' | 'lg') {
  switch (size) {
    case 'lg':
      return 'px-8 py-4 text-sm';
    case 'sm':
      return 'px-3 py-1 text-xs';
    case 'md':
    default:
      return 'px-4 py-2 text-xs';
  }
}

export function FilledButton(props: ButtonProps) {
  const sizeClass = () => getButtonSizeClasses(props.size);
  return (
    <button
      {...props}
      disabled={props.disabled || props.loading}
      class={`bg-black text-white ${sizeClass()} font-bold border border-black hover:bg-gray-800 disabled:opacity-50 uppercase cursor-pointer transition-colors ${props.class || ''
        }`}
    >
      {props.loading ? 'LOADING...' : props.children}
    </button>
  );
}

// --- OutlineButton Component ---
export function OutlineButton(props: ButtonProps) {
  const sizeClass = () => getButtonSizeClasses(props.size);
  return (
    <button
      {...props}
      disabled={props.disabled || props.loading}
      class={`bg-transparent border border-black ${sizeClass()} font-bold hover:bg-gray-100 disabled:opacity-50 uppercase cursor-pointer transition-colors ${props.class || ''
        }`}
    >
      {props.loading ? 'LOADING...' : props.children}
    </button>
  );
}
