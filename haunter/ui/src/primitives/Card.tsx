import type { JSX } from '@solidjs/web';
import { ParentProps  } from 'solid-js';
import { Text } from './Text';

export interface CardProps extends ParentProps {
  title?: string;
  subtitle?: string;
  titleClass?: string;
  headerAction?: JSX.Element;
  containerClass?: string;
  headerClass?: string;
  bodyClass?: string;
}

export function Card(props: CardProps) {
  return (
    <div class={props.containerClass || "border border-primary bg-surface-container-lowest p-4 flex flex-col justify-between"}>
      {(props.title || props.headerAction) && (
        <div class={props.headerClass || "flex justify-between items-center mb-4 border-b border-primary pb-2"}>
          <div>
            {props.title && <Text variant="h3">{props.title}</Text>}
            {props.subtitle && <Text variant="h3">{props.subtitle}</Text>}
          </div>
          {props.headerAction}
        </div>
      )}
      <div class={props.bodyClass || "flex-1"}>
        {props.children}
      </div>
    </div>
  );
}

export interface PositionCardProps {
  side: 'LONG' | 'SHORT';
  symbol: string;
  model: string;
  entryTime: string;
  entryPrice: string;
  quantity: string;
  leverage: string;
  unrealizedPl: string;
  isPositive: boolean;
}

export function PositionCard(props: PositionCardProps) {
  return (
    <div class="border border-primary p-4 bg-surface flex flex-col">
      <div class="flex justify-between items-start border-b border-primary pb-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="bg-primary text-on-primary font-label-caps text-[9px] px-1 py-0.5">{props.side}</span>
          <span class="font-code-md text-code-md font-bold">{props.symbol}</span>
        </div>
        <div class="font-label-sm text-label-sm bg-surface-container-high px-2 py-1 border border-primary">{props.model}</div>
      </div>
      <div class="grid grid-cols-2 gap-y-2 font-code-md text-[11px] mb-4">
        <div class="text-muted-gray uppercase">Entry Time</div>
        <div class="text-right">{props.entryTime}</div>
        <div class="text-muted-gray uppercase">Entry Price</div>
        <div class="text-right">{props.entryPrice}</div>
        <div class="text-muted-gray uppercase">Quantity</div>
        <div class="text-right">{props.quantity}</div>
        <div class="text-muted-gray uppercase">Leverage</div>
        <div class="text-right">{props.leverage}</div>
      </div>
      <div class="mt-auto pt-3 border-t border-primary flex justify-between items-center">
        <span class="font-label-caps text-[10px] text-muted-gray">UNREALIZED P&amp;L</span>
        <span class={`font-code-md text-code-md font-bold ${props.isPositive ? 'text-terminal-green' : 'text-critical-red'}`}>
          {props.unrealizedPl}
        </span>
      </div>
    </div>
  );
}
