import { JSX, Show, createEffect, onCleanup } from 'solid-js';
import { Text } from './Text';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
}

export function Modal(props: ModalProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      props.onClose();
    }
  };

  createEffect(
    () => props.isOpen,
    (open) => {
      if (open) {
        window.addEventListener('keydown', handleKeyDown);
      } else {
        window.removeEventListener('keydown', handleKeyDown);
      }
    }
  );

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <div
          onClick={props.onClose}
          class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Brutalist Dialog Box */}
        <div class="relative bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 w-full max-w-xl p-6 shadow-2xl z-10">
          <div class="flex items-center justify-between border-b border-black dark:border-zinc-700 pb-3 mb-4">
            <Text variant="h2" class="text-sm uppercase tracking-wider font-bold">
              {props.title}
            </Text>
            <button
              onClick={props.onClose}
              class="w-7 h-7 flex items-center justify-center border border-black dark:border-zinc-700 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-mono font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          <div class="text-xs space-y-4">
            {props.children}
          </div>

          <div class="mt-6 flex justify-end">
            <button
              onClick={props.onClose}
              class="bg-black text-white dark:bg-white dark:text-black font-mono font-bold px-4 py-2 text-xs uppercase border border-black hover:opacity-80 transition-opacity"
            >
              CLOSE ✕
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
