import type { JSX } from '@solidjs/web';

// --- Input Component ---
export type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  containerClass?: string;
  error?: string;
};

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
export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

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
      class={`bg-primary text-on-primary ${sizeClass()} font-bold border border-transparent hover:opacity-80 disabled:opacity-50 uppercase cursor-pointer transition-opacity ${props.class || ''
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
      class={`bg-transparent border border-outline text-on-surface ${sizeClass()} font-bold hover:bg-surface-dim disabled:opacity-50 uppercase cursor-pointer transition-colors ${props.class || ''
        }`}
    >
      {props.loading ? 'LOADING...' : props.children}
    </button>
  );
}
