import { JSX, Show, createEffect, onCleanup } from 'solid-js';
import { Card } from './Card';
import { Text } from './Text';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  containerClass?: string;
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

        {/* Brutalist Dialog Box using Card */}
        <div class="relative w-full max-w-xl z-10">
          <Card
            containerClass={props.containerClass || "bg-white dark:bg-zinc-900 text-black dark:text-white border-2 border-black dark:border-zinc-700 p-6 shadow-2xl flex flex-col justify-between"}
            headerAction={
              <button
                onClick={props.onClose}
                class="w-7 h-7 flex items-center justify-center border border-black dark:border-zinc-700 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-mono font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            }
            title={props.title}
            titleClass="text-sm uppercase tracking-wider font-bold"
            headerClass="flex items-center justify-between border-b border-black dark:border-zinc-700 pb-3 mb-4"
          >
            <div class="text-xs space-y-4">
              {props.children}
            </div>

            <div class="mt-6 flex justify-end">
              <button
                onClick={props.onClose}
                class="font-mono font-bold px-4 py-2 text-xs uppercase border border-black dark:border-white hover:opacity-80 transition-opacity cursor-pointer"
              >
                CLOSE ✕
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Show>
  );
}
