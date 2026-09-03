import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from 'react';
import { ArrowDownRight, ArrowRight, ArrowRightLeft, ArrowUpRight, Box, Check, ChevronDown, ChevronLeft, Eye, Heart, Instagram, Menu, Move3d, Pause, Play, Plus, RotateCcw, Ruler, Search, ShoppingBag, Sparkles, Star, Truck, Upload, UserRound, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { createAccount, isCurrentUserAdmin, signIn, signInWithGoogle, signOutUser, subscribeToAuth } from './lib/auth';
import { deleteCatalogProduct, loadCatalog, saveCatalogProduct, type CatalogProduct } from './lib/admin';
import { firebaseEnabled } from './lib/firebase';
import { fetchCollection, removeCollectionItem, syncCollection } from './lib/persistence';
import { uploadRoomPhoto } from './lib/room-storage';
import { defaultSiteContent, loadSiteContent, saveSiteContent, type SiteContent } from './lib/site-content';
import { uploadSiteAsset } from './lib/site-storage';

type Product = {
  id: string;
  name: string;
  collection: string;
  price: number;
  material: string;
  image: string;
  color: string;
  description: string;
  dimensions: string;
  variants?: Array<{ name: string; color: string; priceDelta?: number }>;
  stock?: number;
  reviews?: number;
  rating?: number;
  shipping?: string;
  badge?: string;
};

const products: Product[] = [
  {
    id: 'arc-sofa',
    name: 'Arc Sofa',
    collection: 'Living room',
    price: 1280,
    material: 'Bottle green velvet',
    image: '/assets/hero-room.jpg',
    color: '#0c3b36',
    description: 'A generous, low-slung silhouette made for long Sundays and even longer conversations.',
    dimensions: '84 × 36 × 31 in',
  },
  {
    id: 'halo-chair',
    name: 'Halo Chair',
    collection: 'Lounge',
    price: 640,
    material: 'Bouclé / ash',
    image: '/assets/room-detail.jpg',
    color: '#d6c9b9',
    description: 'An enveloping reading chair with a soft curve that holds the room together.',
    dimensions: '30 × 31 × 29 in',
  },
  {
    id: 'linea-table',
    name: 'Linea Table',
    collection: 'Tables',
    price: 420,
    material: 'Smoked oak',
    image: '/assets/frame-35.jpg',
    color: '#6e4a38',
    description: 'Quiet geometry, softened edges. A small table with a surprisingly useful presence.',
    dimensions: '20 × 20 × 19 in',
  },
  {
    id: 'meridian-lamp',
    name: 'Meridian Lamp',
    collection: 'Lighting',
    price: 295,
    material: 'Brushed brass',
    image: '/assets/frame-65.jpg',
    color: '#bd8b58',
    description: 'A warm pool of light, tuned for the hour between work and everything else.',
    dimensions: '11 × 11 × 24 in',
  },
  {
    id: 'halo-lounge-chair',
    name: 'Halo Lounge',
    collection: 'Lounge',
    price: 780,
    material: 'Ivory boucle',
    image: '/assets/halo-lounge-chair.jpg',
    color: '#d6c9b9',
    description: 'A generous, cocooning chair that turns a quiet corner into a destination.',
    dimensions: '32 × 34 × 29 in',
  },
  {
    id: 'atelier-wallpaper',
    name: 'Atelier Paper',
    collection: 'Wallpapers',
    price: 180,
    material: 'Mineral grasscloth',
    image: '/assets/atelier-wallpaper.jpg',
    color: '#879b80',
    description: 'A softly patterned wallcovering that brings rhythm and warmth without asking for attention.',
    dimensions: 'Roll / 20.5 × 33 ft',
  },
  {
    id: 'orbital-coffee-table',
    name: 'Orbital Table',
    collection: 'Tables',
    price: 560,
    material: 'Honored travertine',
    image: '/assets/linea-coffee-table.jpg',
    color: '#bca98d',
    description: 'A low, rounded centrepiece with a stone surface that gets better with every mark.',
    dimensions: '42 × 26 × 14 in',
  },
  {
    id: 'sol-pendant',
    name: 'Sol Pendant',
    collection: 'Lighting',
    price: 340,
    material: 'Opal glass / brass',
    image: '/assets/sol-pendant.jpg',
    color: '#bd8b58',
    description: 'An easy, warm glow that makes the last hour of the day feel longer.',
    dimensions: '14 × 14 × 12 in',
  },
  {
    id: 'mesa-dining-table',
    name: 'Mesa Dining Table',
    collection: 'Dining tables',
    price: 1640,
    material: 'Smoked oak',
    image: '/assets/mesa-dining-table.jpg',
    color: '#6e4a38',
    description: 'A long-grained table designed for slow dinners, full glasses, and extra chairs.',
    dimensions: '84 × 38 × 30 in',
  },
  {
    id: 'alto-recliner',
    name: 'Alto Recliner',
    collection: 'Recliners',
    price: 1120,
    material: 'Cognac leather',
    image: '/assets/alto-recliner.jpg',
    color: '#a96143',
    description: 'A deep-set recliner with a patient silhouette and a very clear point of view.',
    dimensions: '31 × 35 × 41 in',
  },
  {
    id: 'linea-tv-unit',
    name: 'Linea Media',
    collection: 'TV units',
    price: 980,
    material: 'Walnut veneer',
    image: '/assets/linea-tv-unit.jpg',
    color: '#5b3929',
    description: 'A quiet, low profile for the things that make the room work behind the scenes.',
    dimensions: '72 × 18 × 22 in',
  },
  {
    id: 'nest-bed',
    name: 'Nest Bed',
    collection: 'Beds',
    price: 1880,
    material: 'Oatmeal linen',
    image: '/assets/nest-bed.jpg',
    color: '#c4b69f',
    description: 'Softly tailored and made for the first light, with room to stretch into the day.',
    dimensions: '80 × 84 × 44 in',
  },
  {
    id: 'cloud-mattress',
    name: 'Cloud Mattress',
    collection: 'Mattresses',
    price: 920,
    material: 'Natural latex / wool',
    image: '/assets/cloud-mattress.jpg',
    color: '#e9e2d4',
    description: 'A quietly supportive sleep layer with a breathable natural core and a soft, unhurried feel.',
    dimensions: 'Queen / 60 × 80 × 12 in',
  },
  {
    id: 'arc-shoe-rack',
    name: 'Arc Shoe Rack',
    collection: 'Shoe racks',
    price: 460,
    material: 'Walnut veneer',
    image: '/assets/arc-shoe-rack.jpg',
    color: '#6c4937',
    description: 'A considered landing place for everyday pairs, with curved doors that keep the entryway calm.',
    dimensions: '42 × 15 × 32 in',
  },
  {
    id: 'atelier-kitchen',
    name: 'Atelier Kitchen',
    collection: 'Kitchen cabinets',
    price: 2850,
    material: 'Painted ash / stone',
    image: '/assets/atelier-kitchen.jpg',
    color: '#879b80',
    description: 'A modular cabinet run with generous storage, tactile fronts, and room for the rituals of cooking.',
    dimensions: '96 × 25 × 36 in',
  },
  {
    id: 'column-wardrobe',
    name: 'Column Wardrobe',
    collection: 'Wardrobes',
    price: 1960,
    material: 'Natural walnut',
    image: '/assets/column-wardrobe.jpg',
    color: '#5b3929',
    description: 'A tall, softly curved wardrobe that gives the bedroom a little more order and a lot more presence.',
    dimensions: '38 × 24 × 84 in',
  },
];

const formatPrice = (value: number) => `$${value.toLocaleString('en-US')}`;

const productMeta = (product: Product) => ({
  variants: product.variants || [
    { name: product.material, color: product.color },
    { name: 'Warm clay', color: '#a96143', priceDelta: 40 },
    { name: 'Night ink', color: '#192436', priceDelta: 0 },
  ],
  stock: product.stock ?? 8,
  reviews: product.reviews ?? 24,
  rating: product.rating ?? 4.8,
  shipping: product.shipping ?? 'Ships in 2–4 weeks',
});

type CartLine = { product: Product; quantity: number };

const groupCartItems = (items: Product[]): CartLine[] => {
  const lines: CartLine[] = [];
  items.forEach((product) => {
    const existing = lines.find((line) => line.product.id === product.id);
    if (existing) existing.quantity += 1;
    else lines.push({ product, quantity: 1 });
  });
  return lines;
};

function ProductExperience({ product, meta, currentVariant, currentPrice, liked, onLike, onAdd, quantity, setQuantity, color, setColor, variantIndex, setVariantIndex, activeImage, setActiveImage, rotation, setRotation, thumbs }: {
  product: Product;
  meta: ReturnType<typeof productMeta>;
  currentVariant: ReturnType<typeof productMeta>['variants'][number];
  currentPrice: number;
  liked: boolean;
  onLike: () => void;
  onAdd: (product: Product) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  color: string;
  setColor: (value: string) => void;
  variantIndex: number;
  setVariantIndex: (value: number) => void;
  activeImage: string;
  setActiveImage: (value: string) => void;
  rotation: number;
  setRotation: (value: number | ((current: number) => number)) => void;
  thumbs: string[];
}) {
  const [postalCode, setPostalCode] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  useEffect(() => {
    const stored = readStored<string[]>('furnivision-recently-viewed', []);
    setRecentlyViewed(stored.filter((id) => id !== product.id).map((id) => products.find((item) => item.id === id)).filter((item): item is Product => Boolean(item)).slice(0, 4));
    window.localStorage.setItem('furnivision-recently-viewed', JSON.stringify([product.id, ...stored.filter((id) => id !== product.id)].slice(0, 6)));
  }, [product.id]);
  return (
    <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-28 md:px-10 md:pt-32">
      <div className="mx-auto max-w-[1440px]">
        <Link href="/furniture" className="inline-flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/60 hover:text-[#f3eee4]" data-testid="link-back-collection"><ChevronLeft size={14} /> Back to collection</Link>
        <div className="mt-8 grid gap-12 md:grid-cols-[1.1fr_.9fr] md:gap-20">
          <div className="grid gap-4 sm:grid-cols-[82px_1fr]">
            <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">{thumbs.map((thumb, index) => <button key={`${thumb}-${index}`} onClick={() => setActiveImage(thumb)} className={`overflow-hidden rounded-xl border-2 ${activeImage === thumb ? 'border-[#bd8250]' : 'border-transparent'}`} data-testid={`button-product-thumb-${index}`} aria-label={`View product image ${index + 1}`}><img src={thumb} alt="" className="h-16 w-16 object-cover sm:h-20 sm:w-20" /></button>)}</div>
            <div className="image-reveal perspective order-1 overflow-hidden rounded-[1.5rem] bg-[#26231f]" onPointerMove={(event) => { if (event.buttons) setRotation((current) => current + event.movementX * 0.4); }}>
              <img src={activeImage} alt={product.name} className="h-full min-h-[430px] w-full object-cover transition-transform duration-300 md:min-h-[650px]" style={{ transform: `perspective(1100px) rotateY(${rotation}deg) scale(${1 + Math.min(Math.abs(rotation), 24) / 160})` }} />
              <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-[#171512]/85 px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.13em]"><Move3d size={13} /> Drag to rotate</div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow">{product.collection} / FurniVision</p>
            <h1 className="mt-5 font-display text-8xl leading-[.78] tracking-[-.06em] md:text-[9.5rem]">{product.name}</h1>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[#f3eee4]/15 py-5"><span className="font-display text-4xl" data-testid="text-product-price">{formatPrice(currentPrice)}</span><span className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f3eee4]/55"><span className="h-1.5 w-1.5 rounded-full bg-[#879b80]" /> {meta.shipping}</span></div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[#f3eee4]/65"><span className="flex items-center gap-1 text-[#bd8250]"><Star size={14} fill="currentColor" /> {meta.rating}</span><span>{meta.reviews} considered reviews</span><span className="text-[#f3eee4]/30">/</span><span>{meta.stock} available</span></div>
            <div className="mt-6 rounded-[1.25rem] border border-[#f3eee4]/15 bg-[#0b0b0a]/55 p-4" data-testid="product-review-summary"><div className="flex items-center justify-between gap-4"><span className="text-xs uppercase tracking-[.14em]">Customer perspective</span><span className="flex items-center gap-1 text-[#bd8250]"><Star size={13} fill="currentColor" /> {meta.rating} / 5</span></div><p className="mt-2 text-xs leading-5 text-[#f3eee4]/60">{meta.reviews} considered reviews on comfort, finish, and how the piece settles into a room.</p></div>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#f3eee4]/70">{product.description}</p>
            <div className="mt-7 rounded-xl border border-[#f3eee4]/15 bg-[#26231f]/55 p-4"><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-[.14em]">Choose a finish</span><span className="font-mono-ui text-[10px] text-[#f3eee4]/55">{currentVariant.name}</span></div><div className="mt-3 flex flex-wrap gap-2">{meta.variants.map((variant, index) => <button key={variant.name} onClick={() => { setVariantIndex(index); setColor(variant.color); }} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${variantIndex === index ? 'border-[#f3eee4] bg-[#0b0b0a] text-[#f3eee4]' : 'border-[#f3eee4]/20'}`} aria-label={`Select ${variant.name} finish`} data-testid={`button-variant-${index}`}><span className="h-4 w-4 rounded-full border border-[#f3eee4]/50" style={{ backgroundColor: variant.color }} />{variant.name}{variant.priceDelta ? ` +${formatPrice(variant.priceDelta)}` : ''}</button>)}</div></div>
            <div className="mt-6 rounded-[1.25rem] border border-[#f3eee4]/15 bg-[#0b0b0a]/55 p-4" data-testid="delivery-estimator"><div className="flex items-center justify-between gap-4"><span className="text-xs uppercase tracking-[.14em]">Check white-glove delivery</span><Truck size={15} className="text-[#b99a63]" /></div><form onSubmit={(event) => { event.preventDefault(); setDeliveryMessage(postalCode.trim() ? 'White-glove delivery is available to your area — estimated in 4–6 weeks.' : 'Enter a postcode to check delivery.'); }} className="mt-3 flex gap-2"><input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} inputMode="numeric" placeholder="Postcode / ZIP" aria-label="Postcode or ZIP code" className="min-w-0 flex-1 rounded-full border border-[#f3eee4]/20 bg-transparent px-4 py-3 text-xs outline-none focus:border-[#b99a63]" data-testid="input-delivery-postcode" /><button type="submit" className="rounded-full bg-[#b99a63] px-4 py-3 text-[10px] uppercase tracking-[.14em] text-[#0b0b0a] transition-transform hover:scale-[1.03]" data-testid="button-check-delivery">Check</button></form>{deliveryMessage && <p className="mt-3 text-xs leading-5 text-[#f3eee4]/60" role="status">{deliveryMessage}</p>}</div>
            <div className="product-purchase-bar mt-8 flex gap-3"><div className="flex items-center rounded-full border border-[#f3eee4]/20"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-4" aria-label="Decrease quantity" data-testid="button-quantity-decrease"><ChevronLeft size={15} /></button><span className="w-6 text-center text-sm" data-testid="text-quantity">{quantity}</span><button onClick={() => setQuantity(Math.min(meta.stock, quantity + 1))} className="p-4" aria-label="Increase quantity" data-testid="button-quantity-increase"><Plus size={15} /></button></div><button onClick={() => { for (let index = 0; index < quantity; index += 1) onAdd({ ...product, price: currentPrice, material: currentVariant.name, color }); }} className="group flex flex-1 items-center justify-center gap-3 rounded-full bg-[#0b0b0a] text-xs uppercase tracking-[.16em] text-[#f3eee4] transition-transform hover:scale-[1.02]" data-testid="button-product-add-to-bag">Add to bag <ArrowUpRight size={16} /></button><button onClick={onLike} className={`flex h-12 w-12 items-center justify-center rounded-full border ${liked ? 'border-[#bd8250] bg-[#bd8250] text-[#f3eee4]' : 'border-[#f3eee4]/20'}`} aria-label={`${liked ? 'Remove' : 'Save'} ${product.name} ${liked ? 'from wishlist' : 'to wishlist'}`} data-testid="button-product-wishlist"><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button></div>
            <div className="mt-7 grid grid-cols-2 gap-4 text-xs text-[#f3eee4]/60"><span className="flex gap-2"><Ruler size={15} /> {product.dimensions}</span><span className="flex gap-2"><Truck size={15} /> White-glove delivery</span></div>
          </div>
        </div>
        <div className="mt-20 grid gap-8 border-t border-[#f3eee4]/15 pt-10 md:grid-cols-3"><div><p className="eyebrow">01 / Material</p><p className="mt-4 font-display text-3xl">Made to soften with time.</p></div><div><p className="eyebrow">02 / Detail</p><p className="mt-4 font-display text-3xl">The kind of quiet you notice.</p></div><div><p className="eyebrow">03 / In the room</p><p className="mt-4 font-display text-3xl">Give it a little space.</p></div></div>
        {recentlyViewed.length > 0 && <section className="mt-20 border-t border-[#f3eee4]/15 pt-10" data-testid="section-recently-viewed"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Your trail</p><h2 className="mt-3 font-display text-5xl tracking-[-.05em]">Recently viewed.</h2></div><Link href="/furniture" className="hidden text-xs uppercase tracking-[.14em] text-[#b99a63] sm:inline-flex">Browse all <ArrowUpRight size={14} className="ml-2" /></Link></div><div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{recentlyViewed.map((item) => <Link href={`/furniture/${item.id}`} key={item.id} className="group"><div className="image-reveal aspect-[.9] overflow-hidden rounded-xl bg-[#2a2823]"><img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div><p className="mt-3 font-display text-2xl">{item.name}</p><p className="mt-1 text-xs text-[#f3eee4]/55">{formatPrice(item.price)}</p></Link>)}</div></section>}
      </div>
    </main>
  );
}

const collectionPages = [
  { slug: 'living-room', label: 'Living room', description: 'Anchors for the everyday room.', image: '/assets/hero-room.jpg', accent: '#d8ddd3' },
  { slug: 'lounge', label: 'Lounge', description: 'Soft places to stay awhile.', image: '/assets/halo-lounge-chair.jpg', accent: '#e6d6c4' },
  { slug: 'wallpapers', label: 'Wallpapers', description: 'Walls with something to say.', image: '/assets/atelier-wallpaper.jpg', accent: '#c7d09a' },
  { slug: 'tables', label: 'Tables', description: 'Useful geometry, softened.', image: '/assets/linea-coffee-table.jpg', accent: '#d2c4b1' },
  { slug: 'lighting', label: 'Lighting', description: 'A warmer way to see it.', image: '/assets/sol-pendant.jpg', accent: '#e0c39d' },
  { slug: 'dining-tables', label: 'Dining tables', description: 'Make room for one more.', image: '/assets/mesa-dining-table.jpg', accent: '#d5c2a9' },
  { slug: 'recliners', label: 'Recliners', description: 'The best seat in the room.', image: '/assets/alto-recliner.jpg', accent: '#d2aa94' },
  { slug: 'tv-units', label: 'TV units', description: 'The calm behind the screen.', image: '/assets/linea-tv-unit.jpg', accent: '#c4b3a0' },
  { slug: 'beds', label: 'Beds', description: 'End the day softly.', image: '/assets/nest-bed.jpg', accent: '#d7d0c3' },
  { slug: 'mattresses', label: 'Mattresses', description: 'Better support for slower mornings.', image: '/assets/cloud-mattress.jpg', accent: '#e4ded2' },
  { slug: 'shoe-racks', label: 'Shoe racks', description: 'A calmer place to come home to.', image: '/assets/arc-shoe-rack.jpg', accent: '#d5bca7' },
  { slug: 'kitchen-cabinets', label: 'Kitchen cabinets', description: 'The architecture of everyday cooking.', image: '/assets/atelier-kitchen.jpg', accent: '#c3d09b' },
  { slug: 'wardrobes', label: 'Wardrobes', description: 'Make space for the life you wear.', image: '/assets/column-wardrobe.jpg', accent: '#c4b3a0' },
];

const bundles = [
  { slug: 'soft-landing', title: 'The soft landing', copy: 'A living room edit for long Sundays and slow conversations.', image: '/assets/hero-room.jpg', productIds: ['arc-sofa', 'halo-lounge-chair', 'meridian-lamp'] },
  { slug: 'dinner-for-eight', title: 'Dinner for eight', copy: 'A generous table setting that makes room for one more.', image: '/assets/mesa-dining-table.jpg', productIds: ['mesa-dining-table', 'sol-pendant', 'linea-table'] },
  { slug: 'the-quiet-room', title: 'The quiet room', copy: 'Soft linen, mineral walls, and a better way to end the day.', image: '/assets/nest-bed.jpg', productIds: ['nest-bed', 'atelier-wallpaper', 'sol-pendant'] },
];

const newArrivalIds = ['cloud-mattress', 'arc-shoe-rack', 'atelier-kitchen', 'column-wardrobe'];

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-0.5" data-testid="link-logo">
      <span className={`font-display text-2xl tracking-[-.04em] ${light ? 'text-[#f3eee4]' : 'text-[#f3eee4]'}`}>Furni</span>
      <span className={`font-display text-2xl italic tracking-[-.04em] ${light ? 'text-[#b99a63]' : 'text-[#bd8250]'}`}>Vision</span>
    </Link>
  );
}

function Header({ cartCount, onCart, onMenu, onAccount, userLabel, light = false }: { cartCount: number; onCart: () => void; onMenu: () => void; onAccount?: () => void; userLabel?: string; light?: boolean }) {
  const [query, setQuery] = useState('');
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocation(query.trim() ? `/furniture?search=${encodeURIComponent(query.trim())}` : '/furniture');
  };
  return (
    <header className={`absolute left-0 right-0 top-0 z-40 px-5 py-5 md:px-10 md:py-7 ${light ? 'text-[#f3eee4]' : 'text-[#f3eee4]'}`}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          <Link href="/furniture" className="nav-link" data-testid="link-nav-furniture">Furniture</Link>
          <div className="relative">
            <button type="button" onClick={() => setCollectionsOpen((open) => !open)} className="nav-link inline-flex items-center gap-1" aria-expanded={collectionsOpen} data-testid="button-nav-collections">Collections <ChevronDown size={12} /></button>
            {collectionsOpen && <div className="absolute left-1/2 top-8 z-50 grid w-[360px] -translate-x-1/2 grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-[#0b0b0a] p-5 text-[#f3eee4] shadow-2xl">
              {collectionPages.map((page) => <Link href={`/furniture/category/${page.slug}`} onClick={() => setCollectionsOpen(false)} key={page.slug} className="group flex items-center justify-between border-b border-[#f3eee4]/15 pb-2 text-xs transition-colors hover:text-[#b99a63]" data-testid={`link-header-${page.slug}`}>{page.label}<ArrowUpRight size={13} className="opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>)}
            </div>}
          </div>
          <Link href="/inspiration" className="nav-link" data-testid="link-nav-inspiration">Inspiration</Link>
          <Link href="/bundles" className="nav-link" data-testid="link-nav-bundles">Room edits</Link>
          <Link href="/design" className="nav-link" data-testid="link-nav-design">Visualize a room</Link>
        </nav>
        <div className="flex items-center gap-4">
          <form onSubmit={submitSearch} className="hidden items-center gap-2 border-b border-[#f3eee4]/30 pb-1 lg:flex">
            <Search size={15} strokeWidth={1.7} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" className={`w-36 bg-transparent text-xs outline-none ${light ? 'placeholder:text-[#f3eee4]/55' : 'placeholder:text-[#f3eee4]/55'}`} aria-label="Search furniture" data-testid="input-header-search" />
          </form>
          <button type="button" onClick={onCart} className="relative flex items-center gap-2 text-xs uppercase tracking-[.16em]" data-testid="button-open-cart">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span className="hidden sm:inline">Bag</span>
            {cartCount > 0 && <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b99a63] px-1 font-mono-ui text-[9px]">{cartCount}</span>}
          </button>
          <button type="button" onClick={onAccount || (() => setLocation('/account'))} className="hidden items-center gap-2 text-xs uppercase tracking-[.16em] lg:flex" data-testid="button-open-account" aria-label={userLabel ? `Open ${userLabel} account` : 'Open account'}><UserRound size={17} strokeWidth={1.5} /><span>{userLabel || 'Account'}</span></button>
          <button type="button" onClick={onMenu} className={`rounded-full border p-2 md:hidden ${light ? 'border-[#f3eee4]/30' : 'border-[#f3eee4]/20'}`} aria-label="Open menu" data-testid="button-open-menu"><Menu size={18} /></button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer className="bg-[#0b0b0a] px-5 pb-8 pt-16 text-[#f3eee4] md:px-10 md:pt-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-8 max-w-xs font-display text-3xl leading-[.95] text-[#f3eee4] md:text-4xl">Objects with a point of view.</p>
          </div>
          <div>
            <p className="footer-label">Explore</p>
            <div className="mt-5 grid gap-3 text-sm text-[#f3eee4]/70">
              <Link href="/furniture" className="hover:text-[#b99a63]" data-testid="link-footer-furniture">Furniture</Link>
              <Link href="/bundles" className="hover:text-[#b99a63]" data-testid="link-footer-bundles">Room edits</Link>
              <Link href="/wishlist" className="hover:text-[#b99a63]" data-testid="link-footer-wishlist">Wishlist</Link>
              <Link href="/saved-rooms" className="hover:text-[#b99a63]" data-testid="link-footer-saved-rooms">Saved rooms</Link>
              <Link href="/inspiration" className="hover:text-[#b99a63]" data-testid="link-footer-inspiration">Room stories</Link>
              <Link href="/design" className="hover:text-[#b99a63]" data-testid="link-footer-design">Visualize a room</Link>
            </div>
          </div>
          <div>
            <p className="footer-label">Visit</p>
            <p className="mt-5 max-w-[150px] text-sm leading-6 text-[#f3eee4]/70">18 Walker Street<br />New York, NY 10013<br /><span className="text-[#b99a63]">By appointment</span></p>
          </div>
          <div>
            <p className="footer-label">Keep close</p>
            <form className="mt-5 flex border-b border-[#f3eee4]/30 pb-2" onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}>
              <input required type="email" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#f3eee4]/45" placeholder={subscribed ? 'You are on the list' : 'Your email'} aria-label="Email address" data-testid="input-footer-email" />
              <button type="submit" aria-label={subscribed ? 'Subscribed' : 'Subscribe'} disabled={subscribed} data-testid="button-footer-subscribe"><ArrowUpRight size={18} /></button>
            </form>
            <div className="mt-5 flex gap-4 text-[#f3eee4]/65"><Instagram size={16} /><span className="text-xs">@furnivision</span></div>
          </div>
        </div>
        <div className="mt-20 flex flex-col justify-between gap-3 border-t border-[#f3eee4]/15 pt-5 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/45 md:flex-row"><span>© 2024 FurniVision Studio</span><span>Made for the lived-in life</span></div>
      </div>
    </footer>
  );
}

function BagDrawer({ open, onClose, items, onRemove, onIncrement = (id) => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'increment', id } })), onDecrement = (id) => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'decrement', id } })) }: { open: boolean; onClose: () => void; items: Product[]; onRemove: (id: string) => void; onIncrement?: (id: string) => void; onDecrement?: (id: string) => void }) {
  if (!open) return null;
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const lines = groupCartItems(items);
  return (
    <div className="fixed inset-0 z-[100]">
      <button className="absolute inset-0 cursor-default bg-[#0b0b0a]/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Close bag overlay" data-testid="button-close-bag-overlay" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#171512] p-6 shadow-2xl page-reveal md:p-8">
        <div className="flex items-center justify-between border-b border-[#f3eee4]/15 pb-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em]">Your bag / {items.length.toString().padStart(2, '0')}</p><button onClick={onClose} aria-label="Close bag" data-testid="button-close-bag"><X size={20} /></button></div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="mb-5 rounded-full border border-[#f3eee4]/15 p-5"><ShoppingBag size={26} strokeWidth={1} /></div><h2 className="font-display text-4xl">A little empty.</h2><p className="mt-3 max-w-[220px] text-sm text-[#f3eee4]/60">The right piece changes the whole room.</p><Link href="/furniture" onClick={onClose} className="mt-7 border-b border-[#bd8250] pb-1 text-xs uppercase tracking-[.16em]" data-testid="link-empty-bag-shop">Shop the collection</Link></div>
        ) : (
          <>
             <div className="flex-1 divide-y divide-[#192436]/10 overflow-auto py-4">{lines.map(({ product, quantity }) => <div className="flex gap-4 py-4" key={product.id}><img src={product.image} alt={product.name} className="h-20 w-20 rounded-xl object-cover" /><div className="flex flex-1 justify-between gap-3"><div><p className="font-display text-2xl">{product.name}</p><p className="mt-1 text-xs text-[#f3eee4]/55">{product.material}</p><div className="mt-4 flex items-center rounded-full border border-[#f3eee4]/20"><button onClick={() => onDecrement(product.id)} className="flex h-8 w-8 items-center justify-center" aria-label={`Decrease ${product.name} quantity`} data-testid={`button-bag-decrease-${product.id}`}><span aria-hidden="true">−</span></button><span className="w-7 text-center font-mono-ui text-[10px]" data-testid={`text-bag-quantity-${product.id}`}>{quantity}</span><button onClick={() => onIncrement(product.id)} className="flex h-8 w-8 items-center justify-center" aria-label={`Increase ${product.name} quantity`} data-testid={`button-bag-increase-${product.id}`}><Plus size={12} /></button></div></div><div className="text-right"><p className="text-sm">{formatPrice(product.price * quantity)}</p><button onClick={() => onRemove(product.id)} className="mt-4 text-[10px] uppercase tracking-[.14em] text-[#bd8250]" data-testid={`button-remove-${product.id}`}>Remove</button></div></div></div>)}</div>
             <div className="border-t border-[#f3eee4]/15 pt-5"><div className="flex justify-between font-display text-3xl"><span>Total</span><span>{formatPrice(total)}</span></div><p className="mt-2 text-xs text-[#f3eee4]/55">Complimentary delivery within the continental US.</p><Link href="/checkout" onClick={onClose} className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.16em] text-[#f3eee4] transition-transform hover:scale-[1.02]" data-testid="button-checkout">Continue to checkout <ArrowUpRight size={15} /></Link></div>
          </>
        )}
      </aside>
    </div>
  );
}

function CompareTray({ items, open, onToggle, onRemove }: { items: Product[]; open: boolean; onToggle: () => void; onRemove: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2">
      {open && <div className="mb-3 rounded-[1.25rem] bg-[#171512] p-5 shadow-2xl ring-1 ring-[#192436]/10 md:p-6"><div className="flex items-center justify-between border-b border-[#f3eee4]/15 pb-4"><p className="eyebrow">Compare pieces / {items.length}</p><button onClick={onToggle} aria-label="Close comparison"><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-3">{items.map((item) => <div className="relative" key={item.id}><button onClick={() => onRemove(item.id)} className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#171512]/90" aria-label={`Remove ${item.name} from comparison`}><X size={13} /></button><img src={item.image} alt="" className="aspect-[1.15] w-full rounded-xl object-cover" /><p className="mt-3 font-display text-2xl">{item.name}</p><div className="mt-2 grid gap-1 text-xs text-[#f3eee4]/60"><span>{formatPrice(item.price)}</span><span>{item.material}</span><span>{item.dimensions}</span></div></div>)}</div></div>}
      <button onClick={onToggle} className="mx-auto flex items-center gap-3 rounded-full bg-[#0b0b0a] px-5 py-3 text-xs uppercase tracking-[.14em] text-[#f3eee4] shadow-xl transition-transform hover:scale-[1.03]" data-testid="button-open-compare"><ArrowRightLeft size={15} /> Compare {items.length} {items.length === 1 ? 'piece' : 'pieces'} <ChevronDown size={14} className={open ? 'rotate-180' : ''} /></button>
    </div>
  );
}

function ProductCard({ product, liked, onLike, onAdd, compared = false, onCompare }: { product: Product; liked: boolean; onLike: () => void; onAdd: () => void; compared?: boolean; onCompare?: () => void }) {
  const meta = productMeta(product);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pointerActive, setPointerActive] = useState(false);
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: Number((-y * 5).toFixed(2)), y: Number((x * 5).toFixed(2)) });
    setPointerActive(true);
  };
  const resetPointer = () => {
    setPointerActive(false);
    setTilt({ x: 0, y: 0 });
  };
  return (
    <article className="tilt-card group relative perspective" onPointerMove={handlePointerMove} onPointerLeave={resetPointer} onPointerCancel={resetPointer} style={pointerActive ? { transform: `translate3d(0, -10px, 0) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` } : undefined} data-testid={`card-product-${product.id}`}>
      <Link href={`/furniture/${product.id}`} className="block" data-testid={`link-product-${product.id}`}>
        <div className="image-reveal relative aspect-[.88] overflow-hidden rounded-[1.3rem] bg-[#2a2823]">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0a]/35 via-transparent to-transparent opacity-60" />
          <span className="absolute left-4 top-4 rounded-full bg-[#171512]/85 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-[.15em]">{product.collection}</span>
           <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[#b99a63] px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.1em] opacity-0 transition-opacity group-hover:opacity-100"><Eye size={13} /> View piece</span>
        </div>
      </Link>
      <div className="card-depth flex items-start justify-between px-1 pt-4">
         <div><Link href={`/furniture/${product.id}`} className="font-display text-3xl tracking-[-.03em]" data-testid={`link-product-name-${product.id}`}>{product.name}</Link><p className="mt-1 text-xs text-[#f3eee4]/55">{product.material}</p><div className="mt-2 flex items-center gap-2 text-[10px] text-[#f3eee4]/55"><span className="flex items-center gap-1 text-[#bd8250]"><Star size={11} fill="currentColor" /> {meta.rating}</span><span>({meta.reviews})</span>{meta.stock <= 3 && <span className="text-[#bd8250]">Only {meta.stock} left</span>}</div></div>
        <div className="text-right"><p className="text-sm">{formatPrice(product.price)}</p><div className="mt-3 flex justify-end gap-2"><button onClick={onLike} className={`rounded-full border p-2 transition-colors ${liked ? 'border-[#bd8250] bg-[#bd8250] text-[#f3eee4]' : 'border-[#f3eee4]/15 hover:border-[#bd8250]'}`} aria-label={`${liked ? 'Remove' : 'Add'} ${product.name} from wishlist`} data-testid={`button-wishlist-${product.id}`}><Heart size={14} fill={liked ? 'currentColor' : 'none'} /></button>{onCompare && <button onClick={onCompare} className={`rounded-full border p-2 transition-colors ${compared ? 'border-[#b99a63] bg-[#b99a63]' : 'border-[#f3eee4]/15 hover:border-[#f3eee4]'}`} aria-label={`${compared ? 'Remove' : 'Add'} ${product.name} to comparison`} data-testid={`button-compare-${product.id}`}><ArrowRightLeft size={14} /></button>}<button onClick={onAdd} className="rounded-full border border-[#f3eee4]/15 p-2 transition-colors hover:bg-[#0b0b0a] hover:text-[#f3eee4]" aria-label={`Add ${product.name} to bag`} data-testid={`button-add-${product.id}`}><Plus size={14} /></button></div></div>
      </div>
    </article>
  );
}

function Marquee({ text = defaultSiteContent.marquee }: { text?: string }) {
  return <div className="overflow-hidden border-y border-[#f3eee4]/15 py-4 font-mono-ui text-[10px] uppercase tracking-[.24em] text-[#f3eee4]/60"><div className="marquee-track flex w-max"><span className="flex items-center gap-8 pr-8">{text} <i className="h-1.5 w-1.5 rounded-full bg-[#bd8250]" /> {text} <i className="h-1.5 w-1.5 rounded-full bg-[#b99a63]" /> {text}</span><span className="flex items-center gap-8 pr-8">{text} <i className="h-1.5 w-1.5 rounded-full bg-[#bd8250]" /> {text} <i className="h-1.5 w-1.5 rounded-full bg-[#b99a63]" /> {text}</span></div></div>;
}

function Home({ onAdd, liked, onLike, compared, onCompare }: { onAdd: (product: Product) => void; liked: string[]; onLike: (id: string) => void; compared: string[]; onCompare: (id: string) => void }) {
  const [activeProduct, setActiveProduct] = useState(0);
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  useEffect(() => {
    if (!firebaseEnabled) return;
    void loadSiteContent().then((content) => { if (content) setSiteContent(content); }).catch(() => undefined);
  }, []);
  const [showVideo, setShowVideo] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(true);
  const toggleHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };
  const replayHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  };
  const featured = products[activeProduct];
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('main section'));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    sections.forEach((section, index) => {
      if (index > 0) section.classList.add('reveal-on-scroll');
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  return (
    <main>
      <section className="relative min-h-[720px] overflow-hidden bg-[#24231f] md:min-h-[820px]">
        <video ref={heroVideoRef} className="hero-intro-video absolute inset-0 h-full w-full object-cover object-center mix-blend-multiply opacity-70" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" poster={siteContent.heroPoster || defaultSiteContent.heroPoster} src={siteContent.heroVideo || defaultSiteContent.heroVideo} onPlay={() => setHeroVideoPlaying(true)} onPause={() => setHeroVideoPlaying(false)} />
        <div className="hero-intro-overlay absolute inset-0 bg-[linear-gradient(90deg,rgba(25,36,54,.10),transparent_55%,rgba(220,229,108,.18))]" /><div className="hero-video-controls absolute bottom-7 right-5 z-10 flex items-center gap-2 md:bottom-10 md:right-10"><button type="button" onClick={toggleHeroVideo} className="flex items-center gap-2 rounded-full border border-[#f3eee4]/30 bg-[#0b0b0a]/35 px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.14em] text-[#f3eee4] backdrop-blur-md transition-colors hover:border-[#b99a63] hover:text-[#b99a63]" aria-label={heroVideoPlaying ? 'Pause intro video' : 'Play intro video'} data-testid="button-hero-video-toggle">{heroVideoPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}<span className="hidden sm:inline">{heroVideoPlaying ? 'Pause' : 'Play'}</span></button><button type="button" onClick={replayHeroVideo} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f3eee4]/30 bg-[#0b0b0a]/35 text-[#f3eee4] backdrop-blur-md transition-colors hover:border-[#b99a63] hover:text-[#b99a63]" aria-label="Replay intro video" data-testid="button-hero-video-replay"><RotateCcw size={12} /></button></div>
        <div className="relative mx-auto flex min-h-[720px] max-w-[1440px] flex-col justify-end px-5 pb-14 pt-32 md:min-h-[820px] md:px-10 md:pb-20">
          <div className="max-w-3xl page-reveal"><p className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-[#f3eee4]/65">{siteContent.heroEyebrow}</p><h1 className="mt-5 max-w-3xl font-display text-[5.6rem] leading-[.78] tracking-[-.065em] text-[#f3eee4] md:text-[10.5rem]">{siteContent.heroTitle.split("\n").map((line, index) => <span key={line + index} className={index === siteContent.heroTitle.split("\n").length - 1 ? "block italic" : "block"}>{line}</span>)}</h1><p className="mt-6 max-w-md text-sm leading-6 text-[#f3eee4]/70">{siteContent.heroBody}</p><div className="mt-9 flex flex-wrap items-center gap-5"><Link href="/furniture" className="group flex items-center gap-3 rounded-full bg-[#0b0b0a] px-6 py-4 text-xs uppercase tracking-[.16em] text-[#f3eee4] transition-transform hover:scale-[1.03]" data-testid="link-hero-shop">Browse the collection <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link><button onClick={() => setShowVideo(true)} className="group flex items-center gap-3 text-xs uppercase tracking-[.16em] text-[#f3eee4]" data-testid="button-hero-film"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f3eee4]/40 transition-colors group-hover:bg-[#b99a63]"><Play size={13} fill="currentColor" /></span> Watch the film</button><Link href="#featured" className="group flex items-center gap-2 text-xs uppercase tracking-[.16em] text-[#f3eee4]/75 transition-colors hover:text-[#b99a63]" data-testid="link-hero-scene">Explore this room <ArrowDownRight size={15} className="transition-transform group-hover:translate-y-0.5" /></Link></div></div>
          <div className="mt-20 flex items-end justify-between border-t border-[#f3eee4]/25 pt-4 text-[#f3eee4]/60 page-reveal delay-3"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em]">{siteContent.announcement}</span><span className="hidden max-w-[170px] text-right text-xs leading-5 md:block">A collection of shapes that give the day somewhere to land.</span><ArrowDownRight size={17} />
          </div>
        </div>
      </section>
      <Marquee text={siteContent.marquee} />
      <section className="bg-[#171512] px-5 py-24 md:px-10 md:py-36">
        <div className="mx-auto grid max-w-[1440px] items-end gap-12 md:grid-cols-[.8fr_1.2fr]">
          <div><p className="eyebrow">The FurniVision point of view</p><h2 className="mt-6 max-w-md font-display text-6xl leading-[.86] tracking-[-.05em] md:text-8xl">Furniture should start a <em>conversation.</em></h2></div>
          <div className="max-w-lg md:justify-self-end"><p className="text-xl leading-relaxed text-[#f3eee4]/70">Not a showroom of perfect rooms. A considered collection of pieces that leave space for your life to happen around them.</p><div className="mt-10 flex items-center gap-4 font-mono-ui text-[10px] uppercase tracking-[.18em]"><span className="pulse-line h-px w-16 origin-left bg-[#bd8250]" /> New York / Since 2024</div></div>
        </div>
      </section>
      <section id="featured" className="bg-[#171512] px-5 pb-28 md:px-10 md:pb-40">
        <div className="mx-auto max-w-[1440px]"><div className="flex items-end justify-between border-b border-[#f3eee4]/20 pb-5"><div><p className="eyebrow">A closer look</p><h2 className="mt-4 font-display text-5xl tracking-[-.04em] md:text-7xl">Objects in orbit</h2></div><Link href="/furniture" className="hidden items-center gap-2 text-xs uppercase tracking-[.15em] md:flex" data-testid="link-featured-all">View all pieces <ArrowRight size={15} /></Link></div>
          <div className="mt-9 grid gap-10 md:grid-cols-[.9fr_1.1fr]">
            <div className="relative min-h-[530px] overflow-hidden rounded-[1.5rem] bg-[#292823] p-7 md:min-h-[650px]"><img src={featured.image} alt={featured.name} className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-75 transition-opacity duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0a]/55 via-transparent to-transparent" /><div className="relative flex h-full flex-col justify-between text-[#f3eee4]"><div className="flex items-start justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em]">Featured / {String(activeProduct + 1).padStart(2, '0')}</span><span className="rounded-full border border-[#f3eee4]/50 px-3 py-1 font-mono-ui text-[9px] uppercase tracking-[.15em]">Selected</span></div><div><p className="font-display text-6xl leading-[.8] md:text-8xl">{featured.name}</p><div className="mt-5 flex items-center justify-between"><p className="text-sm">{formatPrice(featured.price)} <span className="text-[#f3eee4]/60">/ {featured.material}</span></p><Link href={`/furniture/${featured.id}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b99a63] text-[#f3eee4]" data-testid="link-featured-product"><ArrowUpRight size={17} /></Link></div></div></div></div>
            <div className="flex flex-col justify-between"><div className="grid gap-4 sm:grid-cols-2">{products.slice(0, 4).map((product, index) => <button key={product.id} onClick={() => setActiveProduct(index)} className={`group flex items-center gap-4 border-b pb-4 text-left transition-opacity ${activeProduct === index ? 'border-[#f3eee4]' : 'border-[#f3eee4]/15 opacity-60 hover:opacity-100'}`} data-testid={`button-select-featured-${product.id}`}><span className="font-mono-ui text-[10px]">0{index + 1}</span><img src={product.image} alt="" className="h-16 w-16 rounded-xl object-cover grayscale transition-all group-hover:grayscale-0" /><span className="flex-1 font-display text-2xl">{product.name}</span><span className="text-xs">{formatPrice(product.price)}</span></button>)}</div><div className="mt-16 grid grid-cols-3 gap-5 border-t border-[#f3eee4]/15 pt-6 text-xs text-[#f3eee4]/60"><div><Box size={18} strokeWidth={1.2} className="mb-3 text-[#bd8250]" /><span>Thoughtful<br />materials</span></div><div><Ruler size={18} strokeWidth={1.2} className="mb-3 text-[#bd8250]" /><span>Measured for<br />real rooms</span></div><div><Truck size={18} strokeWidth={1.2} className="mb-3 text-[#bd8250]" /><span>Delivered<br />with care</span></div></div></div>
          </div>
        </div>
      </section>
      <section className="bg-[#171512] px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-5 border-b border-[#f3eee4]/20 pb-5 md:flex-row md:items-end">
            <div><p className="eyebrow">Just in / Spring 2024</p><h2 className="mt-4 font-display text-6xl tracking-[-.05em] md:text-8xl">New arrivals.</h2></div>
            <Link href="/furniture" className="inline-flex items-center gap-2 text-xs uppercase tracking-[.15em]" data-testid="link-new-arrivals-all">See the full collection <ArrowRight size={15} /></Link>
          </div>
          <p className="mt-6 max-w-md text-sm leading-6 text-[#f3eee4]/60">Four new ways to bring more calm, order, and comfort into the rooms you use most.</p>
          <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{newArrivalIds.map((id) => { const product = products.find((item) => item.id === id); return product ? <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} compared={compared.includes(product.id)} onLike={() => onLike(product.id)} onCompare={() => onCompare(product.id)} onAdd={() => onAdd(product)} /> : null; })}</div>
        </div>
      </section>
      <section className="relative overflow-hidden bg-[#b99a63] px-5 py-24 md:px-10 md:py-36"><div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border border-[#f3eee4]/20 md:h-[32rem] md:w-[32rem]" /><div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-[#f3eee4]/15 md:h-80 md:w-80" /><div className="relative mx-auto grid max-w-[1440px] gap-12 md:grid-cols-[1fr_1fr] md:items-center"><div><p className="eyebrow">The room, reimagined</p><h2 className="mt-5 max-w-xl font-display text-7xl leading-[.78] tracking-[-.06em] md:text-[9rem]">See it in<br /><em>your room.</em></h2></div><div className="max-w-sm md:justify-self-end"><div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#f3eee4]/40"><Move3d size={28} strokeWidth={1} className="spin-slow" /></div><p className="text-xl leading-relaxed text-[#f3eee4]/75">Visualize a piece against your walls before it ever arrives. Move, rotate, and find the angle that feels like you.</p><Link href="/design" className="mt-9 inline-flex items-center gap-3 border-b border-[#f3eee4] pb-2 text-xs uppercase tracking-[.16em]" data-testid="link-home-design">Open the room visualizer <ArrowUpRight size={16} /></Link></div></div></section>
      <section className="bg-[#0b0b0a] px-5 py-24 text-[#f3eee4] md:px-10 md:py-36"><div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#b99a63]">Journal / 01</p><h2 className="mt-5 max-w-md font-display text-6xl leading-[.84] tracking-[-.05em] md:text-8xl">The art of the <em>unfinished</em> room.</h2></div><div className="md:pt-24"><div className="image-reveal relative aspect-[1.55] overflow-hidden rounded-[1.5rem]"><img src="/assets/room-detail.jpg" alt="Bottle green sofa in a quiet room" className="h-full w-full object-cover" /><div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-[#f3eee4]"><p className="font-display text-3xl">Leave a little space.</p><ArrowUpRight size={20} /></div></div><p className="mt-5 max-w-md text-sm leading-6 text-[#f3eee4]/60">A note on negative space, patina, and why the best rooms are never quite done.</p></div></div></section>
      <section className="bg-[#171512] px-5 py-24 md:px-10 md:py-32"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Small details, big difference</p><h2 className="mt-4 font-display text-6xl tracking-[-.05em] md:text-8xl">Good to know.</h2></div><p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">We obsess over the parts you touch first and remember longest.</p></div><div className="mt-14 grid border-t border-[#f3eee4]/20 md:grid-cols-3">{[['01', 'Repair, not replace', 'Every piece is designed to age beautifully and be cared for over time.'], ['02', 'Soft on the senses', 'Low-VOC finishes, natural fibers, and materials chosen for how they feel.'], ['03', 'A human delivery', 'White-glove delivery, unpacked and placed exactly where it belongs.']].map(([number, title, text]) => <div className="border-b border-[#f3eee4]/20 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0" key={number}><p className="font-mono-ui text-[10px] text-[#bd8250]">{number}</p><h3 className="mt-10 font-display text-4xl">{title}</h3><p className="mt-4 max-w-xs text-sm leading-6 text-[#f3eee4]/60">{text}</p></div>)}</div></div></section>
      {showVideo && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b0b0a]/85 p-5 backdrop-blur-sm"><button onClick={() => setShowVideo(false)} className="absolute right-6 top-6 text-[#f3eee4]" aria-label="Close film" data-testid="button-close-film"><X /></button><video className="max-h-[80vh] w-full max-w-5xl rounded-2xl" controls autoPlay src="/assets/furnivision-intro.mp4" data-testid="video-intro-film" /></div>}
    </main>
  );
}

function FurniturePage({ onAdd, liked, onLike, compared, onCompare }: { onAdd: (product: Product) => void; liked: string[]; onLike: (id: string) => void; compared: string[]; onCompare: (id: string) => void }) {
  const [location] = useLocation();
  const search = new URLSearchParams(location.split('?')[1] || '').get('search') || '';
  const [filter, setFilter] = useState('All pieces');
  const [sort, setSort] = useState('Featured');
  const [materialFilter, setMaterialFilter] = useState('All materials');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const categories = ['All pieces', ...collectionPages.map((page) => page.label)];
  const materials = ['All materials', ...Array.from(new Set(products.map((product) => product.material)))];
  const filtered = useMemo(() => products.filter((product) => (filter === 'All pieces' || product.collection === filter) && (materialFilter === 'All materials' || product.material === materialFilter) && (!search || `${product.name} ${product.material}`.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : sort === 'Price: high to low' ? b.price - a.price : 0), [filter, materialFilter, search, sort]);
  useEffect(() => { setPage(1); }, [filter, materialFilter, search, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProducts = filtered.slice((page - 1) * pageSize, page * pageSize);
  return (
    <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-9 border-b border-[#f3eee4]/20 pb-10 md:flex-row md:items-end">
          <div><p className="eyebrow">The collection / 2024</p><h1 className="mt-5 font-display text-8xl leading-[.78] tracking-[-.06em] md:text-[10rem]">Live <em>well.</em></h1></div>
          <p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">Pieces with presence, proportion, and a little room for your own point of view.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collectionPages.map((page) => (
            <Link href={`/furniture/category/${page.slug}`} key={page.slug} className="group relative min-h-44 overflow-hidden rounded-[1.25rem] p-5 text-[#f3eee4]" style={{ backgroundColor: page.accent }} data-testid={`link-collection-${page.slug}`}>
              <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-multiply transition-transform duration-700 group-hover:scale-110" />
              <div className="relative flex h-full flex-col justify-between"><span className="font-mono-ui text-[9px] uppercase tracking-[.16em]">{page.label}</span><div className="flex items-end justify-between gap-4"><span className="max-w-[170px] font-display text-3xl leading-[.9]">{page.description}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#f3eee4]/25 transition-colors group-hover:bg-[#0b0b0a] group-hover:text-[#f3eee4]"><ArrowUpRight size={15} /></span></div></div>
            </Link>
          ))}
        </div>
        <div className="mt-14 flex flex-col justify-between gap-5 border-b border-[#f3eee4]/15 pb-5 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">{categories.map((category) => <button key={category} onClick={() => setFilter(category)} className={`rounded-full border px-4 py-2 text-xs transition-colors ${filter === category ? 'border-[#f3eee4] bg-[#0b0b0a] text-[#f3eee4]' : 'border-[#f3eee4]/20 hover:border-[#f3eee4]'}`} data-testid={`button-filter-${category.toLowerCase().replaceAll(' ', '-')}`}>{category}</button>)}</div>
          <div className="flex items-center gap-4 text-xs text-[#f3eee4]/60"><label className="flex items-center gap-2"><span className="hidden sm:inline">Material</span><select value={materialFilter} onChange={(event) => setMaterialFilter(event.target.value)} className="max-w-[130px] bg-transparent font-medium text-[#f3eee4] outline-none" aria-label="Filter by material" data-testid="select-filter-material">{materials.map((material) => <option key={material}>{material}</option>)}</select></label><label className="flex items-center gap-2"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent font-medium text-[#f3eee4] outline-none" aria-label="Sort products" data-testid="select-sort-products"><option>Featured</option><option>Price: low to high</option><option>Price: high to low</option></select><ChevronDown size={14} /></label></div>
        </div>
        <div className="catalog-count mt-7 flex items-center justify-between gap-4 border-b border-[#f3eee4]/10 pb-3 font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f3eee4]/50"><span>{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'} available</span><span className="hidden sm:inline">Page {page} / {pageCount}</span></div>
        {search && <p className="mt-7 font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#bd8250]">Showing results for “{search}”</p>}
        {filtered.length > 0 ? <div className="catalog-grid mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} compared={compared.includes(product.id)} onLike={() => onLike(product.id)} onCompare={() => onCompare(product.id)} onAdd={() => onAdd(product)} />)}</div> : <div className="py-28 text-center"><Sparkles className="mx-auto text-[#bd8250]" /><h2 className="mt-5 font-display text-5xl">Nothing in that register.</h2><p className="mt-3 text-sm text-[#f3eee4]/55">Try another room or style.</p><button className="mt-7 border-b border-[#bd8250] pb-1 text-xs uppercase tracking-[.15em]" onClick={() => { setFilter('All pieces'); setMaterialFilter('All materials'); setSort('Featured'); }} data-testid="button-reset-filters">Reset filters</button></div>}
        {filtered.length > pageSize && <nav className="catalog-pagination mt-14 flex items-center justify-center gap-2" aria-label="Product pages"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f3eee4]/20 text-xs transition-colors hover:border-[#b99a63]" aria-label="Previous product page" data-testid="button-page-previous"><ChevronLeft size={15} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-xs transition-colors ${page === pageNumber ? 'border-[#b99a63] bg-[#b99a63] text-[#0b0b0a]' : 'border-[#f3eee4]/20 hover:border-[#b99a63]'}`} aria-label={`Go to product page ${pageNumber}`} aria-current={page === pageNumber ? 'page' : undefined} data-testid={`button-page-${pageNumber}`}>{pageNumber}</button>)}<button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f3eee4]/20 text-xs transition-colors hover:border-[#b99a63]" aria-label="Next product page" data-testid="button-page-next"><ArrowRight size={15} /></button></nav>}
      </div>
    </main>
  );
}

function CollectionPage({ onAdd, liked, onLike, compared, onCompare }: { onAdd: (product: Product) => void; liked: string[]; onLike: (id: string) => void; compared: string[]; onCompare: (id: string) => void }) {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const page = collectionPages.find((item) => item.slug === categorySlug);
  if (!page) return <NotFound />;
  const collectionProducts = products.filter((product) => product.collection === page.label);
  const titleWords = page.label.split(' ');
  const title = titleWords.length > 1 ? <>{titleWords[0]}<br /><em>{titleWords.slice(1).join(' ')}</em></> : <em>{page.label}</em>;
  return (
    <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto max-w-[1440px]">
        <Link href="/furniture" className="inline-flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/60 hover:text-[#f3eee4]" data-testid="link-back-collections"><ChevronLeft size={14} /> All collections</Link>
        <div className="mt-8 grid items-end gap-10 border-b border-[#f3eee4]/20 pb-12 md:grid-cols-[1fr_.72fr]">
          <div><p className="eyebrow">FurniVision / {page.label}</p><h1 className="mt-5 max-w-4xl font-display text-8xl leading-[.75] tracking-[-.06em] md:text-[11rem]">{title}</h1></div>
          <p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">{page.description} A considered edit for rooms that are made to be lived in, not looked at.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-[1.15fr_.85fr]">
          <div className="image-reveal relative min-h-[340px] overflow-hidden rounded-[1.5rem]" style={{ backgroundColor: page.accent }}><img src={page.image} alt={`${page.label} collection`} className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-75 transition-transform duration-1000 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0a]/55 via-transparent to-transparent" /><div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[#f3eee4]"><span className="font-mono-ui text-[10px] uppercase tracking-[.17em]">{String(collectionProducts.length).padStart(2, '0')} pieces / {page.label}</span><Move3d size={22} strokeWidth={1.2} /></div></div>
          <div className="flex flex-col justify-end rounded-[1.5rem] p-7" style={{ backgroundColor: page.accent }}><p className="eyebrow">The point of view</p><p className="mt-5 max-w-sm font-display text-4xl leading-[.9]">The room starts with one piece that knows where to land.</p><Link href="/design" className="mt-8 inline-flex items-center gap-2 self-start border-b border-[#f3eee4] pb-2 text-xs uppercase tracking-[.14em]" data-testid={`link-${page.slug}-visualizer`}>See it in your room <ArrowUpRight size={15} /></Link></div>
        </div>
        <div className="mt-16 flex items-end justify-between border-b border-[#f3eee4]/20 pb-5"><div><p className="eyebrow">The edit</p><h2 className="mt-3 font-display text-5xl tracking-[-.04em] md:text-7xl">{page.label}, considered.</h2></div><span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/50">{collectionProducts.length} pieces</span></div>
        {collectionProducts.length > 0 ? <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{collectionProducts.map((product) => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} compared={compared.includes(product.id)} onLike={() => onLike(product.id)} onCompare={() => onCompare(product.id)} onAdd={() => onAdd(product)} />)}</div> : <div className="py-20 text-center text-sm text-[#f3eee4]/60">This collection is arriving soon.</div>}
        <div className="mt-20 flex flex-wrap gap-2 border-t border-[#f3eee4]/15 pt-6">{collectionPages.filter((item) => item.slug !== page.slug).map((item) => <Link href={`/furniture/category/${item.slug}`} key={item.slug} className="rounded-full border border-[#f3eee4]/20 px-4 py-2 text-xs transition-colors hover:border-[#f3eee4]">{item.label}</Link>)}</div>
      </div>
    </main>
  );
}

function WishlistPage({ onAdd, liked, onLike, compared, onCompare }: { onAdd: (product: Product) => void; liked: string[]; onLike: (id: string) => void; compared: string[]; onCompare: (id: string) => void }) {
  const savedProducts = products.filter((product) => liked.includes(product.id));
  return (
    <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto max-w-[1440px]">
        <p className="eyebrow">FurniVision / Saved pieces</p>
        <div className="mt-5 flex flex-col justify-between gap-6 border-b border-[#f3eee4]/20 pb-10 md:flex-row md:items-end"><h1 className="font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Keep<br /><em>close.</em></h1><p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">The pieces you paused on, saved for the room that is still becoming.</p></div>
        {savedProducts.length > 0 ? <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{savedProducts.map((product) => <ProductCard key={product.id} product={product} liked compared={compared.includes(product.id)} onLike={() => onLike(product.id)} onCompare={() => onCompare(product.id)} onAdd={() => onAdd(product)} />)}</div> : <div className="flex flex-col items-center py-28 text-center"><Heart size={28} strokeWidth={1.2} className="text-[#bd8250]" /><h2 className="mt-6 font-display text-5xl">Nothing saved yet.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-[#f3eee4]/60">Tap the heart on anything that feels like it belongs in your room.</p><Link href="/furniture" className="mt-7 rounded-full bg-[#0b0b0a] px-6 py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]" data-testid="link-wishlist-shop">Shop all pieces</Link></div>}
      </div>
    </main>
  );
}

function SavedRoomsPage({ rooms }: { rooms: Array<{ room: string; selected: string; photo: string | null }> }) {
  return (
    <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto max-w-[1440px]"><p className="eyebrow">FurniVision / Saved rooms</p><div className="mt-5 flex flex-col justify-between gap-6 border-b border-[#f3eee4]/20 pb-10 md:flex-row md:items-end"><h1 className="font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Rooms<br /><em>to return to.</em></h1><p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">Keep the combinations that feel right, then come back when the room is ready.</p></div>{rooms.length > 0 ? <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rooms.map((savedRoom, index) => { const product = products.find((item) => item.id === savedRoom.selected) || products[0]; return <article className="overflow-hidden rounded-[1.5rem] bg-[#b99a63]" key={`${savedRoom.room}-${savedRoom.selected}-${index}`}><div className="relative aspect-[1.2] overflow-hidden"><img src={savedRoom.photo || product.image} alt={`${savedRoom.room} with ${product.name}`} className="h-full w-full object-cover mix-blend-multiply" /><span className="absolute left-5 top-5 rounded-full bg-[#171512]/85 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-[.15em]">Saved room / {index + 1}</span></div><div className="p-6"><p className="eyebrow">{savedRoom.room}</p><h2 className="mt-3 font-display text-4xl">{product.name}</h2><Link href="/design" className="mt-6 inline-flex items-center gap-2 border-b border-[#f3eee4] pb-2 text-xs uppercase tracking-[.14em]" data-testid={`link-reopen-room-${index}`}>Open visualizer <ArrowUpRight size={14} /></Link></div></article>; })}</div> : <div className="flex flex-col items-center py-28 text-center"><Move3d size={28} strokeWidth={1.2} className="text-[#bd8250]" /><h2 className="mt-6 font-display text-5xl">Your rooms are still becoming.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-[#f3eee4]/60">Open the visualizer, place a piece, and save the combination when it feels right.</p><Link href="/design" className="mt-7 rounded-full bg-[#0b0b0a] px-6 py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]" data-testid="link-saved-rooms-design">Open the visualizer</Link></div>}</div>
    </main>
  );
}

function BundlesPage({ onAdd }: { onAdd: (product: Product) => void }) {
  return (
    <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid items-end gap-8 border-b border-[#f3eee4]/20 pb-10 md:grid-cols-[1fr_.65fr]"><div><p className="eyebrow">FurniVision / Room edits</p><h1 className="mt-5 font-display text-8xl leading-[.75] tracking-[-.06em] md:text-[11rem]">Rooms<br /><em>with rhythm.</em></h1></div><p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">A few considered combinations for when you want the whole room to click at once.</p></div>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">{bundles.map((bundle) => { const bundleProducts = bundle.productIds.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product)); const total = bundleProducts.reduce((sum, product) => sum + product.price, 0); return <article key={bundle.slug} className="group overflow-hidden rounded-[1.5rem] bg-[#b99a63]"><div className="image-reveal relative aspect-[1.05] overflow-hidden"><img src={bundle.image} alt={bundle.title} className="h-full w-full object-cover mix-blend-multiply transition-transform duration-1000 group-hover:scale-105" /><span className="absolute left-5 top-5 rounded-full bg-[#171512]/85 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-[.15em]">{bundleProducts.length} pieces</span></div><div className="p-6"><p className="eyebrow">Room edit / {bundle.slug.replaceAll('-', ' ')}</p><h2 className="mt-4 font-display text-5xl leading-[.86]">{bundle.title}</h2><p className="mt-4 text-sm leading-6 text-[#f3eee4]/65">{bundle.copy}</p><div className="mt-6 flex items-end justify-between border-t border-[#f3eee4]/15 pt-5"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#f3eee4]/55">Complete edit</p><p className="mt-1 font-display text-3xl">{formatPrice(total)}</p></div><button onClick={() => bundleProducts.forEach(onAdd)} className="flex items-center gap-2 rounded-full bg-[#0b0b0a] px-4 py-3 text-[10px] uppercase tracking-[.13em] text-[#f3eee4]" data-testid={`button-add-bundle-${bundle.slug}`}>Add room <Plus size={14} /></button></div><div className="mt-5 flex flex-wrap gap-2">{bundleProducts.map((product) => <Link href={`/furniture/${product.id}`} key={product.id} className="rounded-full border border-[#f3eee4]/20 px-3 py-1.5 text-[10px]">{product.name}</Link>)}</div></div></article>; })}</div>
      </div>
    </main>
  );
}

function CheckoutPage({ items, onRemove, onOrder, onIncrement = (id) => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'increment', id } })), onDecrement = (id) => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'decrement', id } })), onClear = () => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'clear' } })) }: { items: Product[]; onRemove: (id: string) => void; onOrder?: (order: { items: Product[]; total: number; createdAt: string }) => void; onIncrement?: (id: string) => void; onDecrement?: (id: string) => void; onClear?: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  if (submitted) return <main className="flex min-h-screen items-center justify-center bg-[#b99a63] px-5 py-32 text-center"><div><Check className="mx-auto h-12 w-12" strokeWidth={1.1} /><p className="eyebrow mt-8">Order received / 001</p><h1 className="mt-5 font-display text-7xl leading-[.78] tracking-[-.06em] md:text-[9rem]">A room<br /><em>is coming.</em></h1><p className="mx-auto mt-7 max-w-sm text-sm leading-6 text-[#f3eee4]/65">We’ll send a confirmation and delivery window to your inbox. Thank you for choosing pieces with a point of view.</p><Link href="/" className="mt-8 inline-flex rounded-full bg-[#0b0b0a] px-6 py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]" data-testid="link-order-home">Return home</Link></div></main>;
  return (
     <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
       <div className="mx-auto max-w-[1180px]"><Link href="/furniture" className="inline-flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/60"><ChevronLeft size={14} /> Continue shopping</Link><div className="mt-8 grid gap-12 lg:grid-cols-[1fr_360px]"><div><p className="eyebrow">FurniVision / Checkout</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Make it<br /><em>yours.</em></h1>{items.length === 0 ? <div className="mt-12 rounded-[1.25rem] bg-[#b99a63] p-8"><p className="font-display text-4xl">Your bag is waiting.</p><Link href="/furniture" className="mt-6 inline-flex border-b border-[#f3eee4] pb-2 text-xs uppercase tracking-[.15em]" data-testid="link-checkout-empty-shop">Browse the collection <ArrowUpRight size={14} /></Link></div> : <form onSubmit={(event) => { event.preventDefault(); setPlacing(true); window.setTimeout(() => { setPlacing(false); setSubmitted(true); onClear(); }, 650); }} className="mt-12 grid gap-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">First name<input required autoComplete="given-name" aria-label="First name" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><label className="text-xs uppercase tracking-[.13em]">Last name<input required autoComplete="family-name" aria-label="Last name" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label></div><label className="text-xs uppercase tracking-[.13em]">Email<input required type="email" autoComplete="email" aria-label="Email" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><label className="text-xs uppercase tracking-[.13em]">Delivery address<input required autoComplete="street-address" aria-label="Delivery address" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">City<input required autoComplete="address-level2" aria-label="City" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><label className="text-xs uppercase tracking-[.13em]">Preferred delivery<select aria-label="Preferred delivery window" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none"><option>Choose a window</option><option>Weekday morning</option><option>Weekday afternoon</option><option>Saturday</option></select></label></div><button disabled={placing} className="mt-4 flex items-center justify-center gap-3 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:opacity-60" data-testid="button-place-order">{placing ? 'Preparing your order' : 'Place order'} {!placing && <ArrowUpRight size={15} />}</button></form>}</div><aside className="h-fit rounded-[1.5rem] bg-[#0b0b0a] p-6 text-[#f3eee4] md:p-7"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#b99a63]">Order summary / {items.length}</p><div className="mt-6 divide-y divide-[#f2eee6]/15">{groupCartItems(items).map(({ product, quantity }) => <div className="flex gap-3 py-4 first:pt-0" key={product.id}><img src={product.image} alt="" className="h-16 w-16 rounded-lg object-cover" /><div className="flex-1"><p className="font-display text-2xl">{product.name}</p><p className="mt-1 text-xs text-[#f3eee4]/55">{product.material}</p><div className="mt-3 flex items-center gap-2 rounded-full border border-[#f3eee4]/20 w-fit"><button onClick={() => onDecrement(product.id)} className="flex h-7 w-7 items-center justify-center" aria-label={`Decrease ${product.name} quantity`} data-testid={`button-checkout-decrease-${product.id}`}>−</button><span className="w-5 text-center font-mono-ui text-[10px]">{quantity}</span><button onClick={() => onIncrement(product.id)} className="flex h-7 w-7 items-center justify-center" aria-label={`Increase ${product.name} quantity`} data-testid={`button-checkout-increase-${product.id}`}><Plus size={11} /></button></div></div><div className="text-right text-sm">{formatPrice(product.price * quantity)}<button onClick={() => onRemove(product.id)} className="mt-2 block text-[9px] uppercase tracking-[.13em] text-[#b99a63]" data-testid={`button-checkout-remove-${product.id}`}>Remove</button></div></div>)}</div><div className="mt-5 flex justify-between border-t border-[#f3eee4]/15 pt-5 font-display text-3xl"><span>Total</span><span>{formatPrice(total)}</span></div><p className="mt-2 text-xs leading-5 text-[#f3eee4]/55">White-glove delivery is included. Your preferred window will be confirmed after order review.</p></aside></div></div>
    </main>
  );
}

function ProductPage({ onAdd, liked: likedProp, onLike: onLikeProp }: { onAdd: (product: Product) => void; liked?: boolean; onLike?: () => void }) {
  const params = useParams<{ productId: string }>();
  const product = products.find((item) => item.id === params.productId);
  const [localLiked, setLocalLiked] = useState(() => product ? readStored<string[]>('furnivision-wishlist', []).includes(product.id) : false);
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(product?.color || '#0c3b36');
  const [variantIndex, setVariantIndex] = useState(0);
  const [activeImage, setActiveImage] = useState(product?.image || '/assets/hero-room.jpg');
  const [rotation, setRotation] = useState(0);
  if (!product) return <NotFound />;
  const liked = likedProp ?? localLiked;
  const onLike = onLikeProp || (() => {
    const current = readStored<string[]>('furnivision-wishlist', []);
    const next = current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id];
    window.localStorage.setItem('furnivision-wishlist', JSON.stringify(next));
    setLocalLiked(next.includes(product.id));
    window.dispatchEvent(new CustomEvent('furnivision-wishlist-change'));
  });
  const meta = productMeta(product);
  const currentVariant = meta.variants[variantIndex] || meta.variants[0];
  const currentPrice = product.price + (currentVariant.priceDelta || 0);
  const thumbs = [product.image, '/assets/hero-room.jpg', '/assets/room-detail.jpg'];
  return <ProductExperience product={product} meta={meta} currentVariant={currentVariant} currentPrice={currentPrice} liked={liked} onLike={onLike} onAdd={onAdd} quantity={quantity} setQuantity={setQuantity} color={color} setColor={setColor} variantIndex={variantIndex} setVariantIndex={setVariantIndex} activeImage={activeImage} setActiveImage={setActiveImage} rotation={rotation} setRotation={setRotation} thumbs={thumbs} />;
}

function InspirationPage() {
  const stories = [
    { title: 'A room with a pulse', tag: 'Brooklyn / 07:42', image: '/assets/hero-room.jpg', copy: 'A bottle-green anchor, a little morning light, and nowhere to rush.' },
    { title: 'Keep the quiet', tag: 'Copenhagen / 18:10', image: '/assets/room-detail.jpg', copy: 'On the beauty of leaving the edges unresolved.' },
    { title: 'The useful object', tag: 'New York / 12:26', image: '/assets/frame-15.jpg', copy: 'Small tables, big jobs, no fuss.' },
  ];
  return <main className="bg-[#0b0b0a] px-5 pb-28 pt-32 text-[#f3eee4] md:px-10 md:pt-44"><div className="mx-auto max-w-[1440px]"><div className="grid items-end gap-10 md:grid-cols-[1fr_.7fr]"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#b99a63]">FurniVision / Room stories</p><h1 className="mt-5 max-w-4xl font-display text-8xl leading-[.75] tracking-[-.06em] md:text-[11rem]">Stay a<br /><em>while.</em></h1></div><p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">A field guide to rooms with texture, rhythm, and signs of a life well lived.</p></div><div className="mt-24 grid gap-16 md:grid-cols-[1.2fr_.8fr]"><Link href="/furniture/arc-sofa" className="group" data-testid="link-story-featured"><div className="image-reveal overflow-hidden rounded-[1.5rem]"><img src={stories[0].image} alt={stories[0].title} className="aspect-[1.15] w-full object-cover transition-transform duration-1000 group-hover:scale-105" /></div><div className="mt-5 flex justify-between gap-5"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#b99a63]">{stories[0].tag}</p><h2 className="mt-3 font-display text-5xl">{stories[0].title}</h2></div><ArrowUpRight className="mt-2 text-[#b99a63]" /></div><p className="mt-3 max-w-md text-sm text-[#f3eee4]/60">{stories[0].copy}</p></Link><div className="grid gap-16 md:pt-28">{stories.slice(1).map((story, index) => <Link href="/furniture" className="group" key={story.title} data-testid={`link-story-${index}`}><div className="image-reveal overflow-hidden rounded-[1.5rem]"><img src={story.image} alt={story.title} className="aspect-[1.15] w-full object-cover transition-transform duration-1000 group-hover:scale-105" /></div><div className="mt-4 flex justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#b99a63]">{story.tag}</p><h2 className="mt-2 font-display text-4xl">{story.title}</h2></div><ArrowUpRight className="text-[#b99a63]" /></div><p className="mt-2 text-sm text-[#f3eee4]/60">{story.copy}</p></Link>)}</div></div></div></main>;
}

function DesignPage({ onSaveRoom }: { onSaveRoom: (room: string, selected: string, photo: string | null) => void }) {
  const [room, setRoom] = useState('Living room');
  const [selected, setSelected] = useState('arc-sofa');
  const [rotation, setRotation] = useState(0);
  const [wallTone, setWallTone] = useState('#c6c0b0');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  useEffect(() => subscribeToAuth((nextUser) => setAuthUser(nextUser ? { uid: nextUser.uid, email: nextUser.email, displayName: nextUser.displayName } : null)), []);
  const selectedProduct = products.find((product) => product.id === selected) || products[0];
  const handleRoomPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (authUser) {
      void uploadRoomPhoto(authUser.uid, file).then((url) => {
        if (url) setPhoto(url);
      });
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };
  return <main className="min-h-screen bg-[#b99a63] px-5 pb-24 pt-32 md:px-10 md:pt-44"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow">FurniVision / Room visualizer</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Try it<br /><em>in situ.</em></h1></div><div className="max-w-xs text-sm leading-6 text-[#f3eee4]/65"><Move3d size={22} strokeWidth={1.4} className="mb-5" />Drag the room. Find the piece. Make it yours.</div></div><div className="mt-14 grid gap-6 lg:grid-cols-[1fr_340px]"><div className="relative min-h-[580px] overflow-hidden rounded-[1.5rem] shadow-[18px_24px_0_rgba(25,36,54,.12)]" style={{ backgroundColor: wallTone }} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => { if (event.buttons) setRotation((current) => current + event.movementX * 0.35); }}><img src={photo || '/assets/hero-room.jpg'} alt="Room visualizer preview" className={`absolute inset-0 h-full w-full object-cover grayscale-[.15] mix-blend-multiply opacity-75 ${photo ? '' : 'transition-transform duration-700'}`} style={{ transform: `perspective(1000px) rotateY(${rotation}deg) scale(${1 + Math.min(Math.abs(rotation), 25) / 180})` }} /><div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0a]/55 via-transparent to-transparent" /><div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-[#171512]/80 px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.13em]"><span className="h-2 w-2 rounded-full bg-[#bd8250]" /> Live preview</div><div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[#f3eee4]"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em]">Selected piece / {room}</p><p className="mt-2 font-display text-5xl">{selectedProduct.name}</p></div><button onClick={() => setRotation((current) => current + 45)} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b99a63] text-[#f3eee4] transition-transform hover:rotate-45" aria-label="Rotate selected piece" data-testid="button-rotate-piece"><Move3d size={18} /></button></div><div className="absolute bottom-6 right-6 hidden rounded-full bg-[#171512]/80 px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.13em] text-[#f3eee4] md:block">Drag to explore</div></div><aside className="rounded-[1.5rem] bg-[#171512] p-6 md:p-7"><div className="flex items-center justify-between border-b border-[#f3eee4]/15 pb-5"><p className="eyebrow">Configure your room</p><Sparkles size={17} className="text-[#bd8250]" /></div><label className="mt-7 block text-xs uppercase tracking-[.14em] text-[#f3eee4]/60">Room</label><div className="mt-3 grid gap-2">{['Living room', 'Bedroom', 'Dining room'].map((item) => <button key={item} onClick={() => setRoom(item)} className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm ${room === item ? 'border-[#f3eee4] bg-[#0b0b0a] text-[#f3eee4]' : 'border-[#f3eee4]/15'}`} data-testid={`button-room-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}{room === item && <Check size={15} />}</button>)}</div><label className="mt-8 block text-xs uppercase tracking-[.14em] text-[#f3eee4]/60">Wall tone</label><div className="mt-3 flex gap-2">{['#c6c0b0', '#d8ddd3', '#879b80', '#192436'].map((tone) => <button key={tone} onClick={() => setWallTone(tone)} className={`h-8 w-8 rounded-full border-2 p-1 ${wallTone === tone ? 'border-[#bd8250]' : 'border-transparent'}`} aria-label={`Select wall tone ${tone}`}><span className="block h-full w-full rounded-full" style={{ backgroundColor: tone }} /></button>)}</div><label className="mt-8 block text-xs uppercase tracking-[.14em] text-[#f3eee4]/60">Your room photo</label><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#f3eee4]/25 p-3 text-sm transition-colors hover:border-[#bd8250]"><Upload size={15} /> {photo ? 'Photo loaded' : 'Upload a room photo'}<input type="file" accept="image/*" onChange={handleRoomPhoto} className="sr-only" /></label><label className="mt-8 block text-xs uppercase tracking-[.14em] text-[#f3eee4]/60">Place a piece</label><div className="mt-3 grid max-h-64 gap-2 overflow-auto pr-1">{products.map((product) => <button key={product.id} onClick={() => setSelected(product.id)} className={`flex items-center gap-3 rounded-xl border p-2 text-left ${selected === product.id ? 'border-[#bd8250]' : 'border-[#f3eee4]/15'}`} data-testid={`button-place-${product.id}`}><img src={product.image} alt="" className="h-12 w-12 rounded-lg object-cover" /><span className="flex-1 text-sm">{product.name}</span><span className="font-mono-ui text-[9px] text-[#f3eee4]/50">{formatPrice(product.price)}</span></button>)}</div><div className="mt-7 grid gap-2 sm:grid-cols-2"><button onClick={() => { onSaveRoom(room, selected, photo); setSaved(true); }} className={`flex items-center justify-center gap-2 rounded-full border py-4 text-xs uppercase tracking-[.15em] ${saved ? 'border-[#bd8250] bg-[#bd8250] text-[#f3eee4]' : 'border-[#f3eee4]/20'}`} data-testid="button-save-room">{saved ? <Check size={15} /> : null}{saved ? 'Room saved' : 'Save room'}</button><Link href={`/furniture/${selectedProduct.id}`} className="flex items-center justify-center gap-2 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]" data-testid="link-visualizer-product">View piece <ArrowUpRight size={15} /></Link></div></aside></div></div></main>;
}

type SessionUser = { uid: string; email: string | null; displayName: string | null };
type Order = { id: string; items: Product[]; total: number; createdAt: string; status: string };

function asCatalogProduct(product: Product): CatalogProduct {
  return { ...product, stock: productMeta(product).stock };
}

function AdminSignInPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result = await signIn(email, password);
    setBusy(false);
    if (result.user) setLocation('/admin');
    else setMessage(result.error || 'Please try again.');
  };

  return <main className="min-h-screen bg-[#b99a63] px-5 pb-28 pt-32 md:px-10 md:pt-44"><div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1fr_420px] lg:items-end"><div><p className="eyebrow">FurniVision / Staff access</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Run the<br /><em>whole room.</em></h1><p className="mt-7 max-w-sm text-sm leading-6 text-[#f3eee4]/65">Sign in with the Firebase account that has the admin claim to manage products, homepage content, and media.</p></div><div className="rounded-[1.5rem] bg-[#171512] p-7 text-[#f3eee4] md:p-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#bd8250]">Admin sign in</p>{!firebaseEnabled && <p className="mt-5 rounded-xl bg-[#26231f] p-3 text-xs leading-5 text-[#f3eee4]/65">Firebase is not configured. Add the six VITE_FIREBASE variables in Render before signing in.</p>}<form onSubmit={submit} className="mt-7 grid gap-6"><label className="text-xs uppercase tracking-[.13em]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" autoComplete="email" data-testid="input-admin-email" /></label><label className="text-xs uppercase tracking-[.13em]">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" autoComplete="current-password" data-testid="input-admin-password" /></label>{message && <p className="text-sm text-[#bd8250]" role="alert">{message}</p>}<button disabled={busy || !firebaseEnabled} className="flex items-center justify-center gap-2 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-admin-sign-in">{busy ? 'Signing in…' : 'Sign in as admin'} <ArrowUpRight size={15} /></button></form><button disabled={busy || !firebaseEnabled} onClick={async () => { setBusy(true); setMessage(''); const result = await signInWithGoogle(); setBusy(false); if (result.user) setLocation('/admin'); else setMessage(result.error || 'Please try again.'); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#f3eee4]/20 py-4 text-xs uppercase tracking-[.15em] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-admin-google-sign-in">Continue with Google</button><Link href="/account" className="mt-6 block text-center text-xs text-[#f3eee4]/55 underline decoration-[#bd8250] underline-offset-4" data-testid="link-admin-customer-account">Customer account sign in</Link></div></div></main>;
}

function AdminPage({ user }: { user: SessionUser | null }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [activePanel, setActivePanel] = useState<'overview' | 'products' | 'homepage' | 'settings'>('overview');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [siteDraft, setSiteDraft] = useState<SiteContent>(defaultSiteContent);
  const [draft, setDraft] = useState<Omit<CatalogProduct, 'id'>>({
    name: '', collection: 'Living room', price: 0, material: '', image: '/assets/hero-room.jpg',
    color: '#d8ddd3', description: '', dimensions: '', stock: 8, badge: '',
  });
  const fieldClass = 'mt-2 w-full rounded-xl border border-[#0b0b0a]/15 bg-[#f3eee4]/70 px-4 py-3 text-sm text-[#0b0b0a] outline-none transition-colors focus:border-[#0b0b0a]';
  const navClass = (panel: string) => activePanel === panel ? 'rounded-full bg-[#b99a63] px-4 py-2 text-[10px] uppercase tracking-[.14em] text-[#0b0b0a]' : 'rounded-full border border-[#f3eee4]/15 px-4 py-2 text-[10px] uppercase tracking-[.14em] text-[#f3eee4]/65 transition-colors hover:border-[#b99a63] hover:text-[#b99a63]';

  useEffect(() => {
    if (!user) { setAllowed(null); return; }
    let active = true;
    void (async () => {
      const isAdmin = await isCurrentUserAdmin();
      if (!active) return;
      setAllowed(isAdmin);
      if (!isAdmin) return;
      const [remoteCatalog, remoteContent] = await Promise.all([loadCatalog(), loadSiteContent()]);
      if (!active) return;
      setCatalog(remoteCatalog && remoteCatalog.length > 0 ? remoteCatalog : products.map(asCatalogProduct));
      if (remoteContent) setSiteDraft(remoteContent);
    })().catch(() => { if (active) { setAllowed(false); setMessage('We could not verify admin access.'); } });
    return () => { active = false; };
  }, [user?.uid]);

  const beginNew = () => {
    setEditingId(undefined);
    setDraft({ name: '', collection: 'Living room', price: 0, material: '', image: '/assets/hero-room.jpg', color: '#d8ddd3', description: '', dimensions: '', stock: 8, badge: '' });
    setMessage('');
  };
  const editProduct = (product: CatalogProduct) => {
    const { id, ...values } = product;
    setEditingId(id);
    setDraft(values);
    setActivePanel('products');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage('');
    try {
      const id = await saveCatalogProduct(editingId ? { ...draft, id: editingId } : draft);
      const saved = { ...draft, id };
      setCatalog((items) => editingId ? items.map((item) => item.id === id ? saved : item) : [saved, ...items]);
      setMessage(editingId ? 'Product updated and published.' : 'Product created and published.');
      window.dispatchEvent(new Event('furnivision-catalog-change'));
      setEditingId(id);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save this product.'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    setMessage('');
    try { await deleteCatalogProduct(id); setCatalog((items) => items.filter((item) => item.id !== id)); window.dispatchEvent(new Event('furnivision-catalog-change')); if (editingId === id) beginNew(); setMessage('Product deleted.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete this product.'); }
  };
  const uploadAsset = async (field: 'image' | 'heroVideo' | 'heroPoster', file?: File) => {
    if (!file) return;
    setUploading(field); setMessage('');
    try {
      const url = await uploadSiteAsset(file);
      if (field === 'image') setDraft((current) => ({ ...current, image: url }));
      else setSiteDraft((current) => ({ ...current, [field]: url }));
      setMessage('Asset uploaded. Save to publish it.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not upload this asset.'); }
    finally { setUploading(null); }
  };
  const saveHomepage = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage('');
    try { await saveSiteContent(siteDraft); setMessage('Homepage content published.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not publish homepage content.'); }
    finally { setSaving(false); }
  };

  if (!firebaseEnabled) return <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44"><div className="mx-auto max-w-[900px]"><p className="eyebrow">FurniVision / Admin</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em]">Admin<br /><em>offline.</em></h1><p className="mt-8 max-w-lg text-sm leading-6 text-[#f3eee4]/65">Firebase is not configured, so staff access, uploads, and publishing are unavailable. Add the variables from .env.example, then refresh this page.</p><Link href="/account" className="mt-8 inline-flex rounded-full bg-[#0b0b0a] px-6 py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]" data-testid="link-admin-account">Open account setup</Link></div></main>;
  if (!user) return <AdminSignInPage />;
  if (allowed === null) return <main className="flex min-h-screen items-center justify-center bg-[#b99a63] px-5 pt-24"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em]">Checking staff access…</p></main>;
  if (!allowed) return <main className="min-h-screen bg-[#0b0b0a] px-5 pb-28 pt-32 text-[#f3eee4] md:px-10 md:pt-44"><div className="mx-auto max-w-[900px]"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#b99a63]">FurniVision / Admin</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em]">Access<br /><em>denied.</em></h1><p className="mt-8 max-w-lg text-sm leading-6 text-[#f3eee4]/60">Your account does not have the Firebase <code className="text-[#b99a63]">admin</code> custom claim required to manage the storefront.</p><Link href="/account" className="mt-8 inline-flex rounded-full bg-[#b99a63] px-6 py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]" data-testid="link-admin-access-account">Return to account</Link></div></main>;

  return <main className="admin-shell min-h-screen bg-[#171512] px-5 pb-28 pt-28 text-[#f3eee4] md:px-10 md:pt-40"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-7 border-b border-[#f3eee4]/20 pb-8 md:flex-row md:items-end"><div><p className="eyebrow">FurniVision / Content studio</p><h1 className="mt-5 max-w-3xl font-display text-6xl leading-[.84] tracking-[-.06em] md:text-8xl">Control the<br /><em>whole room.</em></h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#f3eee4]/60">Publish products, imagery, homepage stories, and storefront messaging from one protected workspace.</p></div><div className="rounded-2xl border border-[#b99a63]/30 bg-[#b99a63]/10 px-4 py-3 text-xs text-[#b99a63]"><span className="font-mono-ui text-[9px] uppercase tracking-[.16em]">Publishing status</span><p className="mt-1 text-[#f3eee4]">Connected to Firebase</p></div></div>
    <nav className="mt-8 flex flex-wrap gap-2" aria-label="Admin sections"><button onClick={() => setActivePanel('overview')} className={navClass('overview')} data-testid="button-admin-overview">Overview</button><button onClick={() => setActivePanel('products')} className={navClass('products')} data-testid="button-admin-products">Products</button><button onClick={() => setActivePanel('homepage')} className={navClass('homepage')} data-testid="button-admin-homepage">Homepage & media</button><button onClick={() => setActivePanel('settings')} className={navClass('settings')} data-testid="button-admin-settings">Storefront settings</button></nav>
    {message && <div className="mt-6 rounded-xl border border-[#b99a63]/30 bg-[#b99a63]/10 px-4 py-3 text-sm text-[#b99a63]" role="status">{message}</div>}
    {activePanel === 'overview' && <section className="mt-10"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><article className="rounded-2xl bg-[#24231f] p-5"><p className="eyebrow">Catalog</p><p className="mt-5 font-display text-5xl">{catalog.length}</p><p className="mt-2 text-xs text-[#f3eee4]/55">published product records</p></article><article className="rounded-2xl bg-[#24231f] p-5"><p className="eyebrow">Media</p><p className="mt-5 font-display text-5xl">3</p><p className="mt-2 text-xs text-[#f3eee4]/55">homepage assets you control</p></article><article className="rounded-2xl bg-[#24231f] p-5"><p className="eyebrow">Access</p><p className="mt-5 font-display text-5xl">Admin</p><p className="mt-2 text-xs text-[#f3eee4]/55">Firebase claim verified</p></article><article className="rounded-2xl bg-[#b99a63] p-5 text-[#0b0b0a]"><p className="eyebrow">Next move</p><p className="mt-5 font-display text-3xl leading-[.9]">Make the next story.</p><button onClick={() => setActivePanel('homepage')} className="mt-5 border-b border-[#0b0b0a] pb-1 text-xs uppercase tracking-[.14em]" data-testid="button-admin-start-homepage">Edit homepage</button></article></div><div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-6 md:p-8"><p className="eyebrow">Workspace map</p><div className="mt-6 divide-y divide-[#f3eee4]/10"><button onClick={() => setActivePanel('products')} className="flex w-full items-center justify-between py-4 text-left"><span><strong className="font-display text-3xl">Products</strong><span className="mt-1 block text-xs text-[#f3eee4]/50">Photos, pricing, inventory, descriptions</span></span><ArrowRight size={17} /></button><button onClick={() => setActivePanel('homepage')} className="flex w-full items-center justify-between py-4 text-left"><span><strong className="font-display text-3xl">Homepage & media</strong><span className="mt-1 block text-xs text-[#f3eee4]/50">Hero film, headlines, announcement, footer</span></span><ArrowRight size={17} /></button><button onClick={() => setActivePanel('settings')} className="flex w-full items-center justify-between py-4 text-left"><span><strong className="font-display text-3xl">Storefront settings</strong><span className="mt-1 block text-xs text-[#f3eee4]/50">Publishing model, security, and live preview</span></span><ArrowRight size={17} /></button></div></section><section className="rounded-[1.5rem] bg-[#24231f] p-6 md:p-8"><p className="eyebrow">Safe publishing</p><p className="mt-6 text-xl leading-relaxed text-[#f3eee4]/75">Every save writes to Firebase. Product changes are protected by the admin claim, and uploaded site assets live in a separate protected storage path.</p><div className="mt-8 flex items-center gap-3 text-xs text-[#f3eee4]/55"><Check size={17} className="text-[#b99a63]" /> Public visitors can read published content</div><div className="mt-4 flex items-center gap-3 text-xs text-[#f3eee4]/55"><Check size={17} className="text-[#b99a63]" /> Only staff can publish or upload</div></section></div></section>}
    {activePanel === 'products' && <section className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr]"><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-5 md:p-7"><div className="flex items-end justify-between gap-4 border-b border-[#f3eee4]/15 pb-5"><div><p className="eyebrow">Catalog manager</p><h2 className="mt-3 font-display text-5xl">Your pieces</h2></div><button onClick={beginNew} className="rounded-full bg-[#b99a63] px-4 py-3 text-[10px] uppercase tracking-[.14em] text-[#0b0b0a]" data-testid="button-new-product">New product</button></div><div className="mt-4 divide-y divide-[#f3eee4]/10">{catalog.map((product) => <article key={product.id} className="flex items-center gap-3 py-4"><img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-display text-2xl">{product.name}</p><p className="mt-1 text-xs text-[#f3eee4]/50">{product.collection} / {formatPrice(product.price)} / {product.stock} in stock</p></div><button onClick={() => editProduct(product)} className="shrink-0 rounded-full border border-[#f3eee4]/20 px-3 py-2 text-[10px] uppercase tracking-[.12em]" data-testid={'button-edit-product-' + product.id}>Edit</button><button onClick={() => remove(product.id)} className="shrink-0 rounded-full border border-[#bd8250]/40 px-3 py-2 text-[10px] uppercase tracking-[.12em] text-[#bd8250]" data-testid={'button-delete-product-' + product.id}>Delete</button></article>)}</div></section><form onSubmit={save} className="h-fit rounded-[1.5rem] bg-[#b99a63] p-5 text-[#0b0b0a] md:p-7"><p className="eyebrow">{editingId ? 'Edit record' : 'New record'}</p><h2 className="mt-3 font-display text-5xl leading-[.9]">Shape a piece.</h2><div className="mt-6 grid gap-4"><label className="text-xs uppercase tracking-[.13em]">Name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={fieldClass} data-testid="input-admin-name" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">Collection<input required value={draft.collection} onChange={(event) => setDraft({ ...draft, collection: event.target.value })} className={fieldClass} data-testid="input-admin-collection" /></label><label className="text-xs uppercase tracking-[.13em]">Material<input required value={draft.material} onChange={(event) => setDraft({ ...draft, material: event.target.value })} className={fieldClass} data-testid="input-admin-material" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">Price<input required min="0" type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} className={fieldClass} data-testid="input-admin-price" /></label><label className="text-xs uppercase tracking-[.13em]">Stock<input required min="0" type="number" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} className={fieldClass} data-testid="input-admin-stock" /></label></div><label className="text-xs uppercase tracking-[.13em]">Product image URL<input required value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} className={fieldClass} data-testid="input-admin-image" /></label><label className="text-xs uppercase tracking-[.13em]">Or upload product image<input type="file" accept="image/*" onChange={(event) => void uploadAsset('image', event.target.files?.[0])} className="mt-2 block w-full text-xs" data-testid="input-admin-image-upload" />{uploading === 'image' && <span className="mt-1 block text-xs">Uploading…</span>}</label><label className="text-xs uppercase tracking-[.13em]">Description<textarea required value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={fieldClass + ' min-h-24 resize-y'} data-testid="input-admin-description" /></label><label className="text-xs uppercase tracking-[.13em]">Dimensions<input required value={draft.dimensions} onChange={(event) => setDraft({ ...draft, dimensions: event.target.value })} className={fieldClass} data-testid="input-admin-dimensions" /></label><label className="text-xs uppercase tracking-[.13em]">Badge / label<input value={draft.badge || ''} onChange={(event) => setDraft({ ...draft, badge: event.target.value })} className={fieldClass} placeholder="New, Limited, Best seller" data-testid="input-admin-badge" /></label><div className="flex gap-2"><button disabled={saving || uploading !== null} className="flex-1 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:opacity-50" data-testid="button-save-product">{saving ? 'Saving…' : editingId ? 'Update & publish' : 'Create & publish'}</button>{editingId && <button type="button" onClick={beginNew} className="rounded-full border border-[#0b0b0a]/25 px-4 py-3 text-xs uppercase tracking-[.15em]" data-testid="button-cancel-edit">Cancel</button>}</div></div></form></section>}
    {activePanel === 'homepage' && <form onSubmit={saveHomepage} className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-5 md:p-8"><p className="eyebrow">Homepage story</p><h2 className="mt-4 font-display text-5xl">Set the tone.</h2><div className="mt-7 grid gap-5"><label className="text-xs uppercase tracking-[.13em]">Hero eyebrow<input value={siteDraft.heroEyebrow} onChange={(event) => setSiteDraft({ ...siteDraft, heroEyebrow: event.target.value })} className={fieldClass + ' border-[#f3eee4]/15 bg-[#24231f] text-[#f3eee4]'} data-testid="input-admin-hero-eyebrow" /></label><label className="text-xs uppercase tracking-[.13em]">Hero title<textarea value={siteDraft.heroTitle} onChange={(event) => setSiteDraft({ ...siteDraft, heroTitle: event.target.value })} className={fieldClass + ' min-h-24 resize-y border-[#f3eee4]/15 bg-[#24231f] text-[#f3eee4] font-display text-3xl'} placeholder={'Make room\nfor feeling.'} data-testid="input-admin-hero-title" /><span className="mt-1 block text-[10px] normal-case tracking-normal text-[#f3eee4]/45">Use a new line to split the title across two lines.</span></label><label className="text-xs uppercase tracking-[.13em]">Hero supporting text<textarea value={siteDraft.heroBody} onChange={(event) => setSiteDraft({ ...siteDraft, heroBody: event.target.value })} className={fieldClass + ' min-h-24 resize-y border-[#f3eee4]/15 bg-[#24231f] text-[#f3eee4]'} data-testid="input-admin-hero-body" /></label><label className="text-xs uppercase tracking-[.13em]">Announcement bar text<input value={siteDraft.announcement} onChange={(event) => setSiteDraft({ ...siteDraft, announcement: event.target.value })} className={fieldClass + ' border-[#f3eee4]/15 bg-[#24231f] text-[#f3eee4]'} data-testid="input-admin-announcement" /></label><label className="text-xs uppercase tracking-[.13em]">Collection marquee<input value={siteDraft.marquee} onChange={(event) => setSiteDraft({ ...siteDraft, marquee: event.target.value })} className={fieldClass + ' border-[#f3eee4]/15 bg-[#24231f] text-[#f3eee4]'} data-testid="input-admin-marquee" /></label><label className="text-xs uppercase tracking-[.13em]">Footer note<input value={siteDraft.footerNote} onChange={(event) => setSiteDraft({ ...siteDraft, footerNote: event.target.value })} className={fieldClass + ' border-[#f3eee4]/15 bg-[#24231f] text-[#f3eee4]'} data-testid="input-admin-footer-note" /></label></div></section><section className="h-fit rounded-[1.5rem] bg-[#b99a63] p-5 text-[#0b0b0a] md:p-8"><p className="eyebrow">Hero media</p><h2 className="mt-4 font-display text-5xl leading-[.88]">Show, don’t<br />just tell.</h2><div className="mt-7 grid gap-5"><label className="text-xs uppercase tracking-[.13em]">Hero video URL<input value={siteDraft.heroVideo} onChange={(event) => setSiteDraft({ ...siteDraft, heroVideo: event.target.value })} className={fieldClass} data-testid="input-admin-hero-video" /></label><label className="text-xs uppercase tracking-[.13em]">Upload hero video<input type="file" accept="video/*" onChange={(event) => void uploadAsset('heroVideo', event.target.files?.[0])} className="mt-2 block w-full text-xs" data-testid="input-admin-hero-video-upload" />{uploading === 'heroVideo' && <span className="mt-1 block text-xs">Uploading…</span>}</label><label className="text-xs uppercase tracking-[.13em]">Hero poster URL<input value={siteDraft.heroPoster} onChange={(event) => setSiteDraft({ ...siteDraft, heroPoster: event.target.value })} className={fieldClass} data-testid="input-admin-hero-poster" /></label><label className="text-xs uppercase tracking-[.13em]">Upload hero poster<input type="file" accept="image/*" onChange={(event) => void uploadAsset('heroPoster', event.target.files?.[0])} className="mt-2 block w-full text-xs" data-testid="input-admin-hero-poster-upload" />{uploading === 'heroPoster' && <span className="mt-1 block text-xs">Uploading…</span>}</label><div className="overflow-hidden rounded-2xl bg-[#0b0b0a]/15"><video src={siteDraft.heroVideo} poster={siteDraft.heroPoster} muted loop autoPlay playsInline className="h-48 w-full object-cover" aria-label="Hero video preview" /></div><button disabled={saving || uploading !== null} className="rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:opacity-50" data-testid="button-save-homepage">{saving ? 'Publishing…' : 'Publish homepage changes'}</button></div></section></form>}
    {activePanel === 'settings' && <section className="mt-10 grid gap-8 lg:grid-cols-2"><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-6 md:p-8"><p className="eyebrow">Storefront settings</p><h2 className="mt-4 font-display text-5xl">Keep it considered.</h2><div className="mt-7 divide-y divide-[#f3eee4]/10"><div className="flex items-start justify-between gap-4 py-4"><span><strong className="text-sm">Theme</strong><span className="mt-1 block text-xs text-[#f3eee4]/50">Dark luxury / brass accent</span></span><span className="rounded-full border border-[#b99a63]/40 px-3 py-1 text-[9px] uppercase tracking-[.13em] text-[#b99a63]">Live</span></div><div className="flex items-start justify-between gap-4 py-4"><span><strong className="text-sm">Content source</strong><span className="mt-1 block text-xs text-[#f3eee4]/50">Firebase siteContent/home</span></span><span className="rounded-full border border-[#b99a63]/40 px-3 py-1 text-[9px] uppercase tracking-[.13em] text-[#b99a63]">Connected</span></div><div className="flex items-start justify-between gap-4 py-4"><span><strong className="text-sm">Asset source</strong><span className="mt-1 block text-xs text-[#f3eee4]/50">Protected Firebase Storage /site</span></span><span className="rounded-full border border-[#b99a63]/40 px-3 py-1 text-[9px] uppercase tracking-[.13em] text-[#b99a63]">Protected</span></div></div></section><section className="rounded-[1.5rem] bg-[#24231f] p-6 md:p-8"><p className="eyebrow">Live preview</p><h2 className="mt-4 font-display text-5xl">Check the room.</h2><p className="mt-6 max-w-md text-sm leading-6 text-[#f3eee4]/60">Open the public storefront in a new tab after publishing to review the customer experience on desktop and mobile.</p><Link href="/" className="mt-8 inline-flex rounded-full bg-[#b99a63] px-5 py-3 text-xs uppercase tracking-[.14em] text-[#0b0b0a]" data-testid="link-admin-preview">Preview storefront</Link><p className="mt-8 text-xs leading-5 text-[#f3eee4]/45">This workspace only exposes controls available through the current Firebase setup. Orders, customer accounts, and admin claims remain protected outside the public UI.</p></section></section>}
  </div></main>;
}

function AccountPage({ user, orders }: { user: SessionUser | null; orders: Order[] }) {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (user) {
    return (
      <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-[1180px]">
          <p className="eyebrow">FurniVision / Your account</p>
          <div className="mt-5 flex flex-col justify-between gap-8 border-b border-[#f3eee4]/20 pb-10 md:flex-row md:items-end">
            <div><h1 className="font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Make room<br /><em>for you.</em></h1><p className="mt-6 text-sm text-[#f3eee4]/60">{user.email}</p></div>
            <div className="flex flex-wrap gap-3 self-start"><Link href="/admin" className="rounded-full border border-[#f3eee4]/20 px-5 py-3 text-xs uppercase tracking-[.15em]" data-testid="link-account-admin">Admin workspace</Link><button onClick={async () => { await signOutUser(); setLocation('/'); }} className="rounded-full border border-[#f3eee4]/20 px-5 py-3 text-xs uppercase tracking-[.15em]" data-testid="button-sign-out">Sign out</button></div>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Link href="/wishlist" className="rounded-[1.25rem] bg-[#b99a63] p-6 transition-transform hover:-translate-y-1" data-testid="link-account-wishlist"><Heart size={20} /><p className="mt-10 font-display text-4xl">Saved pieces</p><p className="mt-2 text-sm text-[#f3eee4]/60">Your considered shortlist.</p></Link>
            <Link href="/saved-rooms" className="rounded-[1.25rem] bg-[#24231f] p-6 transition-transform hover:-translate-y-1" data-testid="link-account-rooms"><Move3d size={20} /><p className="mt-10 font-display text-4xl">Saved rooms</p><p className="mt-2 text-sm text-[#f3eee4]/60">Combinations worth returning to.</p></Link>
            <div className="rounded-[1.25rem] bg-[#0b0b0a] p-6 text-[#f3eee4]"><Box size={20} className="text-[#b99a63]" /><p className="mt-10 font-display text-4xl">Orders</p><p className="mt-2 text-sm text-[#f3eee4]/60">{orders.length ? `${orders.length} order${orders.length === 1 ? '' : 's'} in progress.` : 'Your first room is still ahead.'}</p></div>
          </div>
          {orders.length > 0 && <section className="mt-16"><div className="flex items-end justify-between border-b border-[#f3eee4]/15 pb-5"><div><p className="eyebrow">Order history</p><h2 className="mt-3 font-display text-5xl">The pieces<br /><em>on their way.</em></h2></div><span className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f3eee4]/50">{orders.length} orders</span></div><div className="mt-6 divide-y divide-[#192436]/15">{orders.map((order) => <article key={order.id} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#bd8250]">{new Date(order.createdAt).toLocaleDateString()} / {order.status}</p><p className="mt-2 font-display text-3xl">{order.items.map((item) => item.name).join(', ')}</p></div><p className="font-display text-2xl">{formatPrice(order.total)}</p></article>)}</div></section>}
        </div>
      </main>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result = mode === 'signin' ? await signIn(email, password) : await createAccount(email, password);
    setBusy(false);
    if (result.user) setLocation('/');
    else setMessage(result.error || 'Please try again.');
  };

  return (
    <main className="min-h-screen bg-[#b99a63] px-5 pb-28 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1fr_420px] lg:items-end">
        <div><p className="eyebrow">FurniVision / Customer account</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Keep the<br /><em>good stuff.</em></h1><p className="mt-7 max-w-sm text-sm leading-6 text-[#f3eee4]/65">Save pieces, hold onto room ideas, and keep your order history in one place.</p></div>
        <div className="rounded-[1.5rem] bg-[#171512] p-7 md:p-8">
          <div className="flex gap-5 border-b border-[#f3eee4]/15 pb-4"><button onClick={() => { setMode('signin'); setMessage(''); }} className={`font-mono-ui text-[10px] uppercase tracking-[.15em] ${mode === 'signin' ? 'text-[#bd8250]' : 'text-[#f3eee4]/45'}`} data-testid="button-account-sign-in">Sign in</button><button onClick={() => { setMode('create'); setMessage(''); }} className={`font-mono-ui text-[10px] uppercase tracking-[.15em] ${mode === 'create' ? 'text-[#bd8250]' : 'text-[#f3eee4]/45'}`} data-testid="button-account-create">Create account</button></div>
          {!firebaseEnabled && <p className="mt-5 rounded-xl bg-[#26231f] p-3 text-xs leading-5 text-[#f3eee4]/65">Browsing works in demo mode. Add the Firebase variables from .env.example to enable accounts and cloud sync.</p>}
          <form onSubmit={submit} className="mt-7 grid gap-6">
            <label className="text-xs uppercase tracking-[.13em]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" autoComplete="email" data-testid="input-account-email" /></label>
            <label className="text-xs uppercase tracking-[.13em]">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} data-testid="input-account-password" /></label>
            {message && <p className="text-sm text-[#bd8250]" role="alert">{message}</p>}
            <button disabled={busy || !firebaseEnabled} className="flex items-center justify-center gap-2 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-submit-account">{busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowUpRight size={15} /></button>
          </form>
          <button disabled={!firebaseEnabled} onClick={async () => { setBusy(true); const result = await signInWithGoogle(); setBusy(false); if (result.user) setLocation('/'); else setMessage(result.error || 'Please try again.'); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#f3eee4]/20 py-4 text-xs uppercase tracking-[.15em] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-google-account">Continue with Google</button>
        </div>
      </div>
    </main>
  );
}

function NotFound() {
  return <main className="flex min-h-screen items-center bg-[#0b0b0a] px-5 text-[#f3eee4]"><div className="mx-auto max-w-[1440px]"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#b99a63]">404 / Wrong room</p><h1 className="mt-6 font-display text-8xl leading-[.77] md:text-[12rem]">Nothing<br /><em>here.</em></h1><Link href="/" className="mt-10 inline-flex items-center gap-3 border-b border-[#b99a63] pb-2 text-xs uppercase tracking-[.16em]" data-testid="link-not-found-home">Return home <ArrowUpRight size={16} /></Link></div></main>;
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] overflow-auto bg-[#b99a63] p-6 page-reveal"><div className="flex items-center justify-between"><Logo /><button onClick={onClose} aria-label="Close menu" data-testid="button-close-menu"><X /></button></div><nav className="mt-24 grid gap-5 font-display text-6xl" onClick={onClose}><Link href="/furniture" data-testid="link-mobile-furniture">Furniture</Link><Link href="/bundles" data-testid="link-mobile-bundles">Room edits</Link><Link href="/wishlist" data-testid="link-mobile-wishlist">Wishlist</Link><Link href="/saved-rooms" data-testid="link-mobile-saved-rooms">Saved rooms</Link><Link href="/inspiration" data-testid="link-mobile-inspiration">Inspiration</Link><Link href="/design" data-testid="link-mobile-design">Visualize a room</Link></nav><div className="mt-12 border-t border-[#f3eee4]/20 pt-5"><p className="eyebrow">Shop by collection</p><div className="mt-4 grid gap-3 text-lg">{collectionPages.map((page) => <Link href={`/furniture/category/${page.slug}`} key={page.slug} data-testid={`link-mobile-collection-${page.slug}`}>{page.label}</Link>)}</div></div><p className="mt-14 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/55">FurniVision / New York</p></div>;
}

function App() {
  const [cartItems, setCartItems] = useState<Product[]>(() => readStored<Product[]>('furnivision-bag', []));
  const [bagOpen, setBagOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState<string[]>(() => readStored<string[]>('furnivision-wishlist', []));
  const [compared, setCompared] = useState<string[]>(() => readStored<string[]>('furnivision-compare', []));
  const [compareOpen, setCompareOpen] = useState(false);
  const [savedRooms, setSavedRooms] = useState<Array<{ room: string; selected: string; photo: string | null }>>(() => readStored('furnivision-rooms', []));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => readStored('furnivision-orders', []));
  const [userDataReady, setUserDataReady] = useState(false);
  const [location, setLocation] = useLocation();
  const [, setCatalogVersion] = useState(0);
  useEffect(() => { document.title = 'FurniVision — Furniture for the everyday extraordinary'; }, []);
  useEffect(() => {
    let active = true;
    const refreshCatalog = async () => {
      if (!firebaseEnabled) return;
      const remoteCatalog = await loadCatalog();
      if (!active || !remoteCatalog || remoteCatalog.length === 0) return;
      products.splice(0, products.length, ...remoteCatalog.map((item) => ({ ...item })));
      setCatalogVersion((version) => version + 1);
    };
    void refreshCatalog().catch(() => undefined);
    const handleCatalogChange = () => { void refreshCatalog().catch(() => undefined); };
    window.addEventListener('furnivision-catalog-change', handleCatalogChange);
    return () => { active = false; window.removeEventListener('furnivision-catalog-change', handleCatalogChange); };
  }, []);
  useEffect(() => subscribeToAuth((nextUser) => {
    setUser(nextUser ? { uid: nextUser.uid, email: nextUser.email, displayName: nextUser.displayName } : null);
  }), []);
  useEffect(() => {
    if (!user) {
      setUserDataReady(false);
      return;
    }
    let active = true;
    setUserDataReady(false);
    Promise.all([
      fetchCollection<{ id: string }>(user.uid, 'wishlist'),
      fetchCollection<{ room: string; selected: string; photo: string | null }>(user.uid, 'savedRooms'),
      fetchCollection<Order>(user.uid, 'orders'),
    ]).then(([remoteWishlist, remoteRooms, remoteOrders]) => {
      if (!active) return;
      if (remoteWishlist) setLiked(remoteWishlist.map((item) => item.id));
      if (remoteRooms) setSavedRooms(remoteRooms);
      if (remoteOrders) setOrders(remoteOrders);
      setUserDataReady(true);
    }).catch(() => {
      if (active) setUserDataReady(true);
    });
    return () => { active = false; };
  }, [user?.uid]);
  useEffect(() => { window.localStorage.setItem('furnivision-bag', JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { window.localStorage.setItem('furnivision-wishlist', JSON.stringify(liked)); }, [liked]);
  useEffect(() => { if (user && userDataReady) void syncCollection(user.uid, 'wishlist', liked.map((id) => ({ id }))); }, [liked, user, userDataReady]);
  useEffect(() => {
    const syncWishlist = () => setLiked(readStored<string[]>('furnivision-wishlist', []));
    window.addEventListener('furnivision-wishlist-change', syncWishlist);
    return () => window.removeEventListener('furnivision-wishlist-change', syncWishlist);
  }, []);
  useEffect(() => { window.localStorage.setItem('furnivision-compare', JSON.stringify(compared)); }, [compared]);
  useEffect(() => { window.localStorage.setItem('furnivision-rooms', JSON.stringify(savedRooms)); }, [savedRooms]);
  useEffect(() => { if (user && userDataReady) void syncCollection(user.uid, 'savedRooms', savedRooms.map((room, index) => ({ ...room, id: `${room.room}-${room.selected}-${index}` }))); }, [savedRooms, user, userDataReady]);
  useEffect(() => { window.localStorage.setItem('furnivision-orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { if (user && userDataReady) void syncCollection(user.uid, 'orders', orders); }, [orders, user, userDataReady]);
  const addToCart = (product: Product) => { setCartItems((items) => [...items, product]); setBagOpen(true); };
  const removeFromCart = (id: string) => { setCartItems((items) => { const index = items.findIndex((item) => item.id === id); return index === -1 ? items : [...items.slice(0, index), ...items.slice(index + 1)]; }); };
  const incrementCart = (id: string) => setCartItems((items) => { const product = items.find((item) => item.id === id); return product ? [...items, product] : items; });
  const decrementCart = (id: string) => removeFromCart(id);
  const clearCart = () => {
    if (cartItems.length > 0) {
      const order: Order = {
        id: `order-${Date.now()}`,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.price, 0),
        createdAt: new Date().toISOString(),
        status: 'Processing',
      };
      setOrders((current) => [order, ...current]);
    }
    setCartItems([]);
  };
  useEffect(() => {
    const syncCart = (event: Event) => {
      const detail = (event as CustomEvent<{ type: string; id?: string }>).detail;
      if (detail.type === 'increment' && detail.id) incrementCart(detail.id);
      if (detail.type === 'decrement' && detail.id) decrementCart(detail.id);
      if (detail.type === 'clear') clearCart();
    };
    window.addEventListener('furnivision-cart-change', syncCart);
    return () => window.removeEventListener('furnivision-cart-change', syncCart);
  }, []);
  const toggleLike = (id: string) => setLiked((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const toggleCompare = (id: string) => setCompared((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 3 ? [...items, id] : items);
  const compareProducts = products.filter((product) => compared.includes(product.id));
  const saveRoom = (room: string, selected: string, photo: string | null) => setSavedRooms((rooms) => [...rooms, { room, selected, photo }]);
  if (location === '/admin') return <div className="grain min-h-[100dvh]"><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} userLabel={user?.displayName || user?.email?.split('@')[0]} /><AdminPage user={user} /><Footer /><BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} items={cartItems} onRemove={removeFromCart} /><MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} /></div>;
  if (location === '/account') return <div className="grain min-h-[100dvh]"><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} userLabel={user?.displayName || user?.email?.split('@')[0]} /><AccountPage user={user} orders={orders} /><Footer /><BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} items={cartItems} onRemove={removeFromCart} /><MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} /></div>;
  return <div className="grain min-h-[100dvh]"><Switch><Route path="/"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><Home onAdd={addToCart} liked={liked} onLike={toggleLike} compared={compared} onCompare={toggleCompare} /><Footer /></></Route><Route path="/furniture"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><FurniturePage onAdd={addToCart} liked={liked} onLike={toggleLike} compared={compared} onCompare={toggleCompare} /><Footer /></></Route><Route path="/furniture/category/:categorySlug"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><CollectionPage onAdd={addToCart} liked={liked} onLike={toggleLike} compared={compared} onCompare={toggleCompare} /><Footer /></></Route><Route path="/furniture/:productId"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><ProductPage onAdd={addToCart} /><Footer /></></Route><Route path="/wishlist"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><WishlistPage onAdd={addToCart} liked={liked} onLike={toggleLike} compared={compared} onCompare={toggleCompare} /><Footer /></></Route><Route path="/saved-rooms"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><SavedRoomsPage rooms={savedRooms} /><Footer /></></Route><Route path="/bundles"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><BundlesPage onAdd={addToCart} /><Footer /></></Route><Route path="/checkout"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><CheckoutPage items={cartItems} onRemove={removeFromCart} /><Footer /></></Route><Route path="/inspiration"><><Header light cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><InspirationPage /><Footer /></></Route><Route path="/design"><><Header cartCount={cartItems.length} onCart={() => setBagOpen(true)} onMenu={() => setMenuOpen(true)} /><DesignPage onSaveRoom={saveRoom} /><Footer /></></Route><Route component={NotFound} /></Switch><BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} items={cartItems} onRemove={removeFromCart} /><CompareTray items={compareProducts} open={compareOpen} onToggle={() => setCompareOpen((open) => !open)} onRemove={toggleCompare} /><MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} /></div>;
}

export default App;