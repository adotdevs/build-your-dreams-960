import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Wallet } from "lucide-react";

interface CustomHolding {
  symbol: string;
  name: string;
  amount: number;
  price: number;
  color: string;
}

interface AssetAllocationProps {
  holdings?: { [key: string]: number };
  prices?: any[];
  customHoldings?: CustomHolding[];
}

const mockAllocation = [
  { name: 'Bitcoin', symbol: 'BTC', value: 45, color: '#f7931a', fiatValue: 0 },
  { name: 'Ethereum', symbol: 'ETH', value: 30, color: '#627eea', fiatValue: 0 },
  { name: 'Solana', symbol: 'SOL', value: 10, color: '#14f195', fiatValue: 0 },
  { name: 'BNB', symbol: 'BNB', value: 8, color: '#f3ba2f', fiatValue: 0 },
  { name: 'USDT', symbol: 'USDT', value: 5, color: '#26a17b', fiatValue: 0 },
  { name: 'Autres', symbol: 'OTHER', value: 2, color: '#8b5cf6', fiatValue: 0 },
];

const AssetAllocation = ({ customHoldings }: AssetAllocationProps) => {
  let data: { name: string; symbol: string; value: number; color: string; fiatValue: number }[];
  let totalValue: number;

  if (customHoldings && customHoldings.length > 0) {
    const enriched = customHoldings.map(h => ({ ...h, fiatValue: h.amount * h.price }));
    totalValue = enriched.reduce((s, h) => s + h.fiatValue, 0);
    data = enriched.map(h => ({
      name: h.name,
      symbol: h.symbol,
      color: h.color,
      fiatValue: h.fiatValue,
      value: totalValue > 0 ? (h.fiatValue / totalValue) * 100 : 0,
    }));
  } else {
    data = mockAllocation;
    totalValue = 15420.50;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.value.toFixed(2)}% du portefeuille</p>
          <p className="text-sm font-semibold">{formatCurrency(item.fiatValue || (totalValue * item.value / 100))}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Répartition des actifs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Pie Chart */}
          <div className="h-[140px] w-[140px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium">{item.symbol}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetAllocation;
