// Default site settings & page content. Everything here is editable from the admin panel.
// Stored values are deep-merged over these defaults, so new keys always exist.

export const defaultSettings = {
  brand: {
    name: 'AARO',
    tagline: 'Clothing for a kinder tomorrow.',
    logo: null,
    logoHeight: 34,
    favicon: null,
  },
  theme: {
    primary: '#B4532A',
    primaryDark: '#96431F',
    secondary: '#2F3A2D',
    accent: '#C9A27E',
    background: '#F8F4EE',
    surface: '#FFFFFF',
    surfaceAlt: '#F1EAE0',
    text: '#2A2521',
    muted: '#7D7369',
    border: '#E8DFD3',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Jost',
    radius: 10,
  },
  announcement: {
    enabled: true,
    text: 'Free shipping on orders above ₹999  ·  7-day easy returns  ·  Plastic-free packaging',
    link: '/shop',
  },
  nav: [
    { label: 'Home', url: '/' },
    { label: 'Collections', url: '/shop' },
    { label: 'Men', url: '/shop?gender=Men' },
    { label: 'Women', url: '/shop?gender=Women' },
    { label: 'About', url: '/about' },
    { label: 'Journal', url: '/journal' },
  ],
  trustBadges: [
    { icon: 'Truck', title: 'Free Shipping', subtitle: 'above ₹999' },
    { icon: 'RotateCcw', title: '7-Day Returns', subtitle: 'No questions asked' },
    { icon: 'ShieldCheck', title: 'Secure Payments', subtitle: '100% safe & encrypted' },
  ],
  footer: {
    about: 'Timeless silhouettes in thoughtful, natural fabrics — designed in India, made responsibly.',
    columns: [
      {
        title: 'Shop',
        links: [
          { label: 'New Arrivals', url: '/shop?sort=new' },
          { label: 'Men', url: '/shop?gender=Men' },
          { label: 'Women', url: '/shop?gender=Women' },
          { label: 'All Collections', url: '/shop' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'Our Story', url: '/about' },
          { label: 'Journal', url: '/journal' },
          { label: 'Lookbook', url: '/lookbook' },
        ],
      },
      {
        title: 'Help',
        links: [
          { label: 'Track Order', url: '/track' },
          { label: 'My Account', url: '/account' },
          { label: 'Wishlist', url: '/wishlist' },
        ],
      },
    ],
    copyright: '© 2026 AARO. All rights reserved.',
    bottomText: 'Made with care. For a better tomorrow.',
  },
  contact: {
    email: 'hello@aaro.in',
    phone: '+91 98765 43210',
    address: 'Jaipur, Rajasthan, India',
  },
  social: { instagram: 'https://instagram.com', facebook: '', twitter: '', youtube: '', pinterest: 'https://pinterest.com' },
  commerce: {
    currency: '₹',
    freeShippingThreshold: 999,
    shippingFee: 79,
    taxPercent: 0,
    codEnabled: true,
    returnDays: 7,
    lowStockThreshold: 5,
    autoApproveReviews: false,
  },
  sizeGuide: {
    title: 'Size Guide',
    note: 'Measurements are in inches. For a relaxed fit, size up.',
    headers: ['Size', 'Chest', 'Length', 'Shoulder'],
    rows: [
      ['S', '38', '28', '17'],
      ['M', '40', '29', '18'],
      ['L', '42', '30', '19'],
      ['XL', '44', '31', '20'],
    ],
  },
  seo: {
    title: 'AARO — Everyday Clothing for a Kinder Tomorrow',
    description: 'Timeless silhouettes. Thoughtful fabrics. A more conscious way to dress.',
  },
  labels: {
    addToBag: 'Add to Bag',
    addedToBag: 'Added to bag',
    buyNow: 'Buy Now',
    inStock: 'In Stock',
    lowStock: 'Only a few left',
    outOfStock: 'Out of Stock',
    color: 'Color',
    size: 'Size',
    sizeGuide: 'Size Guide',
    quantity: 'Quantity',
    youMightAlsoLike: 'You might also like',
    reviews: 'reviews',
    writeReview: 'Write a review',
    description: 'Description',
    fabricCare: 'Fabric & Care',
    cartTitle: 'Your Cart',
    items: 'items',
    continueShopping: 'Continue Shopping',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    discount: 'Discount',
    tax: 'Tax',
    total: 'Total',
    free: 'Free',
    proceedToCheckout: 'Proceed to Checkout',
    haveCoupon: 'Have a coupon code?',
    applyCoupon: 'Apply',
    emptyCartTitle: 'Your cart is empty',
    emptyCartText: 'Looks like you haven’t added anything yet.',
    checkoutTitle: 'Checkout',
    placeOrder: 'Place Order',
    cod: 'Cash on Delivery',
    orderSuccessTitle: 'Thank you for your order',
    orderSuccessText: 'We’ve received your order and will send you updates as it makes its way to you.',
    wishlistTitle: 'Your Wishlist',
    wishlistEmpty: 'Nothing saved yet. Tap the heart on anything you love.',
    searchPlaceholder: 'Search shirts, kurtas, linen…',
    all: 'All',
    filters: 'Filters',
    sortBy: 'Sort by',
    noProducts: 'No products match your filters.',
    viewAll: 'View All',
    newsletterSuccess: 'Thank you for subscribing!',
    freeShippingProgress: 'You’re {amount} away from free shipping',
    freeShippingUnlocked: 'You’ve unlocked free shipping',
  },
};

export const defaultContent = {
  home: {
    sections: [
      { key: 'hero', enabled: true },
      { key: 'categories', enabled: true },
      { key: 'sustainability', enabled: true },
      { key: 'featured', enabled: true },
      { key: 'lookbook', enabled: true },
      { key: 'newsletter', enabled: true },
    ],
    hero: {
      title: 'Everyday Clothing for a Kinder Tomorrow',
      subtitle: 'Timeless silhouettes. Thoughtful fabrics.\nA more conscious way to dress.',
      primaryButton: { label: 'Shop New Arrivals', url: '/shop?sort=new' },
      secondaryButton: { label: 'Our Story', url: '/about' },
      badgeText: '',
      image: null,
      features: [
        { icon: 'Leaf', title: 'Sustainable Fabrics' },
        { icon: 'HeartHandshake', title: 'Ethically Made' },
        { icon: 'Package', title: 'Plastic-free Packaging' },
        { icon: 'MapPin', title: 'Designed in India' },
      ],
    },
    categories: { title: 'Shop by Category', subtitle: '', linkLabel: 'View All', linkUrl: '/shop', limit: 6 },
    sustainability: {
      title: 'Naturally Better',
      text: 'We use natural fabrics, responsible processes and ethical manufacturing to create clothing that feels good — for you and the planet.',
      button: { label: 'Our Sustainability', url: '/about' },
      image: null,
      features: [
        { icon: 'Sprout', title: 'Organic Cotton' },
        { icon: 'Wheat', title: 'Linen & Hemp' },
        { icon: 'Droplets', title: 'Low Water Dyes' },
        { icon: 'Factory', title: 'Ethical Factories' },
      ],
    },
    featured: {
      title: 'Featured Products',
      subtitle: '',
      linkLabel: 'View All',
      linkUrl: '/shop?featured=true',
      source: 'featured', // featured | new | bestseller | manual
      productIds: [],
      limit: 4,
    },
    lookbook: { title: 'Lookbook', subtitle: 'Moments in AARO', linkLabel: 'View Lookbook', linkUrl: '/lookbook', limit: 4 },
    newsletter: {
      title: 'Be a Part of a More Conscious Wardrobe',
      text: 'Get early access to new collections, stories and exclusive offers.',
      placeholder: 'Enter your email',
      buttonLabel: 'Subscribe',
      image: null,
      showTrustBadges: true,
    },
  },
  lookbook: {
    title: 'Lookbook',
    subtitle: 'Moments in AARO — slow mornings, sunlit courtyards and clothes that move with you.',
    items: [],
  },
  collections: {
    title: 'Our Collections',
    subtitle: 'Thoughtfully designed for everyday living.',
    image: null,
  },
  about: {
    title: 'Our Story',
    subtitle: 'Clothing for a kinder tomorrow.',
    image: null,
    intro:
      'AARO began with a simple belief: the clothes we wear every day should be kind — to our skin, to the people who make them and to the planet we share. We design timeless silhouettes in natural fabrics, made in small batches by partners we know by name.',
    blocks: [
      {
        title: 'Thoughtful fabrics',
        text: 'Organic cotton, linen and hemp — fibres that breathe, soften with every wash and return gently to the earth.',
        image: null,
      },
      {
        title: 'Made by people we know',
        text: 'Every piece is cut and stitched in ethical workshops across India, where fair wages and safe conditions are the standard, not the exception.',
        image: null,
      },
    ],
    values: [
      { icon: 'Leaf', title: 'Sustainable Fabrics', text: 'Natural, low-impact fibres only.' },
      { icon: 'HeartHandshake', title: 'Ethically Made', text: 'Fair wages, safe workshops.' },
      { icon: 'Package', title: 'Plastic-free Packaging', text: 'Compostable mailers & paper tags.' },
      { icon: 'MapPin', title: 'Designed in India', text: 'Rooted in craft, made for everyday.' },
    ],
  },
  journal: { title: 'Journal', subtitle: 'Stories on craft, fabric and slower living.' },
};

export function deepMerge(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    if (override && typeof override === 'object' && !Array.isArray(override)) {
      for (const k of Object.keys(override)) {
        out[k] = k in base ? deepMerge(base[k], override[k]) : override[k];
      }
    }
    return out;
  }
  return override === undefined ? base : override;
}
