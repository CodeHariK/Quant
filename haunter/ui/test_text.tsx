import type { JSX } from 'solid-js';

export interface TextProps extends JSX.HTMLAttributes<any> {
  as?: 'h1' | 'span';
}

export function Text(props: TextProps) {
  if (props.as === 'h1') return <h1 {...props}>h1</h1>;
  return <span {...props}>span</span>;
}
