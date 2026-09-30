import { useSite, usePageTitle } from '../context/SiteContext';
import Hero from './home/Hero';
import Categories from './home/Categories';
import Sustainability from './home/Sustainability';
import Featured from './home/Featured';
import LookbookStrip from './home/LookbookStrip';
import Newsletter from './home/Newsletter';

const MAP = { hero: Hero, categories: Categories, sustainability: Sustainability, featured: Featured, lookbook: LookbookStrip, newsletter: Newsletter };

export default function Home() {
  const { content } = useSite();
  usePageTitle('');
  const home = content.home;
  return (
    <>
      {(home.sections || []).filter((s) => s.enabled && MAP[s.key]).map((s) => {
        const Cmp = MAP[s.key];
        return <Cmp key={s.key} data={home[s.key] || {}} />;
      })}
    </>
  );
}
