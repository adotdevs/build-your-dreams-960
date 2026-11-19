import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const { t } = useTranslation('landing');

  const testimonials = [
    {
      name: "Marc D.",
      role: t('testimonials.role1', 'Crypto Investor'),
      content: t('testimonials.content1', 'The best platform I\'ve used for managing my crypto portfolio. The KYC process was incredibly fast and the interface is intuitive.'),
      rating: 5,
      avatar: "MD",
    },
    {
      name: "Sophie L.",
      role: t('testimonials.role2', 'Day Trader'),
      content: t('testimonials.content2', 'Real-time price tracking and secure wallet management. Everything I need in one place. Highly recommend!'),
      rating: 5,
      avatar: "SL",
    },
    {
      name: "Thomas K.",
      role: t('testimonials.role3', 'Business Owner'),
      content: t('testimonials.content3', 'Professional platform with bank-level security. The customer support is excellent and always responsive.'),
      rating: 5,
      avatar: "TK",
    },
  ];

  return (
    <section className="gradient-section-warm py-20 md:py-32 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute -right-32 top-1/3 h-72 w-72 rounded-full orb-amber blur-3xl" />
      <div className="absolute -left-32 bottom-1/3 h-64 w-64 rounded-full orb-violet blur-3xl" />
      
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-success/10 to-emerald-400/10 px-4 py-2 text-sm font-medium text-success border border-success/20">
            <Star className="h-4 w-4 fill-current" />
            <span>{t('testimonials.badge', 'Trusted by thousands')}</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t('testimonials.title', 'What Our Users Say')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('testimonials.subtitle', 'Join thousands of satisfied users who trust Coinly for their crypto management.')}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative rounded-2xl border bg-background/80 backdrop-blur-sm p-6 transition-all hover:shadow-xl hover:border-warning/30 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-warning/20" />
              
              {/* Rating */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              
              <p className="mb-6 text-muted-foreground">"{testimonial.content}"</p>
              
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary via-violet-500 to-violet-600 text-sm font-bold text-primary-foreground shadow-lg shadow-violet-500/30">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;