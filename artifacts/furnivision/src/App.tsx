import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type Dispatch, type FormEvent, type PointerEvent, type SetStateAction } from 'react';
import { ArrowDownRight, ArrowRight, ArrowRightLeft, ArrowUpRight, Box, Check, ChevronDown, ChevronLeft, ClipboardList, Eye, Heart, Image, Instagram, LayoutDashboard, LogOut, Menu, Move3d, Package, Pause, Play, Plus, RefreshCw, RotateCcw, Ruler, Search, Settings2, ShoppingBag, Sparkles, Star, Store, Truck, Upload, UserRound, UsersRound, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { createAccount, ensureFirstUserAdmin, isCurrentUserAdmin, signIn, signInWithGoogle, signOutUser, subscribeToAuth } from './lib/auth';
import { deleteCatalogProduct, loadCatalog, saveCatalogProduct, type CatalogProduct } from './lib/admin';
import { firebaseEnabled } from './lib/firebase';
import { fetchCollection, removeCollectionItem, syncCollection } from './lib/persistence';
import { uploadRoomPhoto } from './lib/room-storage';
import { defaultSiteContent, loadSiteContent, saveSiteContent, type SiteContent } from './lib/site-content';
import { uploadSiteAsset } from './lib/site-storage';
import { cancelCustomerOrder, loadAllOrders, orderStatuses, saveCustomerOrder, saveDeliveryProof, updateCustomerOrder, updateOrderStatus, uploadDeliveryProof, type CustomerDetails, type StoreOrder } from './lib/orders';
import { RedesignedStorefront } from './RedesignedStorefront';

export type Product = {
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

export const products: Product[] = [
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

const baseProducts = products.map((product) => ({ ...product }));

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
             <div className="order-1 overflow-hidden rounded-[1.5rem]">
               <InteractiveProductStage product={{ ...product, image: activeImage }} rotation={rotation} onRotationChange={setRotation} autoRotate={false} />
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
    <Link href="/" className="brand-mark group inline-flex items-baseline gap-0.5" data-testid="link-logo">
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
    <header className={`site-header absolute left-0 right-0 top-0 z-40 px-5 py-5 md:px-10 md:py-7 ${light ? 'text-[#f3eee4]' : 'text-[#f3eee4]'}`}>
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
    <footer className="site-footer bg-[#0b0b0a] px-5 pb-8 pt-16 text-[#f3eee4] md:px-10 md:pt-24">
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
              <Link href="/wishlist" className="hover:text-[#b99a63]" data-testid="link-footer-wishlist">Wishlist</Link>
              <Link href="/saved-rooms" className="hover:text-[#b99a63]" data-testid="link-footer-saved-rooms">Saved rooms</Link>
              <Link href="/inspiration" className="hover:text-[#b99a63]" data-testid="link-footer-inspiration">Room stories</Link>
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
    <article className="product-card tilt-card group relative perspective" onPointerMove={handlePointerMove} onPointerLeave={resetPointer} onPointerCancel={resetPointer} style={pointerActive ? { transform: `translate3d(0, -10px, 0) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` } : undefined} data-testid={`card-product-${product.id}`}>
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

function InteractiveProductStage({ product, compact = false, rotation, onRotationChange, autoRotate = true }: {
  product: Product;
  compact?: boolean;
  rotation?: number;
  onRotationChange?: (value: number) => void;
  autoRotate?: boolean;
}) {
  const [stageRotation, setStageRotation] = useState(rotation ?? 0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const currentRotation = rotation ?? stageRotation;
  const setRotation = (value: number | ((current: number) => number)) => {
    const next = typeof value === 'function' ? value(currentRotation) : value;
    setStageRotation(next);
    onRotationChange?.(next);
  };

  useEffect(() => {
    if (!autoRotate || dragging || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setStageRotation((current) => current + 0.18), 32);
    return () => window.clearInterval(timer);
  }, [autoRotate, dragging]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: Number((-y * 7).toFixed(2)), y: Number((x * 9).toFixed(2)) });
    if (dragging) setRotation((current) => current + event.movementX * 0.65);
  };

  const resetTilt = () => {
    setDragging(false);
    setTilt({ x: 0, y: 0 });
  };

  const stageStyle = {
    '--stage-rotate': `${currentRotation}deg`,
    '--stage-tilt-x': `${tilt.x}deg`,
    '--stage-tilt-y': `${tilt.y}deg`,
  } as CSSProperties;

  return (
    <div
      className={`product-stage ${compact ? 'product-stage--compact' : ''}`}
      style={stageStyle}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={resetTilt}
      onPointerCancel={resetTilt}
      onPointerLeave={() => { if (!dragging) setTilt({ x: 0, y: 0 }); }}
      role="img"
      aria-label={`${product.name} interactive 3D product view`}
    >
      <div className="product-stage__ambient" />
      <div className="product-stage__grid" />
      <div className="product-stage__orbit product-stage__orbit--one" />
      <div className="product-stage__orbit product-stage__orbit--two" />
      <div className="product-stage__object">
        <div className="product-stage__shadow" />
        <div className="product-stage__backdrop" />
        <img src={product.image} alt="" draggable="false" />
        <div className="product-stage__sheen" />
      </div>
      <div className="product-stage__hud product-stage__hud--top">
        <span><span className="product-stage__status-dot" /> Live object study</span>
        <span className="product-stage__hud-index">FV / 3D</span>
      </div>
      <div className="product-stage__hud product-stage__hud--bottom">
        <span>Drag to orbit</span>
        <span className="product-stage__controls">
          <button type="button" onClick={(event) => { event.stopPropagation(); setRotation((current) => current - 30); }} aria-label="Rotate product left">−</button>
          <span>{Math.round(((currentRotation % 360) + 360) % 360)}°</span>
          <button type="button" onClick={(event) => { event.stopPropagation(); setRotation((current) => current + 30); }} aria-label="Rotate product right">+</button>
        </span>
      </div>
      {!compact && <div className="product-stage__hotspot product-stage__hotspot--one"><span /> Hand-finished edge</div>}
      {!compact && <div className="product-stage__hotspot product-stage__hotspot--two"><span /> Tactile materials</div>}
    </div>
  );
}

function ImmersiveStory({ product }: { product: Product }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      setProgress(Math.max(0, Math.min(1, -rect.top / range)));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  const storyStyle = { '--story-progress': progress } as CSSProperties;
  return (
    <section ref={sectionRef} className="immersive-story" style={storyStyle}>
      <div className="immersive-story__sticky">
        <div className="immersive-story__stage">
          <InteractiveProductStage product={product} rotation={progress * 140 - 55} autoRotate={false} />
        </div>
        <div className="immersive-story__copy">
          <div className={`immersive-story__chapter ${progress < .34 ? 'is-active' : ''}`}>
            <p className="eyebrow">01 / The silhouette</p>
            <h2>Made to change the room around it.</h2>
            <p>A low, generous profile with a little tension in the curve. The first thing you notice is the shape. The second is how naturally everything else settles around it.</p>
          </div>
          <div className={`immersive-story__chapter ${progress >= .34 && progress < .68 ? 'is-active' : ''}`}>
            <p className="eyebrow">02 / The material</p>
            <h2>Texture you can feel from across the room.</h2>
            <p>{product.material} chosen for the way it catches a changing day — soft in the morning, warmer after dark, better with a little life on it.</p>
          </div>
          <div className={`immersive-story__chapter ${progress >= .68 ? 'is-active' : ''}`}>
            <p className="eyebrow">03 / The point of view</p>
            <h2>{product.name} is not background.</h2>
            <p>It is the anchor, the pause, the place your eye returns to. Turn it, live with it, and find the angle that feels like yours.</p>
          </div>
        </div>
        <div className="immersive-story__progress"><span /></div>
      </div>
    </section>
  );
}

function Marquee({ text = defaultSiteContent.marquee }: { text?: string }) {
  return <div className="overflow-hidden border-y border-[#f3eee4]/15 py-4 font-mono-ui text-[10px] uppercase tracking-[.24em] text-[#f3eee4]/60"><div className="marquee-track flex w-max"><span className="flex items-center gap-8 pr-8">{text} <i className="h-1.5 w-1.5 rounded-full bg-[#bd8250]" /> {text} <i className="h-1.5 w-1.5 rounded-full bg-[#b99a63]" /> {text}</span><span className="flex items-center gap-8 pr-8">{text} <i className="h-1.5 w-1.5 rounded-full bg-[#bd8250]" /> {text} <i className="h-1.5 w-1.5 rounded-full bg-[#b99a63]" /> {text}</span></div></div>;
}

function Home({ onAdd, liked, onLike, compared, onCompare }: { onAdd: (product: Product) => void; liked: string[]; onLike: (id: string) => void; compared: string[]; onCompare: (id: string) => void }) {
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  useEffect(() => {
    if (!firebaseEnabled) return;
    void loadSiteContent().then((content) => { if (content) setSiteContent(content); }).catch(() => undefined);
  }, []);
  const featured = products.slice(0, 4);
  const categoryTiles = [
    { label: 'Living room', slug: 'living-room', image: '/assets/hero-room.jpg', note: 'Soft landings' },
    { label: 'Bedroom', slug: 'beds', image: '/assets/nest-bed.jpg', note: 'Quiet mornings' },
    { label: 'Dining', slug: 'dining-tables', image: '/assets/mesa-dining-table.jpg', note: 'Gather well' },
    { label: 'Lighting', slug: 'lighting', image: '/assets/frame-65.jpg', note: 'Warm the room' },
  ];
  return (
    <main className="site-main">
      <section className="home-hero">
        <div className="home-hero__glow home-hero__glow--one" />
        <div className="home-hero__glow home-hero__glow--two" />
        <div className="home-hero__inner">
          <div className="home-hero__copy page-reveal">
            <p className="eyebrow">{siteContent.heroEyebrow || 'Furniture for the everyday extraordinary'}</p>
            <h1>Make room<br /><em>for feeling.</em></h1>
            <p className="home-hero__body">{siteContent.heroBody || 'A considered collection of pieces that leave space for your life to happen around them.'}</p>
            <div className="home-hero__actions">
              <Link href="/furniture" className="button button--primary" data-testid="link-hero-shop">Shop the collection <ArrowUpRight size={16} /></Link>
              <Link href="#featured" className="button button--quiet" data-testid="link-hero-scene">Explore new arrivals <ArrowDownRight size={16} /></Link>
            </div>
            <div className="home-hero__stats" aria-label="FurniVision highlights">
              <div><strong>01</strong><span>Thoughtful pieces</span></div>
              <div><strong>02</strong><span>Made to live with</span></div>
              <div><strong>03</strong><span>White-glove delivery</span></div>
            </div>
          </div>
          <div className="home-hero__visual glass-panel page-reveal delay-2">
            <div className="hero-art"><img src="/assets/hero-room.jpg" alt="A calm, layered living room with sculptural furniture" /></div>
            <div className="hero-art__wash" />
            <div className="hero-art__label"><span>01 / 04</span><span>Live beautifully</span></div>
            <div className="hero-feature-card glass-panel"><span className="eyebrow">Featured piece</span><strong>{products[0].name}</strong><span>{formatPrice(products[0].price)} <ArrowUpRight size={14} /></span></div>
            <div className="hero-orbit hero-orbit--one" />
            <div className="hero-orbit hero-orbit--two" />
          </div>
        </div>
      </section>
      <Marquee text={siteContent.marquee || defaultSiteContent.marquee} />
      <section className="section-wrap section-wrap--categories">
        <div className="section-heading"><div><p className="eyebrow">Shop by mood</p><h2>Find your <em>room.</em></h2></div><Link href="/furniture" className="text-link">View all pieces <ArrowUpRight size={15} /></Link></div>
        <div className="category-grid">{categoryTiles.map((tile, index) => <Link key={tile.slug} href={'/furniture/category/' + tile.slug} className={'category-card category-card--' + (index + 1)}><img src={tile.image} alt={tile.label} /><div className="category-card__shade" /><div className="category-card__copy"><span>{tile.note}</span><strong>{tile.label}</strong><ArrowUpRight size={16} /></div></Link>)}</div>
      </section>
      <section id="featured" className="section-wrap section-wrap--featured">
        <div className="section-heading"><div><p className="eyebrow">The considered edit</p><h2>New arrivals, <em>well chosen.</em></h2></div><Link href="/furniture" className="text-link">Browse the full collection <ArrowUpRight size={15} /></Link></div>
        <div className="featured-grid">{featured.map((product) => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} compared={compared.includes(product.id)} onLike={() => onLike(product.id)} onCompare={() => onCompare(product.id)} onAdd={() => onAdd(product)} />)}</div>
      </section>
      <section className="editorial-section section-wrap">
        <div className="editorial-image glass-panel"><img src="/assets/atelier-kitchen.jpg" alt="Tactile materials and considered kitchen storage" /></div>
        <div className="editorial-copy"><p className="eyebrow">Design, made livable</p><h2>Good rooms leave<br /><em>space for you.</em></h2><p>We choose honest materials, comfortable proportions, and details that get better with time. Nothing extra. Everything intentional.</p><Link href="/inspiration" className="button button--outline">See our room stories <ArrowUpRight size={16} /></Link></div>
      </section>
      <section className="trust-strip section-wrap"><div><span className="trust-icon"><Truck size={18} /></span><strong>White-glove delivery</strong><span>Handled with care, from our studio to your door.</span></div><div><span className="trust-icon"><Sparkles size={18} /></span><strong>Made to last</strong><span>Materials and makers chosen for everyday life.</span></div><div><span className="trust-icon"><Heart size={18} /></span><strong>Easy to love</strong><span>Pieces with presence, never too much noise.</span></div></section>
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
          <div className="flex flex-col justify-end rounded-[1.5rem] p-7" style={{ backgroundColor: page.accent }}><p className="eyebrow">The point of view</p><p className="mt-5 max-w-sm font-display text-4xl leading-[.9]">The room starts with one piece that knows where to land.</p></div>
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
      <div className="mx-auto max-w-[1440px]"><p className="eyebrow">FurniVision / Saved rooms</p><div className="mt-5 flex flex-col justify-between gap-6 border-b border-[#f3eee4]/20 pb-10 md:flex-row md:items-end"><h1 className="font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Rooms<br /><em>to return to.</em></h1><p className="max-w-xs text-sm leading-6 text-[#f3eee4]/60">Keep the combinations that feel right, then come back when the room is ready.</p></div>{rooms.length > 0 ? <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rooms.map((savedRoom, index) => { const product = products.find((item) => item.id === savedRoom.selected) || products[0]; return <article className="overflow-hidden rounded-[1.5rem] bg-[#b99a63]" key={`${savedRoom.room}-${savedRoom.selected}-${index}`}><div className="relative aspect-[1.2] overflow-hidden"><img src={savedRoom.photo || product.image} alt={`${savedRoom.room} with ${product.name}`} className="h-full w-full object-cover mix-blend-multiply" /><span className="absolute left-5 top-5 rounded-full bg-[#171512]/85 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-[.15em]">Saved room / {index + 1}</span></div><div className="p-6"><p className="eyebrow">{savedRoom.room}</p><h2 className="mt-3 font-display text-4xl">{product.name}</h2><span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[.14em] text-[#b96f52]">Saved arrangement</span></div></article>; })}</div> : <div className="flex flex-col items-center py-28 text-center"><Move3d size={28} strokeWidth={1.2} className="text-[#bd8250]" /><h2 className="mt-6 font-display text-5xl">Your rooms are still becoming.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-[#f3eee4]/60">Your saved room combinations will appear here.</p></div>}</div>
    </main>
  );
}

function CheckoutPage({ items, user, onRemove, onOrder, onIncrement = (id) => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'increment', id } })), onDecrement = (id) => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'decrement', id } })), onClear = () => window.dispatchEvent(new CustomEvent('furnivision-cart-change', { detail: { type: 'clear' } })) }: { items: Product[]; user: SessionUser | null; onRemove: (id: string) => void; onOrder: (customer: CustomerDetails) => Promise<void>; onIncrement?: (id: string) => void; onDecrement?: (id: string) => void; onClear?: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');
  const total = items.reduce((sum, item) => sum + item.price, 0);
  if (submitted) return <main className="flex min-h-screen items-center justify-center bg-[#b99a63] px-5 py-32 text-center"><div><Check className="mx-auto h-12 w-12" strokeWidth={1.1} /><p className="eyebrow mt-8">Order received / 001</p><h1 className="mt-5 font-display text-7xl leading-[.78] tracking-[-.06em] md:text-[9rem]">A room<br /><em>is coming.</em></h1><p className="mx-auto mt-7 max-w-sm text-sm leading-6 text-[#f3eee4]/65">We’ll send a confirmation and delivery window to your inbox. Thank you for choosing pieces with a point of view.</p><Link href="/" className="mt-8 inline-flex rounded-full bg-[#0b0b0a] px-6 py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]" data-testid="link-order-home">Return home</Link></div></main>;
  return (
      <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44">
       <div className="mx-auto max-w-[1180px]"><Link href="/furniture" className="inline-flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/60"><ChevronLeft size={14} /> Continue shopping</Link><div className="mt-8 grid gap-12 lg:grid-cols-[1fr_360px]"><div><p className="eyebrow">FurniVision / Checkout</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Make it<br /><em>yours.</em></h1>{items.length === 0 ? <div className="mt-12 rounded-[1.25rem] bg-[#b99a63] p-8"><p className="font-display text-4xl">Your bag is waiting.</p><Link href="/furniture" className="mt-6 inline-flex border-b border-[#f3eee4] pb-2 text-xs uppercase tracking-[.15em]" data-testid="link-checkout-empty-shop">Browse the collection <ArrowUpRight size={14} /></Link></div> : <form onSubmit={async (event) => { event.preventDefault(); setPlacing(true); setMessage(''); const form = event.currentTarget; try { const data = new FormData(form); await onOrder({ firstName: String(data.get('firstName') || ''), lastName: String(data.get('lastName') || ''), email: String(data.get('email') || ''), address: String(data.get('address') || ''), city: String(data.get('city') || ''), deliveryWindow: String(data.get('deliveryWindow') || '') }); setSubmitted(true); onClear(); } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not place this order. Please try again.'); } finally { setPlacing(false); } }} className="mt-12 grid gap-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">First name<input required name="firstName" autoComplete="given-name" aria-label="First name" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><label className="text-xs uppercase tracking-[.13em]">Last name<input required name="lastName" autoComplete="family-name" aria-label="Last name" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label></div><label className="text-xs uppercase tracking-[.13em]">Email<input required name="email" type="email" autoComplete="email" aria-label="Email" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><label className="text-xs uppercase tracking-[.13em]">Delivery address<input required name="address" autoComplete="street-address" aria-label="Delivery address" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">City<input required name="city" autoComplete="address-level2" aria-label="City" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" /></label><label className="text-xs uppercase tracking-[.13em]">Preferred delivery<select required name="deliveryWindow" aria-label="Preferred delivery window" className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none"><option value="">Choose a window</option><option>Weekday morning</option><option>Weekday afternoon</option><option>Saturday</option></select></label></div>{!user && <div className="rounded-xl border border-[#b99a63]/30 bg-[#b99a63]/10 p-4 text-sm leading-6 text-[#f3eee4]/70">Sign in before placing an order so your delivery details can be securely tracked from the admin delivery queue. <Link href="/account" className="text-[#b99a63] underline underline-offset-4">Sign in</Link></div>}{message && <p className="text-sm text-[#bd8250]" role="alert">{message}</p>}<button disabled={placing || !user} className="mt-4 flex items-center justify-center gap-3 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:opacity-60" data-testid="button-place-order">{placing ? 'Preparing your order' : user ? 'Place order' : 'Sign in to place order'} {!placing && <ArrowUpRight size={15} />}</button></form>}</div><aside className="h-fit rounded-[1.5rem] bg-[#0b0b0a] p-6 text-[#f3eee4] md:p-7"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#b99a63]">Order summary / {items.length}</p><div className="mt-6 divide-y divide-[#f2eee6]/15">{groupCartItems(items).map(({ product, quantity }) => <div className="flex gap-3 py-4 first:pt-0" key={product.id}><img src={product.image} alt="" className="h-16 w-16 rounded-lg object-cover" /><div className="flex-1"><p className="font-display text-2xl">{product.name}</p><p className="mt-1 text-xs text-[#f3eee4]/55">{product.material}</p><div className="mt-3 flex items-center gap-2 rounded-full border border-[#f3eee4]/20 w-fit"><button type="button" onClick={() => onDecrement(product.id)} className="flex h-7 w-7 items-center justify-center" aria-label={`Decrease ${product.name} quantity`} data-testid={`button-checkout-decrease-${product.id}`}>−</button><span className="w-5 text-center font-mono-ui text-[10px]">{quantity}</span><button type="button" onClick={() => onIncrement(product.id)} className="flex h-7 w-7 items-center justify-center" aria-label={`Increase ${product.name} quantity`} data-testid={`button-checkout-increase-${product.id}`}><Plus size={11} /></button></div></div><div className="text-right text-sm">{formatPrice(product.price * quantity)}<button type="button" onClick={() => onRemove(product.id)} className="mt-2 block text-[9px] uppercase tracking-[.13em] text-[#b99a63]" data-testid={`button-checkout-remove-${product.id}`}>Remove</button></div></div>)}</div><div className="mt-5 flex justify-between border-t border-[#f3eee4]/15 pt-5 font-display text-3xl"><span>Total</span><span>{formatPrice(total)}</span></div><p className="mt-2 text-xs leading-5 text-[#f3eee4]/55">White-glove delivery is included. Your preferred window will be confirmed after order review.</p></aside></div></div>
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


type SessionUser = { uid: string; email: string | null; displayName: string | null };
type Order = StoreOrder;

function asCatalogProduct(product: Product): CatalogProduct {
  return { ...product, stock: productMeta(product).stock };
}

function mergeCatalogProducts(remoteCatalog: CatalogProduct[] | null) {
  const defaults = baseProducts.map(asCatalogProduct);
  const remoteById = new Map((remoteCatalog || []).map((product) => [product.id, product]));
  const defaultIds = new Set(defaults.map((product) => product.id));
  return [
    ...defaults.map((product) => ({ ...product, ...remoteById.get(product.id) })),
    ...(remoteCatalog || []).filter((product) => !defaultIds.has(product.id)),
  ];
}

function AdminSignInPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const routeStaffUser = async (user: Pick<SessionUser, 'uid'>) => {
    await ensureFirstUserAdmin(user);
    if (await isCurrentUserAdmin()) setLocation('/admin');
    else { await signOutUser(); setMessage('This account is not an admin.'); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result = await signIn(email, password);
    setBusy(false);
    if (result.user) {
      try { await routeStaffUser(result.user); }
      catch { await signOutUser(); setMessage('We could not verify staff access. Please try again.'); }
    } else setMessage(result.error || 'Please try again.');
  };

  return <main className="min-h-screen bg-[#b99a63] px-5 pb-28 pt-32 md:px-10 md:pt-44"><div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1fr_420px] lg:items-end"><div><p className="eyebrow">FurniVision / Staff access</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Run the<br /><em>whole room.</em></h1><p className="mt-7 max-w-sm text-sm leading-6 text-[#f3eee4]/65">Store admins use this secure sign-in to manage the complete catalog and delivery queue.</p></div><div className="rounded-[1.5rem] bg-[#171512] p-7 text-[#f3eee4] md:p-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#bd8250]">Staff sign in</p>{!firebaseEnabled && <p className="mt-5 rounded-xl bg-[#26231f] p-3 text-xs leading-5 text-[#f3eee4]/65">Firebase is not configured. Add the six VITE_FIREBASE variables in Render before signing in.</p>}<form onSubmit={submit} className="mt-7 grid gap-6"><label className="text-xs uppercase tracking-[.13em]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" autoComplete="email" data-testid="input-admin-email" /></label><label className="text-xs uppercase tracking-[.13em]">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none focus:border-[#bd8250]" autoComplete="current-password" data-testid="input-admin-password" /></label>{message && <p className="text-sm text-[#bd8250]" role="alert">{message}</p>}<button disabled={busy || !firebaseEnabled} className="flex items-center justify-center gap-2 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-admin-sign-in">{busy ? 'Checking access…' : 'Sign in'} <ArrowUpRight size={15} /></button></form><button disabled={busy || !firebaseEnabled} onClick={async () => { setBusy(true); setMessage(''); const result = await signInWithGoogle(); if (result.user) { try { await routeStaffUser(result.user); } catch { await signOutUser(); setMessage('We could not verify staff access. Please try again.'); } } else setMessage(result.error || 'Please try again.'); setBusy(false); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#f3eee4]/20 py-4 text-xs uppercase tracking-[.15em] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-admin-google-sign-in">Continue with Google</button><Link href="/account" className="mt-6 block text-center text-xs text-[#f3eee4]/55 underline decoration-[#bd8250] underline-offset-4" data-testid="link-admin-customer-account">Customer account sign in</Link></div></div></main>;
}

function AdminPage({ user }: { user: SessionUser | null }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activePanel, setActivePanel] = useState<'overview' | 'orders' | 'products' | 'homepage' | 'pages' | 'settings'>('overview');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [siteDraft, setSiteDraft] = useState<SiteContent>(defaultSiteContent);
  const [proofOrderId, setProofOrderId] = useState<string | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Omit<CatalogProduct, 'id'>>({ name: '', collection: 'Living room', price: 0, material: '', image: '/assets/hero-room.jpg', color: '#d8ddd3', description: '', dimensions: '', stock: 8, badge: '' });
  const fieldClass = 'mt-2 w-full rounded-xl border border-[#0b0b0a]/15 bg-[#f3eee4]/70 px-4 py-3 text-sm text-[#0b0b0a] outline-none focus:border-[#0b0b0a]';
  const actorName = user?.displayName || user?.email || 'Store admin';

  const refresh = async () => {
    if (!user) return;
    const isAdmin = await isCurrentUserAdmin();
    setAllowed(isAdmin);
    if (!isAdmin) return;
    const [remoteCatalog, remoteContent, remoteOrders] = await Promise.all([loadCatalog(), loadSiteContent(), loadAllOrders()]);
    setCatalog(mergeCatalogProducts(remoteCatalog));
    if (remoteContent) setSiteDraft(remoteContent);
    setOrders(remoteOrders);
  };
  useEffect(() => { let active = true; if (!user) { setAllowed(null); return () => { active = false; }; } void refresh().catch(() => { if (active) { setAllowed(false); setMessage('We could not load the admin workspace.'); } }); return () => { active = false; }; }, [user?.uid]);

  const beginNew = () => { setEditingId(undefined); setDraft({ name: '', collection: 'Living room', price: 0, material: '', image: '/assets/hero-room.jpg', color: '#d8ddd3', description: '', dimensions: '', stock: 8, badge: '' }); setMessage(''); };
  const editProduct = (product: CatalogProduct) => { const { id, ...values } = product; setEditingId(id); setDraft(values); setActivePanel('products'); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const save = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setMessage(''); try { const productDraft = { ...draft, name: draft.name.trim(), collection: draft.collection.trim(), material: draft.material.trim(), image: draft.image.trim(), description: draft.description.trim(), dimensions: draft.dimensions.trim(), badge: draft.badge?.trim() || '' }; const id = await saveCatalogProduct(editingId ? { ...productDraft, id: editingId } : productDraft); const saved = { ...productDraft, id }; setCatalog((items) => editingId ? items.map((item) => item.id === id ? saved : item) : [saved, ...items]); setEditingId(id); setMessage(editingId ? 'Product updated and published.' : 'Product created and published.'); window.dispatchEvent(new Event('furnivision-catalog-change')); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save this product.'); } finally { setSaving(false); } };
  const remove = async (id: string) => { if (!window.confirm('Delete this product permanently?')) return; try { await deleteCatalogProduct(id); setCatalog((items) => items.filter((item) => item.id !== id)); if (editingId === id) beginNew(); setMessage('Product deleted.'); window.dispatchEvent(new Event('furnivision-catalog-change')); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete this product.'); } };
  const uploadAsset = async (field: 'image' | 'heroVideo' | 'heroPoster', file?: File) => { if (!file) return; setUploading(field); try { const url = await uploadSiteAsset(file); if (field === 'image') setDraft((current) => ({ ...current, image: url })); else setSiteDraft((current) => ({ ...current, [field]: url })); setMessage('Asset uploaded. Save to publish it.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not upload this asset.'); } finally { setUploading(null); } };
  const saveHomepage = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { await saveSiteContent(siteDraft); setMessage('Homepage content published.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not publish homepage content.'); } finally { setSaving(false); } };
  const changeOrderStatus = async (order: Order, status: string) => { const note = status === 'Issue' ? window.prompt('Add a note for this delivery issue:') || '' : ''; if (status === 'Issue' && !note.trim()) return; setSaving(true); try { await updateOrderStatus(order.id, status, actorName, note); const now = new Date().toISOString(); setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status, updatedAt: now } : item)); setMessage('Order ' + order.id + ' moved to ' + status + '.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update this order.'); } finally { setSaving(false); } };
  const openProof = (order: Order) => { setProofOrderId(order.id); setProofNotes(order.proofOfDelivery?.notes || ''); setProofFile(null); };
  const saveProof = async (order: Order) => { setSaving(true); try { const photoUrl = proofFile ? await uploadDeliveryProof(order.id, proofFile) : order.proofOfDelivery?.photoUrl; await saveDeliveryProof(order.id, photoUrl, proofNotes, actorName); const now = new Date().toISOString(); setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: 'Delivered', updatedAt: now, proofOfDelivery: { photoUrl, notes: proofNotes.trim(), deliveredAt: now, deliveredBy: actorName } } : item)); setProofOrderId(null); setProofFile(null); setProofNotes(''); setMessage('Delivery proof saved for order ' + order.id + '.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save delivery proof.'); } finally { setSaving(false); } };

  if (!firebaseEnabled) return <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 text-[#f3eee4]"><div className="mx-auto max-w-[900px]"><p className="eyebrow">FurniVision / Admin</p><h1 className="mt-5 font-display text-8xl">Admin<br /><em>offline.</em></h1><p className="mt-8 max-w-lg text-sm leading-6 text-[#f3eee4]/65">Firebase is not configured. Add the variables from .env.example, then refresh this page.</p></div></main>;
  if (!user) return <AdminSignInPage />;
  if (allowed === null) return <main className="flex min-h-screen items-center justify-center bg-[#b99a63] px-5 pt-24"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em]">Checking admin access…</p></main>;
  if (!allowed) return <main className="min-h-screen bg-[#0b0b0a] px-5 pb-28 pt-32 text-[#f3eee4]"><div className="mx-auto max-w-[900px]"><p className="eyebrow text-[#b99a63]">FurniVision / Admin</p><h1 className="mt-5 font-display text-8xl">Access<br /><em>denied.</em></h1><p className="mt-8 max-w-lg text-sm text-[#f3eee4]/60">Only the storefront owner can access products, all pages, and order operations.</p></div></main>;

  const storefrontPages = [{ label: 'Home', path: '/', description: 'Homepage hero and featured pieces.' }, { label: 'All furniture', path: '/furniture', description: 'Complete catalog and filters.' }, ...collectionPages.map((page) => ({ label: page.label, path: '/furniture/category/' + page.slug, description: page.description })), ...catalog.map((product) => ({ label: product.name, path: '/furniture/' + product.id, description: 'Product page / ' + product.collection })), { label: 'Wishlist', path: '/wishlist', description: 'Saved customer pieces.' }, { label: 'Saved rooms', path: '/saved-rooms', description: 'Saved room combinations.' }, { label: 'Checkout', path: '/checkout', description: 'Cart and checkout experience.' }, { label: 'Inspiration', path: '/inspiration', description: 'Editorial room stories.' }, { label: 'Account', path: '/account', description: 'Customer accounts and order history.' }];
  const nav = [{ id: 'overview' as const, label: 'Overview', icon: LayoutDashboard }, { id: 'orders' as const, label: 'Orders', icon: ClipboardList, count: orders.length }, { id: 'products' as const, label: 'Products', icon: Package, count: catalog.length }, { id: 'homepage' as const, label: 'Homepage', icon: Image }, { id: 'pages' as const, label: 'Live pages', icon: Store, count: storefrontPages.length }, { id: 'settings' as const, label: 'Settings', icon: Settings2 }];
  const activeNav = nav.find((item) => item.id === activePanel) || nav[0];
  const visibleCatalog = catalog.filter((product) => { const query = catalogQuery.trim().toLowerCase(); return !query || [product.name, product.collection, product.material].some((value) => value.toLowerCase().includes(query)); });
  const visibleOrders = orders.filter((order) => { const query = orderQuery.trim().toLowerCase(); const matchesQuery = !query || [order.id, order.customer.firstName, order.customer.lastName, order.customer.city, order.customer.email].some((value) => value.toLowerCase().includes(query)); return matchesQuery && (statusFilter === 'All statuses' || order.status === statusFilter); });
  const activeOrders = orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length;
  const readyOrders = orders.filter((order) => ['Ready for delivery', 'Out for delivery'].includes(order.status)).length;
  const lowStock = catalog.filter((product) => product.stock <= 3).length;
  const fieldDark = fieldClass + ' border-[#f3eee4]/15 bg-[#24231f] text-[#f3eee4]';

  return <main className="admin-shell min-h-screen bg-[#11110f] text-[#f3eee4]"><div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row"><aside className="border-b border-[#f3eee4]/10 bg-[#171512] px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-6"><Link href="/" className="inline-flex items-center gap-3 px-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b99a63] text-[#11110f]"><Box size={18} /></span><span><span className="block font-display text-2xl leading-none">FurniVision</span><span className="mt-1 block font-mono-ui text-[8px] uppercase tracking-[.18em] text-[#f3eee4]/40">Admin studio</span></span></Link><nav className="mt-8 hidden lg:block">{nav.map((item) => { const Icon = item.icon; const active = activePanel === item.id; return <button key={item.id} onClick={() => setActivePanel(item.id)} className={'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ' + (active ? 'bg-[#b99a63] text-[#11110f]' : 'text-[#f3eee4]/55 hover:bg-[#f3eee4]/[.06]')}><Icon size={16} /><span className="flex-1">{item.label}</span>{item.count !== undefined && <span className="text-xs opacity-60">{item.count}</span>}</button>; })}</nav><div className="mt-8 hidden rounded-2xl border border-[#f3eee4]/10 bg-[#1d1b18] p-4 lg:block"><div className="text-xs text-[#b99a63]">● Firebase connected</div><p className="mt-2 text-[11px] leading-5 text-[#f3eee4]/40">Orders, products, media, and every storefront page are available here.</p></div><button onClick={async () => { await signOutUser(); window.location.href = '/'; }} className="mt-8 hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#f3eee4]/45 lg:flex"><LogOut size={16} /> Sign out</button></aside><div className="min-w-0 flex-1"><header className="border-b border-[#f3eee4]/10 bg-[#171512]/90 px-5 py-5 md:px-8"><div className="flex items-center justify-between gap-4"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#f3eee4]/35">Admin studio / <span className="text-[#b99a63]">{activeNav.label}</span></p><h1 className="mt-3 font-display text-4xl">{activeNav.label}</h1></div><div className="flex items-center gap-2"><Link href="/" target="_blank" rel="noreferrer" className="hidden rounded-xl border border-[#f3eee4]/10 px-4 py-2.5 text-xs sm:inline-flex">View storefront <ArrowUpRight size={13} /></Link><button onClick={() => void refresh()} className="rounded-xl border border-[#f3eee4]/10 p-2.5" aria-label="Refresh admin workspace"><RefreshCw size={15} /></button></div></div><div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">{nav.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setActivePanel(item.id)} className={'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs ' + (activePanel === item.id ? 'bg-[#b99a63] text-[#11110f]' : 'border border-[#f3eee4]/10 text-[#f3eee4]/55')}><Icon size={14} />{item.label}</button>; })}</div></header><div className="px-5 pb-24 pt-6 md:px-8">{message && <div className="mb-6 rounded-xl border border-[#b99a63]/30 bg-[#b99a63]/10 px-4 py-3 text-sm text-[#b99a63]" role="status">{message}</div>}

{activePanel === 'overview' && <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><article className="rounded-2xl bg-[#24231f] p-5"><p className="eyebrow">Active orders</p><p className="mt-5 font-display text-5xl">{activeOrders}</p><p className="mt-2 text-xs text-[#f3eee4]/55">still moving through fulfilment</p></article><article className="rounded-2xl bg-[#b99a63] p-5 text-[#0b0b0a]"><p className="eyebrow">Ready for delivery</p><p className="mt-5 font-display text-5xl">{readyOrders}</p><p className="mt-2 text-xs opacity-65">need a delivery action</p></article><article className="rounded-2xl bg-[#24231f] p-5"><p className="eyebrow">Catalog</p><p className="mt-5 font-display text-5xl">{catalog.length}</p><p className="mt-2 text-xs text-[#f3eee4]/55">published products</p></article><article className="rounded-2xl bg-[#24231f] p-5"><p className="eyebrow">Low stock</p><p className="mt-5 font-display text-5xl">{lowStock}</p><p className="mt-2 text-xs text-[#f3eee4]/55">three or fewer units</p></article><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-6 sm:col-span-2 lg:col-span-3"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Operations queue</p><h2 className="mt-3 font-display text-5xl">One owner.<br /><em>One clear queue.</em></h2></div><button onClick={() => setActivePanel('orders')} className="border-b border-[#b99a63] pb-1 text-xs uppercase tracking-[.14em] text-[#b99a63]">Open orders</button></div><div className="mt-5 divide-y divide-[#f3eee4]/10">{orders.slice(0, 5).map((order) => <button key={order.id} onClick={() => setActivePanel('orders')} className="flex w-full items-center justify-between gap-4 py-4 text-left"><span><strong className="font-display text-2xl">{order.customer.firstName} {order.customer.lastName}</strong><span className="mt-1 block text-xs text-[#f3eee4]/45">{order.id} · {order.status}</span></span><span className="font-display text-xl">{formatPrice(order.total)}</span></button>)}{orders.length === 0 && <p className="py-6 text-sm text-[#f3eee4]/50">New customer orders will appear here.</p>}</div></section><section className="rounded-[1.5rem] bg-[#24231f] p-6 sm:col-span-2 lg:col-span-1"><p className="eyebrow">Recommended flow</p><div className="mt-6 grid gap-4 text-sm text-[#f3eee4]/70"><p><span className="mr-3 text-[#b99a63]">01</span>Confirm and check stock.</p><p><span className="mr-3 text-[#b99a63]">02</span>Prepare, schedule, and dispatch.</p><p><span className="mr-3 text-[#b99a63]">03</span>Deliver and attach proof.</p></div><button onClick={() => setActivePanel('products')} className="mt-8 rounded-full bg-[#b99a63] px-5 py-3 text-xs uppercase tracking-[.14em] text-[#0b0b0a]">Manage catalog</button></section></section>}

{activePanel === 'orders' && <section><div className="flex flex-col justify-between gap-5 border-b border-[#f3eee4]/15 pb-6 md:flex-row md:items-end"><div><p className="eyebrow">Direct delivery workflow</p><h2 className="mt-3 font-display text-5xl">Orders move<br /><em>through you.</em></h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#f3eee4]/55">No handoff or separate delivery account. Confirm, prepare, schedule, dispatch, and complete each order from this queue.</p></div><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#b99a63]">{orders.length} orders</span></div><div className="mt-7 grid gap-3 rounded-2xl border border-[#f3eee4]/10 bg-[#191815] p-3 md:grid-cols-[1fr_190px]"><label className="flex items-center gap-3 rounded-xl bg-[#11110f] px-4 py-3"><Search size={15} className="text-[#f3eee4]/35" /><input value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Search order, customer, city, or email" className="w-full bg-transparent text-sm outline-none placeholder:text-[#f3eee4]/30" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-[#f3eee4]/10 bg-[#11110f] px-4 py-3 text-xs text-[#f3eee4]"><option>All statuses</option>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></div><div className="mt-4 text-xs text-[#f3eee4]/40">{visibleOrders.length} of {orders.length} orders shown · status changes are saved to the timeline</div><div className="mt-5 grid gap-4">{visibleOrders.map((order) => <article key={order.id} className="rounded-2xl border border-[#f3eee4]/10 bg-[#191815] p-5 md:p-6"><div className="flex flex-col justify-between gap-4 border-b border-[#f3eee4]/10 pb-5 md:flex-row"><div><div className="flex flex-wrap items-center gap-3"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#b99a63]">Order / {order.id}</p><span className="rounded-full bg-[#b99a63]/15 px-3 py-1 text-[9px] uppercase tracking-[.12em] text-[#b99a63]">{order.status}</span></div><h3 className="mt-3 font-display text-3xl">{order.customer.firstName} {order.customer.lastName}</h3><p className="mt-1 text-xs text-[#f3eee4]/45">{order.customer.email} · {order.customer.city} · {new Date(order.createdAt).toLocaleString()}</p></div><p className="font-display text-3xl">{formatPrice(order.total)}</p></div><div className="grid gap-6 py-5 lg:grid-cols-[1fr_1fr_230px]"><div><p className="eyebrow">Delivery details</p><div className="mt-3 grid gap-2 text-sm text-[#f3eee4]/65"><p>{order.customer.address}, {order.customer.city}</p><p>Preferred window: {order.customer.deliveryWindow}</p></div></div><div><p className="eyebrow">Items</p><div className="mt-3 grid gap-2 text-sm text-[#f3eee4]/65">{order.items.map((item, index) => <p key={item.id + '-' + index}>{item.name} <span className="text-[#f3eee4]/35">· {item.material}</span></p>)}</div></div><div><label className="eyebrow" htmlFor={'status-' + order.id}>Order stage</label><select id={'status-' + order.id} value={order.status} disabled={saving} onChange={(event) => void changeOrderStatus(order, event.target.value)} className="mt-3 w-full rounded-xl border border-[#f3eee4]/10 bg-[#11110f] px-3 py-3 text-xs text-[#f3eee4]"><option value={order.status}>{order.status}</option>{orderStatuses.filter((status) => status !== order.status).map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => openProof(order)} disabled={saving} className="mt-2 w-full rounded-xl border border-[#b99a63]/40 px-3 py-3 text-[10px] uppercase tracking-[.14em] text-[#b99a63]">{order.proofOfDelivery ? 'Edit delivery proof' : 'Complete with proof'}</button></div></div>{proofOrderId === order.id && <div className="border-t border-[#f3eee4]/10 pt-5"><p className="eyebrow">Proof of delivery</p><div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input type="file" accept="image/*" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className="rounded-xl border border-[#f3eee4]/10 bg-[#11110f] px-3 py-3 text-xs text-[#f3eee4]/60" /><input value={proofNotes} onChange={(event) => setProofNotes(event.target.value)} placeholder="Delivery notes (optional)" className="rounded-xl border border-[#f3eee4]/10 bg-[#11110f] px-3 py-3 text-sm text-[#f3eee4] outline-none placeholder:text-[#f3eee4]/30" /><div className="flex gap-2"><button onClick={() => void saveProof(order)} disabled={saving} className="rounded-xl bg-[#b99a63] px-4 py-3 text-[10px] uppercase tracking-[.12em] text-[#11110f]">{saving ? 'Saving…' : 'Save proof'}</button><button onClick={() => setProofOrderId(null)} className="rounded-xl border border-[#f3eee4]/10 px-4 py-3 text-xs">Cancel</button></div></div></div>}{order.activity?.length ? <div className="border-t border-[#f3eee4]/10 pt-5"><p className="eyebrow">Activity timeline</p><div className="mt-3 grid gap-3">{[...(order.activity || [])].reverse().slice(0, 5).map((activity) => <div key={activity.id} className="flex gap-3 text-xs"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b99a63]" /><div><p className="text-[#f3eee4]/75">{activity.message}</p><p className="mt-1 text-[#f3eee4]/35">{activity.actorName ? activity.actorName + ' · ' : ''}{new Date(activity.createdAt).toLocaleString()}</p></div></div>)}</div></div> : null}{order.proofOfDelivery?.photoUrl && <a href={order.proofOfDelivery.photoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs text-[#b99a63] underline">Open proof photo</a>}</article>)}{visibleOrders.length === 0 && <div className="rounded-2xl border border-dashed border-[#f3eee4]/15 py-16 text-center text-sm text-[#f3eee4]/45">No orders match these filters.</div>}</div></section>}

{activePanel === 'products' && <section><div className="flex flex-col justify-between gap-5 border-b border-[#f3eee4]/15 pb-6 md:flex-row md:items-end"><div><p className="eyebrow">Catalog manager</p><h2 className="mt-3 font-display text-5xl">Publish with<br /><em>confidence.</em></h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#f3eee4]/55">Search, edit, preview, upload, and publish products without leaving the admin workspace.</p></div><button onClick={beginNew} className="rounded-full bg-[#b99a63] px-4 py-3 text-[10px] uppercase tracking-[.14em] text-[#0b0b0a]">New product</button></div><div className="mt-7 grid gap-8 lg:grid-cols-[1fr_.95fr]"><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-5"><div className="flex items-center gap-3 rounded-xl border border-[#f3eee4]/10 bg-[#11110f] px-4 py-3"><Search size={15} className="text-[#f3eee4]/35" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Search name, collection, or material" className="w-full bg-transparent text-sm outline-none placeholder:text-[#f3eee4]/30" /></div><div className="mt-4 text-xs text-[#f3eee4]/40">{visibleCatalog.length} of {catalog.length} products</div><div className="mt-3 divide-y divide-[#f3eee4]/10">{visibleCatalog.map((product) => <article key={product.id} className={'flex items-center gap-3 py-4 ' + (editingId === product.id ? 'rounded-xl bg-[#b99a63]/10 px-3' : '')}><img src={product.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-display text-2xl">{product.name}</p><p className="mt-1 text-xs text-[#f3eee4]/50">{product.collection} · {formatPrice(product.price)} · {product.stock} in stock</p><p className={'mt-1 text-[10px] uppercase tracking-[.12em] ' + (product.stock <= 3 ? 'text-[#bd8250]' : 'text-[#b99a63]')}>{product.stock <= 3 ? 'Low stock' : 'Ready to sell'}</p></div><button onClick={() => editProduct(product)} className="shrink-0 rounded-full border border-[#f3eee4]/20 px-3 py-2 text-[10px] uppercase tracking-[.12em]">Edit</button><button onClick={() => void remove(product.id)} className="shrink-0 rounded-full border border-[#bd8250]/40 px-3 py-2 text-[10px] uppercase tracking-[.12em] text-[#bd8250]">Delete</button></article>)}{visibleCatalog.length === 0 && <p className="py-12 text-sm text-[#f3eee4]/50">No products match this search.</p>}</div></section><form onSubmit={save} className="h-fit rounded-[1.5rem] bg-[#b99a63] p-5 text-[#0b0b0a] md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{editingId ? 'Edit and republish' : 'New product'}</p><h2 className="mt-3 font-display text-5xl leading-[.9]">Shape a piece.</h2></div>{draft.image && <img src={draft.image} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />}</div><div className="mt-6 grid gap-4"><label className="text-xs uppercase tracking-[.13em]">Name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={fieldClass} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">Collection<input required value={draft.collection} onChange={(event) => setDraft({ ...draft, collection: event.target.value })} className={fieldClass} /></label><label className="text-xs uppercase tracking-[.13em]">Material<input required value={draft.material} onChange={(event) => setDraft({ ...draft, material: event.target.value })} className={fieldClass} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[.13em]">Price<input required min="0" type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} className={fieldClass} /></label><label className="text-xs uppercase tracking-[.13em]">Stock<input required min="0" type="number" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} className={fieldClass} /></label></div><label className="text-xs uppercase tracking-[.13em]">Product image URL<input required value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} className={fieldClass} /></label><label className="text-xs uppercase tracking-[.13em]">Or upload product image<input type="file" accept="image/*" onChange={(event) => void uploadAsset('image', event.target.files?.[0])} className="mt-2 block w-full text-xs" />{uploading === 'image' && <span className="mt-1 block text-xs">Uploading…</span>}</label><label className="text-xs uppercase tracking-[.13em]">Description<textarea required value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={fieldClass + ' min-h-24 resize-y'} /></label><label className="text-xs uppercase tracking-[.13em]">Dimensions<input required value={draft.dimensions} onChange={(event) => setDraft({ ...draft, dimensions: event.target.value })} className={fieldClass} /></label><label className="text-xs uppercase tracking-[.13em]">Badge / label<input value={draft.badge || ''} onChange={(event) => setDraft({ ...draft, badge: event.target.value })} className={fieldClass} placeholder="New, Limited, Best seller" /></label><div className="flex gap-2"><button disabled={saving || uploading !== null} className="flex-1 rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4] disabled:opacity-50">{saving ? 'Publishing…' : editingId ? 'Update & publish' : 'Create & publish'}</button>{editingId && <button type="button" onClick={beginNew} className="rounded-full border border-[#0b0b0a]/25 px-4 py-3 text-xs uppercase tracking-[.15em]">Clear</button>}</div></div></form></div></section>}

{activePanel === 'pages' && <section><p className="eyebrow">Storefront navigator</p><h2 className="mt-3 font-display text-5xl">Every room,<br /><em>one click away.</em></h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#f3eee4]/60">Open any live customer page from the admin workspace.</p><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{storefrontPages.map((page) => <article key={page.path} className="flex min-h-44 flex-col justify-between rounded-[1.25rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-5"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#b99a63]">Preview</p><h3 className="mt-4 font-display text-3xl">{page.label}</h3><p className="mt-2 text-sm leading-5 text-[#f3eee4]/50">{page.description}</p></div><Link href={page.path} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 border-b border-[#b99a63] pb-1 text-xs uppercase tracking-[.14em]">Open page <ArrowUpRight size={14} /></Link></article>)}</div></section>}

{activePanel === 'homepage' && <form onSubmit={saveHomepage} className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-5 md:p-8"><p className="eyebrow">Homepage story</p><h2 className="mt-4 font-display text-5xl">Set the tone.</h2><div className="mt-7 grid gap-5"><label className="text-xs uppercase tracking-[.13em]">Hero eyebrow<input value={siteDraft.heroEyebrow} onChange={(event) => setSiteDraft({ ...siteDraft, heroEyebrow: event.target.value })} className={fieldDark} /></label><label className="text-xs uppercase tracking-[.13em]">Hero title<textarea value={siteDraft.heroTitle} onChange={(event) => setSiteDraft({ ...siteDraft, heroTitle: event.target.value })} className={fieldDark + ' min-h-24 resize-y font-display text-3xl'} /></label><label className="text-xs uppercase tracking-[.13em]">Hero supporting text<textarea value={siteDraft.heroBody} onChange={(event) => setSiteDraft({ ...siteDraft, heroBody: event.target.value })} className={fieldDark + ' min-h-24 resize-y'} /></label><label className="text-xs uppercase tracking-[.13em]">Announcement bar<input value={siteDraft.announcement} onChange={(event) => setSiteDraft({ ...siteDraft, announcement: event.target.value })} className={fieldDark} /></label><label className="text-xs uppercase tracking-[.13em]">Collection marquee<input value={siteDraft.marquee} onChange={(event) => setSiteDraft({ ...siteDraft, marquee: event.target.value })} className={fieldDark} /></label><label className="text-xs uppercase tracking-[.13em]">Footer note<input value={siteDraft.footerNote} onChange={(event) => setSiteDraft({ ...siteDraft, footerNote: event.target.value })} className={fieldDark} /></label><button disabled={saving} className="w-fit rounded-full bg-[#b99a63] px-6 py-4 text-xs uppercase tracking-[.15em] text-[#0b0b0a]">{saving ? 'Publishing…' : 'Publish homepage'}</button></div></section><section className="h-fit rounded-[1.5rem] bg-[#dce9e3] p-5 text-[#1f2724] md:p-8"><p className="eyebrow">Visual direction</p><h2 className="mt-4 font-display text-5xl">Less noise.<br />More room.</h2><p className="mt-7 max-w-sm text-sm leading-6 text-[#1f2724]/70">Publish the story, then use Live pages to review the public experience before sharing it.</p></section></form>}

{activePanel === 'settings' && <section className="grid gap-8 lg:grid-cols-2"><section className="rounded-[1.5rem] border border-[#f3eee4]/15 bg-[#1d1b18] p-6 md:p-8"><p className="eyebrow">Storefront settings</p><h2 className="mt-4 font-display text-5xl">Keep it considered.</h2><div className="mt-7 divide-y divide-[#f3eee4]/10"><p className="py-4 text-sm text-[#f3eee4]/70">Theme <span className="float-right text-[#b99a63]">Live</span></p><p className="py-4 text-sm text-[#f3eee4]/70">Order workflow <span className="float-right text-[#b99a63]">Direct admin</span></p><p className="py-4 text-sm text-[#f3eee4]/70">Content source <span className="float-right text-[#b99a63]">Connected</span></p></div></section><section className="rounded-[1.5rem] bg-[#24231f] p-6 md:p-8"><p className="eyebrow">Live preview</p><h2 className="mt-4 font-display text-5xl">Check the room.</h2><p className="mt-6 max-w-md text-sm leading-6 text-[#f3eee4]/60">Open the public storefront after publishing to review the customer experience.</p><Link href="/" className="mt-8 inline-flex rounded-full bg-[#b99a63] px-5 py-3 text-xs uppercase tracking-[.14em] text-[#0b0b0a]">Preview storefront</Link></section></section>}
</div></div></div></main>;
}

function AccountPage({ user, orders, onOrderChange }: { user: SessionUser | null; orders: Order[]; onOrderChange: (order: Order) => void }) {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerDetails | null>(null);
  const [orderMessage, setOrderMessage] = useState('');
  const [orderBusy, setOrderBusy] = useState(false);
  useEffect(() => { let active = true; if (!user) { setIsAdmin(false); return () => { active = false; }; } void isCurrentUserAdmin().then((admin) => { if (active) setIsAdmin(admin); }).catch(() => { if (active) setIsAdmin(false); }); return () => { active = false; }; }, [user?.uid]);
  const canEditAddress = (status: string) => ['New', 'Confirmed', 'Preparing'].includes(status);
  const canCancelOrder = (status: string) => ['New', 'Confirmed', 'Preparing', 'Ready for delivery'].includes(status);
  const beginAddressEdit = (order: Order) => { setEditingOrderId(order.id); setDraft({ ...order.customer }); setOrderMessage(''); };
  const saveAddress = async (order: Order) => {
    if (!draft) return;
    setOrderBusy(true);
    setOrderMessage('');
    try {
      const updated = await updateCustomerOrder(order, draft, user?.displayName || user?.email || 'Customer');
      onOrderChange(updated);
      setEditingOrderId(null);
      setDraft(null);
      setOrderMessage('Delivery details updated.');
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'We could not update the delivery details.');
    } finally { setOrderBusy(false); }
  };
  const cancelOrder = async (order: Order) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setOrderBusy(true);
    setOrderMessage('');
    try {
      const updated = await cancelCustomerOrder(order, user?.displayName || user?.email || 'Customer');
      onOrderChange(updated);
      setOrderMessage('Order cancelled.');
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'We could not cancel this order.');
    } finally { setOrderBusy(false); }
  };
  if (user) return <main className="min-h-screen bg-[#171512] px-5 pb-28 pt-32 md:px-10 md:pt-44"><div className="mx-auto max-w-[1180px]"><p className="eyebrow">FurniVision / Your account</p><div className="mt-5 flex flex-col justify-between gap-8 border-b border-[#f3eee4]/20 pb-10 md:flex-row md:items-end"><div><h1 className="font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Make room<br /><em>for you.</em></h1><p className="mt-6 text-sm text-[#f3eee4]/60">{user.email}</p></div><div className="flex flex-wrap gap-3 self-start">{isAdmin && <Link href="/admin" className="rounded-full border border-[#f3eee4]/20 px-5 py-3 text-xs uppercase tracking-[.15em]">Admin workspace</Link>}<button onClick={async () => { await signOutUser(); setLocation('/'); }} className="rounded-full border border-[#f3eee4]/20 px-5 py-3 text-xs uppercase tracking-[.15em]">Sign out</button></div></div><div className="mt-12 grid gap-5 md:grid-cols-3"><Link href="/wishlist" className="rounded-[1.25rem] bg-[#b99a63] p-6"><Heart size={20} /><p className="mt-10 font-display text-4xl">Saved pieces</p></Link><Link href="/saved-rooms" className="rounded-[1.25rem] bg-[#24231f] p-6"><Move3d size={20} /><p className="mt-10 font-display text-4xl">Saved rooms</p></Link><div className="rounded-[1.25rem] bg-[#0b0b0a] p-6 text-[#f3eee4]"><Box size={20} className="text-[#b99a63]" /><p className="mt-10 font-display text-4xl">Orders</p><p className="mt-2 text-sm text-[#f3eee4]/60">{orders.length ? orders.length + ' order' + (orders.length === 1 ? '' : 's') + ' in progress.' : 'Your first room is still ahead.'}</p></div></div>{orders.length > 0 && <section className="mt-16"><div className="flex items-end justify-between border-b border-[#f3eee4]/15 pb-5"><div><p className="eyebrow">Order history</p><h2 className="mt-3 font-display text-5xl">The pieces<br /><em>on their way.</em></h2></div><span className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#f3eee4]/50">{orders.length} orders</span></div>{orderMessage && <p className="mt-5 rounded-xl border border-[#b99a63]/30 bg-[#b99a63]/10 px-4 py-3 text-sm text-[#b99a63]" role="status">{orderMessage}</p>}<div className="mt-6 divide-y divide-[#f3eee4]/15">{orders.map((order) => <article key={order.id} className="py-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#bd8250]">{new Date(order.createdAt).toLocaleDateString()} / {order.status}</p><p className="mt-2 font-display text-3xl">{order.items.map((item) => item.name).join(', ')}</p><p className="mt-2 text-sm text-[#f3eee4]/55">Deliver to {order.customer.address}, {order.customer.city} · {order.customer.deliveryWindow}</p></div><p className="font-display text-2xl">{formatPrice(order.total)}</p></div>{(canEditAddress(order.status) || canCancelOrder(order.status)) && <div className="mt-4 flex flex-wrap gap-3"><button onClick={() => beginAddressEdit(order)} disabled={orderBusy} className="rounded-full border border-[#f3eee4]/20 px-4 py-2 text-[10px] uppercase tracking-[.14em]">Edit delivery details</button>{canCancelOrder(order.status) && <button onClick={() => void cancelOrder(order)} disabled={orderBusy} className="rounded-full border border-[#bd8250]/50 px-4 py-2 text-[10px] uppercase tracking-[.14em] text-[#bd8250]">Cancel order</button>}</div>}{editingOrderId === order.id && draft && <div className="mt-5 rounded-2xl border border-[#f3eee4]/15 bg-[#24231f] p-5"><p className="eyebrow">Update delivery details</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-xs uppercase tracking-[.12em]">Street address<input required maxLength={160} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} className="mt-2 w-full rounded-xl border border-[#f3eee4]/15 bg-[#171512] px-3 py-3 text-sm outline-none" /></label><label className="text-xs uppercase tracking-[.12em]">City<input required maxLength={80} value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} className="mt-2 w-full rounded-xl border border-[#f3eee4]/15 bg-[#171512] px-3 py-3 text-sm outline-none" /></label><label className="text-xs uppercase tracking-[.12em] md:col-span-2">Preferred delivery window<input required maxLength={80} value={draft.deliveryWindow} onChange={(event) => setDraft({ ...draft, deliveryWindow: event.target.value })} className="mt-2 w-full rounded-xl border border-[#f3eee4]/15 bg-[#171512] px-3 py-3 text-sm outline-none" /></label></div><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => void saveAddress(order)} disabled={orderBusy} className="rounded-full bg-[#b99a63] px-5 py-3 text-[10px] uppercase tracking-[.14em] text-[#171512]">{orderBusy ? 'Saving…' : 'Save delivery details'}</button><button onClick={() => { setEditingOrderId(null); setDraft(null); }} disabled={orderBusy} className="rounded-full border border-[#f3eee4]/20 px-5 py-3 text-[10px] uppercase tracking-[.14em]">Close</button></div></div>}</article>)}</div></section>}</div></main>;
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setMessage(''); const result = mode === 'signin' ? await signIn(email, password) : await createAccount(email, password); setBusy(false); if (result.user) { try { await ensureFirstUserAdmin(result.user); setLocation('/'); } catch { setMessage('Your account was created, but we could not finish signing you in. Please refresh.'); } } else setMessage(result.error || 'Please try again.'); };
  return <main className="min-h-screen bg-[#b99a63] px-5 pb-28 pt-32 md:px-10 md:pt-44"><div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1fr_420px] lg:items-end"><div><p className="eyebrow">FurniVision / Customer account</p><h1 className="mt-5 font-display text-8xl leading-[.76] tracking-[-.06em] md:text-[10rem]">Keep the<br /><em>good stuff.</em></h1></div><div className="rounded-[1.5rem] bg-[#171512] p-7 md:p-8"><div className="flex gap-5 border-b border-[#f3eee4]/15 pb-4"><button onClick={() => { setMode('signin'); setMessage(''); }} className={'font-mono-ui text-[10px] uppercase tracking-[.15em] ' + (mode === 'signin' ? 'text-[#bd8250]' : 'text-[#f3eee4]/45')}>Sign in</button><button onClick={() => { setMode('create'); setMessage(''); }} className={'font-mono-ui text-[10px] uppercase tracking-[.15em] ' + (mode === 'create' ? 'text-[#bd8250]' : 'text-[#f3eee4]/45')}>Create account</button></div><form onSubmit={submit} className="mt-7 grid gap-6"><label className="text-xs uppercase tracking-[.13em]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none" /></label><label className="text-xs uppercase tracking-[.13em]">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border-b border-[#f3eee4]/25 bg-transparent py-3 text-base outline-none" /></label>{message && <p className="text-sm text-[#bd8250]" role="alert">{message}</p>}<button disabled={busy || !firebaseEnabled} className="rounded-full bg-[#0b0b0a] py-4 text-xs uppercase tracking-[.15em] text-[#f3eee4]">{busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button></form><button disabled={!firebaseEnabled} onClick={async () => { setBusy(true); const result = await signInWithGoogle(); setBusy(false); if (result.user) setLocation('/'); else setMessage(result.error || 'Please try again.'); }} className="mt-3 w-full rounded-full border border-[#f3eee4]/20 py-4 text-xs uppercase tracking-[.15em]">Continue with Google</button></div></div></main>;
}

function NotFound() {
  return <main className="flex min-h-screen items-center bg-[#0b0b0a] px-5 text-[#f3eee4]"><div className="mx-auto max-w-[1440px]"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#b99a63]">404 / Wrong room</p><h1 className="mt-6 font-display text-8xl leading-[.77] md:text-[12rem]">Nothing<br /><em>here.</em></h1><Link href="/" className="mt-10 inline-flex items-center gap-3 border-b border-[#b99a63] pb-2 text-xs uppercase tracking-[.16em]" data-testid="link-not-found-home">Return home <ArrowUpRight size={16} /></Link></div></main>;
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] overflow-auto bg-[#b99a63] p-6 page-reveal"><div className="flex items-center justify-between"><Logo /><button onClick={onClose} aria-label="Close menu" data-testid="button-close-menu"><X /></button></div><nav className="mt-24 grid gap-5 font-display text-6xl" onClick={onClose}><Link href="/furniture" data-testid="link-mobile-furniture">Furniture</Link><Link href="/wishlist" data-testid="link-mobile-wishlist">Wishlist</Link><Link href="/saved-rooms" data-testid="link-mobile-saved-rooms">Saved rooms</Link><Link href="/inspiration" data-testid="link-mobile-inspiration">Inspiration</Link></nav><div className="mt-12 border-t border-[#f3eee4]/20 pt-5"><p className="eyebrow">Shop by collection</p><div className="mt-4 grid gap-3 text-lg">{collectionPages.map((page) => <Link href={`/furniture/category/${page.slug}`} key={page.slug} data-testid={`link-mobile-collection-${page.slug}`}>{page.label}</Link>)}</div></div><p className="mt-14 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f3eee4]/55">FurniVision / New York</p></div>;
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
      products.splice(0, products.length, ...mergeCatalogProducts(remoteCatalog));
      setCatalogVersion((version) => version + 1);
    };
    void refreshCatalog().catch(() => undefined);
    const handleCatalogChange = () => { void refreshCatalog().catch(() => undefined); };
    window.addEventListener('furnivision-catalog-change', handleCatalogChange);
    return () => { active = false; window.removeEventListener('furnivision-catalog-change', handleCatalogChange); };
  }, []);
  useEffect(() => subscribeToAuth((nextUser) => {
    const nextSession = nextUser ? { uid: nextUser.uid, email: nextUser.email, displayName: nextUser.displayName } : null;
    setUser(nextSession);
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
  const clearCart = () => setCartItems([]);
  const placeOrder = async (customer: CustomerDetails) => {
    if (!user) throw new Error('Sign in before placing an order.');
    const order: Order = {
      id: `order-${Date.now()}`,
      customerId: user.uid,
      customer,
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + item.price, 0),
      createdAt: new Date().toISOString(),
      status: 'New',
       activity: [{ id: `created-${Date.now()}`, type: 'created', message: 'Order placed', actorName: user.displayName || user.email || 'Customer', createdAt: new Date().toISOString() }],
    };
    await saveCustomerOrder(order);
    setOrders((current) => [order, ...current]);
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
  return <RedesignedStorefront products={products} cartItems={cartItems} liked={liked} user={user} orders={orders} onAdd={addToCart} onRemove={removeFromCart} onIncrement={incrementCart} onDecrement={decrementCart} onClear={clearCart} onLike={toggleLike} onOrder={placeOrder} onOrderChange={(updatedOrder) => setOrders((current) => current.map((order) => order.id === updatedOrder.id ? updatedOrder : order))} />;
}

export default App;