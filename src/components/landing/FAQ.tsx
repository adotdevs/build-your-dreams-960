import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const { t } = useTranslation('landing');

  const faqs = [
    {
      question: t('faq.q1', 'How long does the KYC verification take?'),
      answer: t('faq.a1', 'Our KYC process typically takes less than 5 minutes. Most verifications are completed instantly, though some may require up to 24 hours for manual review.'),
    },
    {
      question: t('faq.q2', 'What cryptocurrencies do you support?'),
      answer: t('faq.a2', 'We support over 20 major cryptocurrencies including Bitcoin, Ethereum, USDT, BNB, Solana, and many more. We regularly add new assets based on user demand.'),
    },
    {
      question: t('faq.q3', 'How secure is my crypto on your platform?'),
      answer: t('faq.a3', 'We use bank-level 256-bit SSL encryption, cold storage for the majority of assets, and multi-signature technology. Your funds are protected by industry-leading security measures.'),
    },
    {
      question: t('faq.q4', 'What are the fees for using Coinly?'),
      answer: t('faq.a4', 'We believe in transparency. There are no hidden fees. All transaction fees are clearly displayed before you confirm any operation. Account management is free.'),
    },
    {
      question: t('faq.q5', 'Can I access my account from anywhere?'),
      answer: t('faq.a5', 'Yes! Coinly is accessible 24/7 from any device. Our platform is fully responsive and works on desktop, tablet, and mobile browsers.'),
    },
  ];

  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t('faq.title', 'Frequently Asked Questions')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('faq.subtitle', 'Find answers to common questions about Coinly.')}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border bg-background px-6 data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="text-start hover:no-underline">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;