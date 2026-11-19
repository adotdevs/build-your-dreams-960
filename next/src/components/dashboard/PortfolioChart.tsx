import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PortfolioChartProps {
  totalValue: number;
  change24h?: number;
}

// Generate mock historical data
const generateChartData = (days: number, trend: 'up' | 'down' | 'stable') => {
  const data: { date: string; value: number; fullDate: string }[] = [];
  let baseValue = 10000;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some randomness with overall trend
    const randomFactor = (Math.random() - 0.5) * 500;
    const trendFactor = trend === 'up' ? (days - i) * 50 : 
                        trend === 'down' ? -(days - i) * 30 : 0;
    
    baseValue = Math.max(5000, baseValue + randomFactor + trendFactor / days);
    
    data.push({
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      value: Math.round(baseValue * 100) / 100,
      fullDate: date.toISOString()
    });
  }
  
  return data;
};

const timeRanges = [
  { label: '24H', days: 1 },
  { label: '7J', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1A', days: 365 },
];

const PortfolioChart = ({ totalValue, change24h = 2.5 }: PortfolioChartProps) => {
  const [selectedRange, setSelectedRange] = useState('7J');
  const days = timeRanges.find(r => r.label === selectedRange)?.days || 7;
  const chartData = generateChartData(days, change24h >= 0 ? 'up' : 'down');
  
  const isPositive = change24h >= 0;
  const chartColor = isPositive ? '#10b981' : '#ef4444';
  
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
          <p className="text-sm font-semibold">{formatValue(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Valeur du portefeuille</p>
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
              {formatValue(totalValue)}
            </CardTitle>
            <div className={cn(
              "flex items-center gap-1 mt-1",
              isPositive ? "text-emerald-500" : "text-red-500"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="text-xs sm:text-sm font-medium">
                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
                ({selectedRange})
              </span>
            </div>
          </div>
          
          {/* Time range selector */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/50 rounded-lg p-0.5 sm:p-1 self-start">
            {timeRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => setSelectedRange(range.label)}
                className={cn(
                  "px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all",
                  selectedRange === range.label
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-2 px-1 sm:px-2">
        <div className="h-[160px] sm:h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                hide
                domain={['dataMin - 500', 'dataMax + 500']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;
