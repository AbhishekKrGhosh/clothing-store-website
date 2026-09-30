import { useEffect, useRef, useState } from 'react';
import { Shirt } from 'lucide-react';
import { imgUrl } from '../lib/api';

const WIDTHS = [320, 480, 640, 800, 1000, 1200, 1600];

/**
 * Smooth, lazy-loaded image:
 *  – shows the tiny blurred placeholder (stored with every upload) instantly
 *  – loads a right-sized variant via srcset (server resizes on demand & caches)
 *  – fades in once decoded
 * The wrapper must be sized by className (e.g. "aspect-[4/5] w-full" or "h-full w-full").
 */
export default function Img({ image, alt = '', className = '', imgClassName = '', sizes = '(min-width: 1024px) 25vw, 50vw', eager = false, maxWidth = 1600, fit = 'cover' }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  const src = imgUrl(image);

  useEffect(() => {
    setLoaded(false);
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [src]);

  if (!src) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-surface-alt text-muted/40 ${className}`}>
        <Shirt className="h-1/4 w-1/4 max-h-12 max-w-12" strokeWidth={1} />
      </div>
    );
  }

  const isRemote = /^(data:|https?:)/.test(src) && !src.includes('/api/images/');
  const widths = WIDTHS.filter((w) => w <= maxWidth && (!image?.w || w <= image.w * 1.2));
  const srcSet = isRemote || !widths.length ? undefined : widths.map((w) => `${imgUrl(image, w)} ${w}w`).join(', ');

  return (
    <div className={`relative overflow-hidden bg-surface-alt ${className}`}>
      {image?.blur && (
        <img
          src={image.blur}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-xl transition-opacity duration-700 ${loaded ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      <img
        ref={ref}
        src={isRemote ? src : imgUrl(image, widths[widths.length - 1] || 800)}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt || image?.alt || ''}
        loading={eager ? 'eager' : 'lazy'}
        fetchpriority={eager ? 'high' : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full transition-[opacity,transform] duration-700 ease-out ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  );
}
