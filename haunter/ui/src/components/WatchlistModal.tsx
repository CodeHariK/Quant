import { createSignal, Accessor } from 'solid-js';
import { Modal } from './Modal';
import { Input, FilledButton } from './FormControls';
import { Chip } from './Chip';
import { Text } from './Text';

export interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: Accessor<string[]>;
  selectedSymbol: Accessor<string>;
  onSelectSymbol: (symbol: string) => void;
  onAddSymbol: (symbol: string) => Promise<void> | void;
  onRemoveSymbol: (symbol: string, e: Event) => Promise<void> | void;
}

export function WatchlistModal(props: WatchlistModalProps) {
  const [newInput, setNewInput] = createSignal('');
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const sym = newInput().trim().toUpperCase();
    if (!sym) return;

    try {
      setErrorMsg(null);
      await props.onAddSymbol(sym);
      setNewInput('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add ticker');
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="⭐ WATCHLIST MANAGEMENT (BOLTDB)"
    >
      <div class="space-y-4">
        <form onSubmit={handleSubmit} class="flex items-center gap-2">
          <Input
            type="text"
            placeholder="ADD TICKER (e.g. GLD, RELIANCE.NS)"
            value={newInput()}
            onInput={(e) => setNewInput(e.currentTarget.value)}
            class="w-full text-white border-zinc-700 placeholder-gray-500"
          />
          <FilledButton type="submit" class="bg-white text-black hover:bg-gray-200">
            + ADD
          </FilledButton>
        </form>

        {errorMsg() && (
          <Text status="error" class="text-xs block">{errorMsg()}</Text>
        )}

        <div class="border border-zinc-800 p-3 max-h-64 overflow-y-auto">
          <Text variant="label" class="block mb-2 text-[10px] text-gray-400">SAVED WATCHLIST TICKERS:</Text>
          <div class="flex flex-wrap items-center gap-2">
            {props.watchlist().map((sym) => (
              <Chip
                label={sym}
                color={props.selectedSymbol() === sym ? 'accent' : 'neutral'}
                onClick={() => {
                  props.onSelectSymbol(sym);
                  props.onClose();
                }}
                onRemove={(e) => props.onRemoveSymbol(sym, e)}
                class={
                  props.selectedSymbol() === sym
                    ? 'border-2 font-bold cursor-pointer text-white bg-blue-600 border-blue-400'
                    : 'cursor-pointer text-gray-200 bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                }
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
