import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, GraduationCap } from "lucide-react";

interface VideoTutorial {
  id: string;
  titleKey: string;
  duration: string;
  thumbnail: string;
  categoryKey: string;
  isNew?: boolean;
}

const tutorials: VideoTutorial[] = [
  { id: '1', titleKey: 'learning.tutorial1', duration: '12:34', thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop', categoryKey: 'learning.beginner', isNew: true },
  { id: '2', titleKey: 'learning.tutorial2', duration: '18:22', thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=225&fit=crop', categoryKey: 'learning.securityCat' },
  { id: '3', titleKey: 'learning.tutorial3', duration: '24:15', thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop', categoryKey: 'learning.taxation' },
  { id: '4', titleKey: 'learning.tutorial4', duration: '31:08', thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=225&fit=crop', categoryKey: 'learning.advanced' },
];

const LearningCenter = () => {
  const { t } = useTranslation('dashboard');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            {t('learning.title')}
          </CardTitle>
          <span className="text-xs text-primary cursor-pointer hover:underline">{t('learning.viewAll')}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="group cursor-pointer">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                <img src={tutorial.thumbnail} alt={t(tutorial.titleKey)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-4 w-4 text-foreground ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {tutorial.duration}
                </div>
                {tutorial.isNew && (
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                    {t('learning.new')}
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {t(tutorial.titleKey)}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                  {t(tutorial.categoryKey)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningCenter;
