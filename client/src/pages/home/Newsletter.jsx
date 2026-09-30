import Img from '../../components/Img';
import Reveal from '../../components/Reveal';
import NewsletterForm from '../../components/NewsletterForm';
import TrustBadges from '../../components/TrustBadges';

export default function Newsletter({ data }) {
  return (
    <section className="container section">
      <Reveal className="grid overflow-hidden rounded-[calc(var(--radius)*1.6)] bg-surface md:grid-cols-[1.25fr,1fr]">
        <div className="relative min-h-[240px] overflow-hidden">
          <Img image={data.image} className="absolute inset-0 h-full w-full" sizes="(min-width:768px) 55vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
          <div className="relative flex h-full flex-col justify-center p-6 md:p-10">
            <h3 className="max-w-md font-heading text-3xl leading-tight text-white md:text-[2.2rem]">{data.title}</h3>
            <p className="mt-2 max-w-md text-sm text-white/80">{data.text}</p>
            <div className="mt-5"><NewsletterForm dark placeholder={data.placeholder} buttonLabel={data.buttonLabel} /></div>
          </div>
        </div>
        {data.showTrustBadges && (
          <div className="flex items-center p-6 md:p-10">
            <TrustBadges className="w-full" />
          </div>
        )}
      </Reveal>
    </section>
  );
}
