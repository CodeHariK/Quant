import { Accessor } from 'solid-js';
import { Text } from '../../../primitives/Text';
import type { FullValuationReport } from '../../../types/events';

export interface TickerRawInspectorProps {
  fullReport: Accessor<FullValuationReport | null>;
  selectedSymbol: Accessor<string>;
}

export function TickerRawInspector(props: TickerRawInspectorProps) {
  return (
    <> {/* Raw Complete JSON Payload Inspector */}
      {props.fullReport() && (
        <section class="border  p-4 mb-8 overflow-hidden">
          <div class="font-bold text-xs uppercase mb-2 border-b border-outline-variant pb-2 flex justify-between items-center">
            <Text variant="label">FULL 5-YEAR UNTRUNCATED JSON PAYLOAD ({props.selectedSymbol()})</Text>
            <Text variant="muted">Fetched At: {props.fullReport()?.fetchedAt}</Text>
          </div>
          <pre class="bg-surface-container-low text-xs p-4 overflow-x-auto max-h-96 border border-outline-variant font-mono">
            {JSON.stringify(props.fullReport(), null, 2)}
          </pre>
        </section>
      )}
    </>
  );
}