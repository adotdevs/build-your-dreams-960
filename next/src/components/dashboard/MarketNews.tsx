import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsItem {
  id: string;
  titleKey: string;
  source: string;
  timeKey: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  categoryKey: string;
}

const newsItems: NewsItem[] = [
  { id: '1', titleKey: 'news.item1', source: 'Reuters', timeKey: 'news.timeAgo2h', sentiment: 'neutral', categoryKey: 'news.economy' },
  { id: '2', titleKey: 'news.item2', source: 'Bloomberg', timeKey: 'news.timeAgo4h', sentiment: 'positive', categoryKey: 'news.crypto' },
  { id: '3', titleKey: 'news.item3', source: 'CoinDesk', timeKey: 'news.timeAgo6h', sentiment: 'positive', categoryKey: 'news.crypto' },
  { id: '4', titleKey: 'news.item4', source: 'Financial Times', timeKey: 'news.timeAgo8h', sentiment: 'neutral', categoryKey: 'news.regulation' },
  { id: '5', titleKey: 'news.item5', source: 'The Block', timeKey: 'news.timeAgo12h', sentiment: 'positive', categoryKey: 'news.crypto' },
];

const SentimentIcon = ({ sentiment }: { sentiment: NewsItem['sentiment'] }) => {
  switch (sentiment) {
    case 'positive': return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
    case 'negative': return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
    default: return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

const MarketNews = () => {
  const { t } = useTranslation('dashboard');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
            {t('news.title')}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{t('news.updatedRealtime')}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-border">
          {newsItems.map((item) => (
            <div 
              key={item.id} 
              className="py-3 first:pt-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 rounded cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <SentimentIcon sentiment={item.sentiment} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {t(item.titleKey)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {t(item.categoryKey)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.source}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t(item.timeKey)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketNews;
