import { JSX } from 'solid-js';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  cell?: (row: T) => JSX.Element;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  containerClass?: string;
  tableClass?: string;
  headerClass?: string;
  rowClass?: (row: T, index: number) => string;
}

export function Table<T extends Record<string, any>>(props: TableProps<T>) {
  return (
    <div class={props.containerClass || "w-full overflow-x-auto border border-black bg-white"}>
      <table class={props.tableClass || "w-full text-left border-collapse text-xs whitespace-nowrap"}>
        <thead class={props.headerClass || "uppercase bg-gray-100 border-b border-black font-bold"}>
          <tr>
            {props.columns.map((col) => (
              <th
                class={`${col.headerClassName || 'p-3 border-r border-black'} ${
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.data.map((row, idx) => (
            <tr class={props.rowClass ? props.rowClass(row, idx) : "border-b border-black hover:bg-gray-100"}>
              {props.columns.map((col) => (
                <td
                  class={`${col.className || 'p-3 border-r border-black'} ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.cell ? col.cell(row) : col.accessor ? String(row[col.accessor] ?? '') : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
