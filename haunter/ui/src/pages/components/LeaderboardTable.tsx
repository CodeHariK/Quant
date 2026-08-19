import { Table, Column } from '../../primitives/Table';
import { Text } from '../../primitives/Text';

export interface LeaderboardRow {
  rank: number;
  name: string;
  val: string;
  ret: string;
  pnl: string;
  fees: string;
  win: string;
  bigWin: string;
  bigLoss: string;
  sharpe: string;
  trades: string;
  isPos: boolean;
}

export const defaultLeaderboardData: LeaderboardRow[] = [
  { rank: 1, name: '⚪ GROK-4.20 - 3: SITUATIONAL AWARENESS', val: '$13,459', ret: '+34.59%', pnl: '$3,459', fees: '$730.31', win: '31.6%', bigWin: '$3,084', bigLoss: '-$2,066', sharpe: '0.019', trades: '158', isPos: true },
  { rank: 2, name: '🟢 GPT-5.1 - 4: MAX LEVERAGE', val: '$10,888', ret: '+8.88%', pnl: '$888.25', fees: '$1,574', win: '34.1%', bigWin: '$1,616', bigLoss: '-$552.36', sharpe: '0.009', trades: '537', isPos: true },
  { rank: 3, name: '🔵 DEEPSEEK-CHAT-V3.1 - 2: MONK MODE', val: '$10,730', ret: '+7.3%', pnl: '$729.63', fees: '$1,923', win: '33%', bigWin: '$4,435', bigLoss: '-$897.01', sharpe: '0.000', trades: '667', isPos: true },
  { rank: 4, name: '⚪ GROK-4.20 - 2: MONK MODE', val: '$10,366', ret: '+3.66%', pnl: '$366.37', fees: '$298.05', win: '35%', bigWin: '$467.35', bigLoss: '-$493.02', sharpe: '0.016', trades: '117', isPos: true },
  { rank: 5, name: '⚪ GROK-4.20 - 4: MAX LEVERAGE', val: '$10,193', ret: '+1.93%', pnl: '$192.97', fees: '$292.75', win: '40.6%', bigWin: '$380.10', bigLoss: '-$632.59', sharpe: '0.004', trades: '143', isPos: true },
  { rank: 6, name: '⚪ GROK-4.20 - 1: NEW BASELINE', val: '$10,048', ret: '+0.48%', pnl: '$47.58', fees: '$966.08', win: '38.3%', bigWin: '$1,849', bigLoss: '-$619.29', sharpe: '-0.010', trades: '358', isPos: true },
  { rank: 7, name: '🟣 QWEN3-MAX - 2: MONK MODE', val: '$9,321', ret: '-6.79%', pnl: '-$678.72', fees: '$581.57', win: '30.3%', bigWin: '$378.28', bigLoss: '-$129.52', sharpe: '-0.038', trades: '861', isPos: false },
  { rank: 8, name: '⚫ KIMI-K2-THINKING - 2: MONK MODE', val: '$8,955', ret: '-10.45%', pnl: '-$1,045', fees: '$1,830', win: '31.5%', bigWin: '$1,006', bigLoss: '-$478.50', sharpe: '-0.029', trades: '505', isPos: false },
  { rank: 9, name: '🔷 GEMINI-3-PRO - 2: MONK MODE', val: '$8,906', ret: '-10.94%', pnl: '-$1,094', fees: '$1,067', win: '31.6%', bigWin: '$542.95', bigLoss: '-$382.32', sharpe: '-0.018', trades: '528', isPos: false },
  { rank: 10, name: '🟢 GPT-5.1 - 2: MONK MODE', val: '$8,748', ret: '-12.52%', pnl: '-$1,252', fees: '$529.47', win: '34.2%', bigWin: '$458.45', bigLoss: '-$386.20', sharpe: '-0.063', trades: '409', isPos: false },
];

export interface LeaderboardTableProps {
  data?: LeaderboardRow[];
  limit?: number;
}

export function LeaderboardTable(props: LeaderboardTableProps) {
  const data = () => {
    const list = props.data || defaultLeaderboardData;
    return props.limit ? list.slice(0, props.limit) : list;
  };

  const columns: Column<LeaderboardRow>[] = [
    { header: 'RANK', accessor: 'rank', align: 'center', className: 'p-3 border-r border-black font-bold w-16 text-center' },
    {
      header: 'MODEL',
      cell: (row) => <Text variant="code" class="font-bold">{row.name}</Text>,
      className: 'p-3 border-r border-black min-w-[250px]',
    },
    { header: 'ACCT VALUE ↓', accessor: 'val', className: 'p-3 border-r border-black' },
    {
      header: 'RETURN %',
      cell: (row) => <Text status={row.isPos ? 'success' : 'error'}>{row.ret}</Text>,
      className: 'p-3 border-r border-black',
    },
    {
      header: 'TOTAL P&L',
      cell: (row) => <Text status={row.isPos ? 'success' : 'error'}>{row.pnl}</Text>,
      className: 'p-3 border-r border-black',
    },
    { header: 'FEES', accessor: 'fees', className: 'p-3 border-r border-black' },
    { header: 'WIN RATE', accessor: 'win', className: 'p-3 border-r border-black' },
    {
      header: 'Big Win',
      cell: (row) => <Text status="success">{row.bigWin}</Text>,
    },
    {
      header: 'Big Loss',
      cell: (row) => <Text status="error">{row.bigLoss}</Text>,
      className: 'p-3 border-r border-black',
    },
    { header: 'SHARPE', accessor: 'sharpe', className: 'p-3 border-r border-black' },
    { header: 'TRADES', accessor: 'trades', className: 'p-3' },
  ];

  return (
    <Table
      columns={columns}
      data={data()}
      rowClass={(row) => `border-b border-black hover:bg-gray-100 ${!row.isPos ? 'bg-red-50/40 dark:bg-red-950/30' : ''}`}
    />
  );
}
