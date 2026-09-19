import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, Heart, Menu, Minus, Package, Plus, Search, ShoppingBag, Sparkles, Star, Truck, UserRound, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { createAccount, signIn, signInWithGoogle, signOutUser } from './lib/auth';
import { cancelCustomerOrder, updateCustomerOrder, type CustomerDetails, type StoreOrder } from './lib/orders';
import type { Product } from './App';

type CustomerUser = { uid: string; email: string | null; displayName: string | null };

type StorefrontProps = {
  products: Product[];
  cartItems: Product[];
  liked: string[];
  user: CustomerUser | null;
  orders: StoreOrder[];
  onAdd: (product: Product) => void;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onClear: () => void;
  onLike: (id: string) => void;
  onOrder: (customer: CustomerDetails) => Promise<void>;
  onOrderChange: (order: StoreOrder) => void;
};

const money = (value: number) => `$${value.toLocaleString('en-US')}`;

const collectionNotes: Record<string, string> = {
  'Living room': 'The anchors that make staying in feel like a plan.',
  Lounge: 'Soft places, generous curves, better pauses.',
  Tables: 'Useful geometry with room for the everyday.',
  Lighting: 'A warmer way to see the room.',
  'Dining tables': 'Made for slow dinners and one more guest.',
  Recliners: 'The best seat is the one you return to.',
  'TV units': 'Quiet storage for the things that make life work.',
  Beds: 'A softer start and a slower morning.',
  Mattresses: 'Support for the way you actually sleep.',
  'Shoe racks': 'A calmer landing place for coming home.',
  'Kitchen cabinets': 'Tactile storage for everyday rituals.',
  Wardrobes: 'More order for the life you wear.',
  Wallpapers: 'Walls with something to say.',
};

function ButtonLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return <Link href={href} className={`new-button ${secondary ? 'new-button--secondary' : ''}`}>{children}<ArrowUpRight size={15} /></Link>;
}

function StoreHeader({ count, user, onCart }: { count: number; user: CustomerUser | null; onCart: () => void }) {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    setLocation(query.trim() ? `/furniture?search=${encodeURIComponent(query.trim())}` : '/furniture');
  };
  return (
    <>
      <header className="new-header">
        <div className="new-header__inner">
          <Link href="/" className="new-logo" onClick={() => setMenuOpen(false)}><span>furni</span><em>vision</em></Link>
          <nav className="new-nav" aria-label="Primary navigation">
            <Link href="/furniture">Shop</Link>
            <Link href="/furniture/category/living-room">Living room</Link>
            <Link href="/inspiration">Journal</Link>
          </nav>
          <div className="new-header__tools">
            <form onSubmit={submit} className="new-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pieces" aria-label="Search pieces" />
            </form>
            <Link href="/account" className="new-icon-link" aria-label="Account"><UserRound size={18} /></Link>
            <button type="button" className="new-icon-link new-cart-button" onClick={onCart} aria-label={`Open bag with ${count} items`}><ShoppingBag size={18} />{count > 0 && <span>{count}</span>}</button>
            <button type="button" className="new-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          </div>
        </div>
      </header>
      {menuOpen && <div className="new-mobile-menu"><div className="new-mobile-menu__top"><Link href="/" className="new-logo" onClick={() => setMenuOpen(false)}><span>furni</span><em>vision</em></Link><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div><nav onClick={() => setMenuOpen(false)}><Link href="/furniture">Shop all pieces <ArrowRight size={18} /></Link><Link href="/furniture/category/living-room">Living room <ArrowRight size={18} /></Link><Link href="/furniture/category/beds">Bedroom <ArrowRight size={18} /></Link><Link href="/inspiration">Journal <ArrowRight size={18} /></Link><Link href="/account">Your account <ArrowRight size={18} /></Link></nav><p className="new-kicker">Made for the lived-in life / New York</p></div>}
    </>
  );
}

function BagDrawer({ items, open, onClose, onRemove, onIncrement, onDecrement }: { items: Product[]; open: boolean; onClose: () => void; onRemove: (id: string) => void; onIncrement: (id: string) => void; onDecrement: (id: string) => void }) {
  if (!open) return null;
  const grouped = items.reduce<Array<{ product: Product; quantity: number }>>((list, product) => {
    const found = list.find((line) => line.product.id === product.id);
    if (found) found.quantity += 1;
    else list.push({ product, quantity: 1 });
    return list;
  }, []);
  const total = items.reduce((sum, product) => sum + product.price, 0);
  return <div className="new-drawer-layer"><button className="new-drawer-backdrop" onClick={onClose} aria-label="Close bag" /><aside className="new-drawer" aria-label="Shopping bag"><div className="new-drawer__head"><div><p className="new-kicker">Your bag</p><strong>{items.length.toString().padStart(2, '0')} pieces</strong></div><button onClick={onClose} aria-label="Close bag"><X size={20} /></button></div>{items.length === 0 ? <div className="new-empty"><ShoppingBag size={30} /><h2>Nothing here yet.</h2><p>Start with the piece that changes the room.</p><ButtonLink href="/furniture">Browse pieces</ButtonLink></div> : <><div className="new-drawer__items">{grouped.map(({ product, quantity }) => <div className="new-bag-line" key={product.id}><img src={product.image} alt={product.name} /><div className="new-bag-line__body"><div><h3>{product.name}</h3><p>{product.material}</p></div><strong>{money(product.price * quantity)}</strong><div className="new-quantity"><button onClick={() => onDecrement(product.id)} aria-label={`Decrease ${product.name}`}><Minus size={13} /></button><span>{quantity}</span><button onClick={() => onIncrement(product.id)} aria-label={`Increase ${product.name}`}><Plus size={13} /></button></div><button className="new-remove" onClick={() => onRemove(product.id)}>Remove</button></div></div>)}</div><div className="new-drawer__foot"><div><span>Subtotal</span><strong>{money(total)}</strong></div><p>White-glove delivery is included. Taxes are calculated at checkout.</p><Link href="/checkout" onClick={onClose} className="new-button">Checkout <ArrowUpRight size={15} /></Link></div></>}</aside></div>;
}

function ProductCard({ product, liked, onLike, onAdd }: { product: Product; liked: boolean; onLike: () => void; onAdd: () => void }) {
  return <article className="new-product-card"><Link href={`/furniture/${product.id}`} className="new-product-card__image"><img src={product.image} alt={product.name} /><span>{product.collection}</span><i>View piece <ArrowUpRight size={14} /></i></Link><div className="new-product-card__body"><div><Link href={`/furniture/${product.id}`}><h3>{product.name}</h3></Link><p>{product.material}</p><div className="new-rating"><Star size={12} fill="currentColor" /> 4.8 <span>· considered quality</span></div></div><div className="new-product-card__aside"><strong>{money(product.price)}</strong><div><button onClick={onLike} className={liked ? 'is-liked' : ''} aria-label={`${liked ? 'Remove' : 'Save'} ${product.name}`}><Heart size={16} fill={liked ? 'currentColor' : 'none'} /></button><button onClick={onAdd} aria-label={`Add ${product.name} to bag`}><Plus size={17} /></button></div></div></div></article>;
}

function HomePage({ products, liked, onLike, onAdd }: Pick<StorefrontProps, 'products' | 'liked' | 'onLike' | 'onAdd'>) {
  const featured = products.slice(0, 4);
  const rooms = [
    { label: 'Living room', slug: 'living-room', image: '/assets/hero-room.jpg', note: 'Settle in' },
    { label: 'Bedroom', slug: 'beds', image: '/assets/nest-bed.jpg', note: 'Sleep well' },
    { label: 'Dining', slug: 'dining-tables', image: '/assets/mesa-dining-table.jpg', note: 'Gather close' },
  ];
  return <main className="new-page"><section className="new-hero"><div className="new-hero__copy"><p className="new-kicker">Furniture for the everyday extraordinary</p><h1>Make space<br /><em>for living.</em></h1><p className="new-hero__intro">A considered collection of furniture with honest materials, comfortable proportions, and room for your life to happen around it.</p><div className="new-hero__actions"><ButtonLink href="/furniture">Shop the collection</ButtonLink><Link href="#edit" className="new-text-link">Explore the edit <ArrowRight size={15} /></Link></div><div className="new-hero__proof"><div><strong>01</strong><span>Thoughtful pieces</span></div><div><strong>02</strong><span>Made to live with</span></div><div><strong>03</strong><span>White-glove delivery</span></div></div></div><div className="new-hero__visual"><img src="/assets/hero-room.jpg" alt="Warm living room with sculptural furniture" /><div className="new-hero__caption"><span>FurniVision / 01—04</span><strong>Rooms that feel like you.</strong></div><div className="new-hero__badge">The<br /><em>new</em><br />ordinary</div></div></section><div className="new-ribbon"><span>Material first</span><i>✳</i><span>Comfort always</span><i>✳</i><span>Made to be lived with</span><i>✳</i><span>Material first</span></div><section className="new-section new-section--rooms"><div className="new-section-head"><div><p className="new-kicker">Start with a feeling</p><h2>Find your <em>room.</em></h2></div><Link href="/furniture" className="new-text-link">View all pieces <ArrowUpRight size={15} /></Link></div><div className="new-room-grid">{rooms.map((room) => <Link className="new-room-card" href={`/furniture/category/${room.slug}`} key={room.slug}><img src={room.image} alt={room.label} /><div><span>{room.note}</span><strong>{room.label}</strong><ArrowUpRight size={18} /></div></Link>)}</div></section><section id="edit" className="new-section new-section--edit"><div className="new-section-head"><div><p className="new-kicker">The considered edit</p><h2>New arrivals,<br /><em>well chosen.</em></h2></div><p className="new-section-note">Pieces with presence, proportion, and a little room for your own point of view.</p></div><div className="new-product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} onLike={() => onLike(product.id)} onAdd={() => onAdd(product)} />)}</div></section><section className="new-manifesto"><div className="new-manifesto__image"><img src="/assets/atelier-kitchen.jpg" alt="Tactile kitchen storage and materials" /></div><div className="new-manifesto__copy"><p className="new-kicker">Design, made livable</p><h2>Good rooms leave<br /><em>space for you.</em></h2><p>We choose honest materials, comfortable proportions, and details that get better with time. Nothing extra. Everything intentional.</p><ButtonLink href="/inspiration" secondary>Read the journal</ButtonLink></div></section><section className="new-trust"><div><Truck size={20} /><strong>White-glove delivery</strong><span>From our studio to your door.</span></div><div><Sparkles size={20} /><strong>Made to last</strong><span>Chosen for everyday life.</span></div><div><Heart size={20} /><strong>Easy to love</strong><span>Presence, never noise.</span></div></section></main>;
}

function FurniturePage({ products, liked, onLike, onAdd }: Pick<StorefrontProps, 'products' | 'liked' | 'onLike' | 'onAdd'>) {
  const [location] = useLocation();
  const query = new URLSearchParams(location.split('?')[1] || '').get('search') || '';
  const [filter, setFilter] = useState('All pieces');
  const [sort, setSort] = useState('Featured');
  const collections = ['All pieces', ...Array.from(new Set(products.map((product) => product.collection)))];
  const filtered = useMemo(() => products.filter((product) => (filter === 'All pieces' || product.collection === filter) && (!query || `${product.name} ${product.material} ${product.collection}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : sort === 'Price: high to low' ? b.price - a.price : 0), [products, filter, query, sort]);
  return <main className="new-page new-page--catalog"><section className="new-catalog-intro"><p className="new-kicker">The collection / {products.length} pieces</p><h1>Live <em>well.</em></h1><p>Furniture for the spaces that hold your everyday: slow mornings, full tables, and the quiet in between.</p></section><div className="new-filter-bar"><div className="new-filter-scroll">{collections.map((collection) => <button key={collection} className={filter === collection ? 'is-active' : ''} onClick={() => setFilter(collection)}>{collection}</button>)}</div><label>Sort <select value={sort} onChange={(event) => setSort(event.target.value)}><option>Featured</option><option>Price: low to high</option><option>Price: high to low</option></select><ChevronDown size={14} /></label></div>{query && <div className="new-search-result">Showing results for “{query}” <button onClick={() => window.history.replaceState({}, '', '/furniture')}>Clear</button></div>}<div className="new-catalog-meta"><span>{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'} available</span><span>Complimentary delivery on every order</span></div>{filtered.length ? <div className="new-product-grid new-product-grid--catalog">{filtered.map((product) => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} onLike={() => onLike(product.id)} onAdd={() => onAdd(product)} />)}</div> : <div className="new-empty new-empty--page"><Sparkles size={30} /><h2>Nothing in that register.</h2><p>Try another room or clear your search.</p><button onClick={() => setFilter('All pieces')}>Reset filters</button></div>}</main>;
}

function CollectionPage({ products, liked, onLike, onAdd }: Pick<StorefrontProps, 'products' | 'liked' | 'onLike' | 'onAdd'>) {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const slugToLabel = categorySlug?.replaceAll('-', ' ') || '';
  const collection = Object.keys(collectionNotes).find((name) => name.toLowerCase() === slugToLabel) || '';
  const collectionProducts = products.filter((product) => product.collection === collection);
  return <main className="new-page new-page--catalog"><section className="new-collection-hero"><div><Link href="/furniture" className="new-back-link"><ChevronLeft size={15} /> All pieces</Link><p className="new-kicker">Collection / {collection}</p><h1>{collection.split(' ')[0]}<br /><em>{collection.split(' ').slice(1).join(' ') || 'edit.'}</em></h1><p>{collectionNotes[collection] || 'A considered edit for rooms made to be lived in.'}</p></div><img src={collectionProducts[0]?.image || '/assets/hero-room.jpg'} alt={collection} /></section><div className="new-catalog-meta"><span>{collectionProducts.length} pieces</span><span>Designed for the lived-in life</span></div><div className="new-product-grid">{collectionProducts.map((product) => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} onLike={() => onLike(product.id)} onAdd={() => onAdd(product)} />)}</div>{collectionProducts.length === 0 && <div className="new-empty new-empty--page"><h2>Arriving soon.</h2><p>This collection is still taking shape.</p></div>}</main>;
}

function ProductPage({ products, liked, onLike, onAdd }: Pick<StorefrontProps, 'products' | 'liked' | 'onLike' | 'onAdd'>) {
  const { productId } = useParams<{ productId: string }>();
  const product = products.find((item) => item.id === productId);
  const [quantity, setQuantity] = useState(1);
  if (!product) return <NotFound />;
  return <main className="new-page new-page--product"><Link href="/furniture" className="new-back-link"><ChevronLeft size={15} /> Back to collection</Link><div className="new-product-detail"><div className="new-product-detail__image"><img src={product.image} alt={product.name} /><span className="new-image-label">FurniVision / object study</span></div><div className="new-product-detail__copy"><p className="new-kicker">{product.collection} / {product.material}</p><h1>{product.name}</h1><div className="new-product-price"><strong>{money(product.price)}</strong><span><Truck size={15} /> Ships in 2–4 weeks</span></div><p className="new-product-description">{product.description}</p><div className="new-detail-facts"><div><span>Dimensions</span><strong>{product.dimensions}</strong></div><div><span>Material</span><strong>{product.material}</strong></div><div><span>Promise</span><strong>White-glove delivery</strong></div></div><div className="new-purchase"><div className="new-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div><button className="new-button" onClick={() => { for (let index = 0; index < quantity; index += 1) onAdd(product); }}>Add to bag <ArrowUpRight size={15} /></button><button className={`new-save-button ${liked.includes(product.id) ? 'is-liked' : ''}`} onClick={() => onLike(product.id)} aria-label="Save product"><Heart size={18} fill={liked.includes(product.id) ? 'currentColor' : 'none'} /></button></div><div className="new-product-note"><Star size={15} fill="currentColor" /><span>4.8 / 5 from customers who care about comfort, finish, and how a piece settles into a room.</span></div></div></div></main>;
}

function CheckoutPage({ cartItems, user, onRemove, onIncrement, onDecrement, onClear, onOrder }: Pick<StorefrontProps, 'cartItems' | 'user' | 'onRemove' | 'onIncrement' | 'onDecrement' | 'onClear' | 'onOrder'>) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const data = new FormData(event.currentTarget);
    try {
      await onOrder({ firstName: String(data.get('firstName')), lastName: String(data.get('lastName')), email: String(data.get('email')), address: String(data.get('address')), city: String(data.get('city')), deliveryWindow: String(data.get('deliveryWindow')) });
      onClear();
      setDone(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not place this order.');
    } finally {
      setBusy(false);
    }
  };
  if (done) return <main className="new-page new-success"><Check size={34} /><p className="new-kicker">Order received</p><h1>A room<br /><em>is coming.</em></h1><p>We’ll send a confirmation and delivery window to your inbox. Thank you for choosing pieces with a point of view.</p><ButtonLink href="/">Return home</ButtonLink></main>;
  return <main className="new-page new-page--checkout"><div className="new-checkout-head"><Link href="/furniture" className="new-back-link"><ChevronLeft size={15} /> Continue shopping</Link><p className="new-kicker">FurniVision / Checkout</p><h1>Make it <em>yours.</em></h1></div>{cartItems.length === 0 ? <div className="new-empty new-empty--page"><ShoppingBag size={30} /><h2>Your bag is waiting.</h2><ButtonLink href="/furniture">Browse the collection</ButtonLink></div> : <div className="new-checkout-layout"><form onSubmit={submit} className="new-checkout-form"><h2>Delivery details</h2><p className="new-form-note">Your order is reviewed by our studio before a delivery window is confirmed.</p><div className="new-form-grid"><label>First name<input required name="firstName" autoComplete="given-name" /></label><label>Last name<input required name="lastName" autoComplete="family-name" /></label><label className="wide">Email<input required type="email" name="email" defaultValue={user?.email || ''} autoComplete="email" /></label><label className="wide">Street address<input required name="address" autoComplete="street-address" /></label><label>City<input required name="city" autoComplete="address-level2" /></label><label>Preferred delivery<select required name="deliveryWindow" defaultValue=""><option value="" disabled>Choose a window</option><option>Weekday morning</option><option>Weekday afternoon</option><option>Saturday</option></select></label></div>{!user && <p className="new-form-alert">Please <Link href="/account">sign in</Link> before placing an order so your delivery details stay attached to your account.</p>}{message && <p className="new-form-alert" role="alert">{message}</p>}<button disabled={!user || busy} className="new-button new-button--full">{busy ? 'Preparing your order…' : user ? 'Place order' : 'Sign in to place order'}<ArrowUpRight size={15} /></button></form><aside className="new-order-summary"><p className="new-kicker">Order summary / {cartItems.length}</p>{cartItems.map((item, index) => <div className="new-summary-line" key={`${item.id}-${index}`}><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.material}</span><div className="new-quantity"><button type="button" onClick={() => onDecrement(item.id)}><Minus size={12} /></button><span>1</span><button type="button" onClick={() => onIncrement(item.id)}><Plus size={12} /></button></div></div><div><strong>{money(item.price)}</strong><button type="button" onClick={() => onRemove(item.id)}>Remove</button></div></div>)}<div className="new-summary-total"><span>Total</span><strong>{money(total)}</strong></div><p className="new-summary-note">White-glove delivery is included.</p></aside></div>}</main>;
}

function AccountPage({ user, orders, onOrderChange }: Pick<StorefrontProps, 'user' | 'orders' | 'onOrderChange'>) {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerDetails | null>(null);
  const canEdit = (status: string) => ['New', 'Confirmed', 'Preparing'].includes(status);
  const canCancel = (status: string) => ['New', 'Confirmed', 'Preparing', 'Ready for delivery'].includes(status);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = mode === 'signin' ? await signIn(email, password) : await createAccount(email, password);
    if (result.user) setLocation('/');
    else setMessage(result.error || 'Please try again.');
  };
  if (!user) return <main className="new-page new-account-auth"><div><p className="new-kicker">FurniVision / Customer account</p><h1>Keep the<br /><em>good stuff.</em></h1><p>Track orders, save pieces, and keep delivery details in one place.</p></div><div className="new-auth-card"><div className="new-auth-tabs"><button className={mode === 'signin' ? 'is-active' : ''} onClick={() => setMode('signin')}>Sign in</button><button className={mode === 'create' ? 'is-active' : ''} onClick={() => setMode('create')}>Create account</button></div><form onSubmit={submit}><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p className="new-form-alert">{message}</p>}<button className="new-button new-button--full">{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowUpRight size={15} /></button></form><button className="new-google-button" onClick={async () => { const result = await signInWithGoogle(); if (result.user) setLocation('/'); else setMessage(result.error || 'Please try again.'); }}>Continue with Google</button></div></main>;
  return <main className="new-page new-account"><div className="new-account-head"><div><p className="new-kicker">FurniVision / Your account</p><h1>Make room<br /><em>for you.</em></h1><p>{user.email}</p></div><button className="new-button new-button--secondary" onClick={async () => { await signOutUser(); setLocation('/'); }}>Sign out <ArrowUpRight size={15} /></button></div><div className="new-account-stats"><div><Package size={20} /><strong>{orders.length}</strong><span>Orders</span></div><div><Heart size={20} /><strong>Saved</strong><span>Pieces you love</span></div><div><Truck size={20} /><strong>Studio</strong><span>White-glove care</span></div></div><section className="new-orders"><div className="new-section-head"><div><p className="new-kicker">Order history</p><h2>The pieces<br /><em>on their way.</em></h2></div><span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>{orders.length === 0 ? <div className="new-empty new-empty--page"><Package size={30} /><h3>No orders yet.</h3><p>Your first room is still ahead.</p><ButtonLink href="/furniture">Shop the collection</ButtonLink></div> : <div className="new-order-list">{orders.map((order) => <article className="new-order-card" key={order.id}><div className="new-order-card__top"><div><p className="new-kicker">{new Date(order.createdAt).toLocaleDateString()} / {order.id}</p><h3>{order.items.map((item) => item.name).join(', ')}</h3><span className={`new-status new-status--${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></div><strong>{money(order.total)}</strong></div><p className="new-order-address">Deliver to {order.customer.address}, {order.customer.city} · {order.customer.deliveryWindow}</p>{(canEdit(order.status) || canCancel(order.status)) && <div className="new-order-actions">{canEdit(order.status) && <button onClick={() => { setEditing(order.id); setDraft({ ...order.customer }); setMessage(''); }}>Edit delivery details</button>}{canCancel(order.status) && <button className="is-danger" onClick={async () => { if (!window.confirm('Cancel this order? This cannot be undone.')) return; try { onOrderChange(await cancelCustomerOrder(order, user.email || 'Customer')); setMessage('Order cancelled.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not cancel this order.'); } }}>Cancel order</button>}</div>}{editing === order.id && draft && <div className="new-address-editor"><p className="new-kicker">Update delivery details</p><div className="new-form-grid"><label className="wide">Street address<input required value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} /></label><label>City<input required value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label><label>Preferred window<input required value={draft.deliveryWindow} onChange={(event) => setDraft({ ...draft, deliveryWindow: event.target.value })} /></label></div><div className="new-order-actions"><button onClick={async () => { try { onOrderChange(await updateCustomerOrder(order, draft, user.email || 'Customer')); setEditing(null); setDraft(null); setMessage('Delivery details updated.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not update the delivery details.'); } }}>Save details</button><button onClick={() => { setEditing(null); setDraft(null); }}>Close</button></div></div>}</article>)}</div>}{message && <p className="new-form-alert" role="status">{message}</p>}</section></main>;
}

function InspirationPage() {
  return <main className="new-page new-journal"><div className="new-journal-head"><div><p className="new-kicker">FurniVision / Journal</p><h1>Stay a<br /><em>while.</em></h1></div><p>A field guide to rooms with texture, rhythm, and signs of a life well lived.</p></div><div className="new-journal-grid"><article className="new-journal-feature"><img src="/assets/hero-room.jpg" alt="Layered living room" /><p className="new-kicker">Brooklyn / 07:42</p><h2>A room with a pulse</h2><p>A bottle-green anchor, a little morning light, and nowhere to rush.</p></article><article><img src="/assets/room-detail.jpg" alt="Quiet room detail" /><p className="new-kicker">Copenhagen / 18:10</p><h2>Keep the quiet</h2><p>On the beauty of leaving the edges unresolved.</p></article><article><img src="/assets/frame-15.jpg" alt="Small table in a room" /><p className="new-kicker">New York / 12:26</p><h2>The useful object</h2><p>Small tables, big jobs, no fuss.</p></article></div></main>;
}

function NotFound() {
  return <main className="new-page new-empty new-empty--page"><p className="new-kicker">404 / Wrong room</p><h1>Nothing<br /><em>here.</em></h1><ButtonLink href="/">Return home</ButtonLink></main>;
}

function StoreFooter() {
  return <footer className="new-footer"><div className="new-footer__top"><div><Link href="/" className="new-logo"><span>furni</span><em>vision</em></Link><p>Objects with a point of view.<br />Made for the lived-in life.</p></div><div><p className="new-kicker">Explore</p><Link href="/furniture">Furniture</Link><Link href="/inspiration">Journal</Link><Link href="/account">Your account</Link></div><div><p className="new-kicker">Visit</p><p>18 Walker Street<br />New York, NY 10013<br /><em>By appointment</em></p></div><div><p className="new-kicker">Keep close</p><p>Seasonal notes, new pieces,<br />and rooms worth returning to.</p><form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Your email" aria-label="Email address" required /><button aria-label="Subscribe"><ArrowUpRight size={16} /></button></form></div></div><div className="new-footer__bottom"><span>© 2026 FurniVision Studio</span><span>New York / Everywhere</span></div></footer>;
}

export function RedesignedStorefront(props: StorefrontProps) {
  const [bagOpen, setBagOpen] = useState(false);
  return <div className="new-storefront"><StoreHeader count={props.cartItems.length} user={props.user} onCart={() => setBagOpen(true)} /><Switch><Route path="/"><HomePage {...props} /></Route><Route path="/furniture"><FurniturePage {...props} /></Route><Route path="/furniture/category/:categorySlug"><CollectionPage {...props} /></Route><Route path="/furniture/:productId"><ProductPage {...props} /></Route><Route path="/checkout"><CheckoutPage {...props} /></Route><Route path="/account"><AccountPage {...props} /></Route><Route path="/inspiration"><InspirationPage /></Route><Route component={NotFound} /></Switch><StoreFooter /><BagDrawer items={props.cartItems} open={bagOpen} onClose={() => setBagOpen(false)} onRemove={props.onRemove} onIncrement={props.onIncrement} onDecrement={props.onDecrement} /></div>;
}