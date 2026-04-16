import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SpendingTrendChartProps {
  trendData: { name: string; amount: number }[];
}

export default function SpendingTrendChart({ trendData }: SpendingTrendChartProps) {
  return (
    <div className="h-[220px] sm:h-[250px] lg:h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
          />
          <RechartsTooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={32}>
            {trendData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === trendData.length - 1 ? '#3b82f6' : '#94a3b8'}
                fillOpacity={index === trendData.length - 1 ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
