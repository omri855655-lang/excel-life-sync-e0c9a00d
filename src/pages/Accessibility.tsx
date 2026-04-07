import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const Accessibility = () => {
  const navigate = useNavigate();
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const features = [
    t('a11yFeatureKeyboard'),
    t('a11yFeatureRtl'),
    t('a11yFeatureHeadings'),
    t('a11yFeatureAria'),
    t('a11yFeatureContrast'),
    t('a11yFeatureSkip'),
    t('a11yFeatureTheme'),
    t('a11yFeatureForms'),
  ];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1 mb-4">
          <BackIcon className="h-4 w-4" />{t('back')}
        </Button>
        <h1 className="text-3xl font-bold">{t('accessibilityStatement')}</h1>
        <p className="text-sm text-muted-foreground">{t('lastUpdated')}: {new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : lang === 'ru' ? 'ru-RU' : lang === 'es' ? 'es-ES' : 'en-US')}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('a11yCommitment')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('a11yCommitmentText')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('a11yWhatWeDid')}</h2>
          <ul className="list-disc list-inside text-sm leading-relaxed text-muted-foreground space-y-1">
            {features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('a11yLimitations')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('a11yLimitationsText')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t('a11yContact')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('a11yContactText')}</p>
        </section>
      </div>
    </div>
  );
};

export default Accessibility;
