import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BarChart3, Check, ChevronDown, ImagePlus, MapPin, Package, Pencil, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, Upload, X, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { ensureFirstUserAdmin, isCurrentUserAdmin } from './lib/auth';
import { deleteCatalogProduct, loadCatalog, saveCatalogProduct, type CatalogProduct } from './lib/admin';
import { loadAllOrders, orderStatuses, saveDeliveryProof, updateOrderStatus, uploadDeliveryProof, type StoreOrder } from './lib/orders';
import { defaultSiteContent, loadSiteContent, saveSiteContent, type SiteContent } from './lib/site-content';
import type { User } from 'firebase/auth';

const emptyProduct: Omit<CatalogProduct, 'id'> = {
  name: '', collection: 'Living room', price: 0, material: '', image: '/assets/hero-room.jpg',
  color: '#d8ddd3', description: '', dimensions: '', stock: 0, badge: '',
};
const money = (value: number) => `${value.toLocaleString('en-US')}`;
const imageOptions = [
  ['/assets/hero-room.jpg', 'Hero room'], ['/assets/alto-recliner.jpg', 'Alto recliner'], ['/assets/arc-shoe-rack.jpg', 'Arc shoe rack'],
  ['/assets/atelier-kitchen.jpg', 'Atelier kitchen'], ['/assets/cloud-mattress.jpg', 'Cloud mattress'], ['/assets/column-wardrobe.jpg', 'Column wardrobe'],
  ['/assets/halo-lounge-chair.jpg', 'Halo lounge chair'], ['/assets/linea-tv-unit.jpg', 'Linea TV unit'], ['/assets/mesa-dining-table.jpg', 'Mesa dining table'],
  ['/assets/nest-bed.jpg', 'Nest bed'], ['/assets/sol-pendant.jpg', 'Sol pendant'],
] as const;

export function AdminDashboard({ user, onCatalogChange }: { user: User | null; onCatalogChange: () => Promise<void> }) {
  const [, setLocation] = useLocation();
  const [admin, setAdmin] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [product, setProduct] = useState<(Omit<CatalogProduct, 'id'> & { id?: string })>(emptyProduct);
  const [query, setQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('All');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [proofOrder, setProofOrder] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);

  const refresh = async () => {
    const [catalog, allOrders, siteContent] = await Promise.all([loadCatalog(), loadAllOrders(), loadSiteContent()]);
    setProducts(catalog || []);
    setOrders(allOrders);
    if (siteContent) setContent(siteContent);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      try {
        await ensureFirstUserAdmin(user);
        const allowed = await isCurrentUserAdmin();
        if (active) {
          setAdmin(allowed);
          if (allowed) await refresh();
          else setMessage('This account is not the storefront owner.');
        }
      } catch {
        if (active) setMessage('Admin access could not be verified. Make sure Firestore rules are deployed.');
      }
    })();
    return () => { active = false; };
  }, [user]);

  const filteredProducts = useMemo(() => products.filter((item) => `${item.name} ${item.collection} ${item.material}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const filteredOrders = useMemo(() => orderFilter === 'All' ? orders : orders.filter((item) => item.status === orderFilter), [orders, orderFilter]);

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await saveCatalogProduct(product);
      await refresh();
      await onCatalogChange();
      setProduct(emptyProduct);
      setMessage('Product saved and published.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Product could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (item: CatalogProduct) => {
    if (!window.confirm(`Delete ${item.name}? This removes it from the storefront.`)) return;
    try {
      await deleteCatalogProduct(item.id);
      await refresh();
      await onCatalogChange();
      setMessage('Product removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Product could not be removed.');
    }
  };

  const moveOrder = async (order: StoreOrder, status: string) => {
    try {
      await updateOrderStatus(order.id, status, user?.email || 'Storefront owner');
      await refresh();
      setMessage(`Order ${order.id} moved to ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Order status could not be updated.');
    }
  };

  const saveProof = async (order: StoreOrder, file: File | undefined, notes: string) => {
    if (!file && !notes.trim()) return;
    setBusy(true);
    try {
      const url = file ? await uploadDeliveryProof(order.id, file) : undefined;
      await saveDeliveryProof(order.id, url, notes, user?.email || 'Storefront owner');
      await refresh();
      setProofOrder(null);
      setMessage('Delivery proof saved and order marked delivered.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delivery proof could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const saveWebsite = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await saveSiteContent(content);
      setMessage('Website content saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Website content could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-20 text-center"><div><ShieldCheck className="mx-auto mb-5 text-[hsl(var(--accent))]" size={34} /><h1 className="font-display text-5xl">Admin sign in required.</h1><p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Use your storefront owner account to manage products and orders.</p><Link href="/account" className="mt-7 inline-flex bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))]">Open account</Link></div></main>;
  if (!admin) return <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-20 text-center"><div><ShieldCheck className="mx-auto mb-5 text-[hsl(var(--accent))]" size={34} /><h1 className="font-display text-5xl">Owner access only.</h1><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{message || 'This signed-in account is not the store owner.'}</p><Link href="/" className="mt-7 inline-flex border-b border-[hsl(var(--foreground))] pb-2 text-sm font-semibold">Return to storefront</Link></div></main>;

  const lowStock = products.filter((item) => item.stock <= 3).length;
  const stats: Array<{ label: string; value: string | number; Icon: LucideIcon }> = [
    { label: 'Products', value: products.length, Icon: Package },
    { label: 'Orders', value: orders.length, Icon: BarChart3 },
    { label: 'Low stock', value: lowStock, Icon: Package },
    { label: 'Revenue', value: money(orders.filter((item) => item.status !== 'Cancelled').reduce((sum, item) => sum + item.total, 0)), Icon: Check },
  ];
  return <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-14">
    <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[hsl(var(--border))] pb-8"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">FurniVision / Control room</p><h1 className="mt-4 font-display text-6xl leading-[.9] tracking-[-.05em]">Run the<br /><em>store.</em></h1></div><div className="flex gap-3"><button onClick={refresh} className="inline-flex items-center gap-2 border border-[hsl(var(--border))] px-4 py-3 text-sm font-semibold"><RefreshCw size={15} /> Refresh</button><Link href="/" className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))]">View storefront</Link></div></div>
    {message && <p className="mt-5 border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] px-4 py-3 text-sm" role="status">{message}</p>}
    <section className="mt-8 grid gap-4 md:grid-cols-4">{stats.map(({ label, value, Icon }) => <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" key={label}><Icon size={18} className="text-[hsl(var(--accent))]" /><p className="mt-5 font-mono-ui text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">{label}</p><strong className="mt-2 block font-display text-4xl">{String(value)}</strong></div>)}</section>
    <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_.85fr]">
      <section><div className="flex items-end justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">Catalog</p><h2 className="mt-2 font-display text-4xl">Products</h2></div><button onClick={() => setProduct(emptyProduct)} className="inline-flex items-center gap-2 bg-[hsl(var(--accent))] px-4 py-3 text-sm font-semibold text-white"><Plus size={15} /> New product</button></div><div className="mt-5 flex items-center gap-2 border-b border-[hsl(var(--foreground)/.3)] pb-2"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="w-full bg-transparent text-sm outline-none" /></div><div className="mt-5 grid gap-3">{filteredProducts.map((item) => <article className="flex items-center gap-4 border-b border-[hsl(var(--border))] py-3" key={item.id}><img src={item.image} alt="" className="h-16 w-16 object-cover" /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.name}</strong><span className="text-xs text-[hsl(var(--muted-foreground))]">{item.collection} · {money(item.price)} · {item.stock} in stock</span></div><button onClick={() => setProduct(item)} aria-label={`Edit ${item.name}`} className="p-2"><Pencil size={15} /></button><button onClick={() => removeProduct(item)} aria-label={`Delete ${item.name}`} className="p-2 text-[hsl(var(--destructive))]"><Trash2 size={15} /></button></article>)}</div></section>
      <form onSubmit={saveProduct} className="h-fit border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5 md:p-7"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">{product.id ? 'Edit product' : 'New product'}</p><h2 className="mt-2 font-display text-4xl">{product.id ? 'Refine it.' : 'Add a piece.'}</h2></div>{product.id && <button type="button" onClick={() => setProduct(emptyProduct)} aria-label="Close editor"><X size={18} /></button>}</div><div className="mt-7 grid gap-4"><div className="grid gap-2"><label className="grid gap-2 text-xs font-semibold">Quick image<select value={product.image} onChange={(event) => setProduct({ ...product, image: event.target.value })}><option value="">Choose an image</option>{imageOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><p className="text-[11px] text-[hsl(var(--muted-foreground))]">Choose from the included catalog images, or keep using the custom URL field below.</p></div><label className="grid gap-2 text-xs font-semibold">Product name<input required value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} /></label><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-xs font-semibold">Collection<input required value={product.collection} onChange={(event) => setProduct({ ...product, collection: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Material<input required value={product.material} onChange={(event) => setProduct({ ...product, material: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Price<input required min="0" type="number" value={product.price} onChange={(event) => setProduct({ ...product, price: Number(event.target.value) })} /></label><label className="grid gap-2 text-xs font-semibold">Stock<input required min="0" type="number" value={product.stock} onChange={(event) => setProduct({ ...product, stock: Number(event.target.value) })} /></label></div><label className="grid gap-2 text-xs font-semibold">Image URL<input required value={product.image} onChange={(event) => setProduct({ ...product, image: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Dimensions<input required value={product.dimensions} onChange={(event) => setProduct({ ...product, dimensions: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Description<textarea required rows={3} value={product.description} onChange={(event) => setProduct({ ...product, description: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Badge (optional)<input value={product.badge || ''} onChange={(event) => setProduct({ ...product, badge: event.target.value })} /></label><button disabled={busy} className="inline-flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-60"><Save size={15} /> {busy ? 'Saving…' : 'Save and publish'}</button></div></form>
    </div>
    <section className="mt-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">Fulfilment</p><h2 className="mt-2 font-display text-4xl">Orders</h2></div><label className="flex items-center gap-2 text-sm">Filter <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}><option>All</option>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={14} /></label></div><div className="mt-5 grid gap-4">{filteredOrders.map((order) => <article className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" key={order.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{order.id} · {new Date(order.createdAt).toLocaleString()}</p><h3 className="mt-2 text-lg font-semibold">{order.customer.firstName} {order.customer.lastName}</h3><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{order.customer.email} · {order.customer.city}</p></div><strong>{money(order.total)}</strong></div><div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[hsl(var(--border))] pt-4"><span className="text-sm">{order.items.map((item) => item.name).join(', ')}</span><select value={order.status} onChange={(event) => moveOrder(order, event.target.value)} className="ml-auto"><option>{order.status}</option>{orderStatuses.filter((status) => status !== order.status).map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => setProofOrder(proofOrder === order.id ? null : order.id)} className="inline-flex items-center gap-2 border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold"><Upload size={14} /> Delivery proof</button></div>{proofOrder === order.id && <DeliveryProofForm order={order} busy={busy} onSave={saveProof} />}</article>)}{filteredOrders.length === 0 && <p className="border border-dashed border-[hsl(var(--border))] p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">No orders match this filter.</p>}</div></section>
<section className="mt-14 border-t border-[hsl(var(--border))] pt-10"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">Website content</p><h2 className="mt-2 font-display text-4xl">Edit the homepage</h2><p className="mt-3 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">Only the storefront owner can save these fields. Customers see the changes on the public homepage after refresh.</p></div><form onSubmit={saveWebsite} className="mt-6 grid max-w-3xl gap-4 border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5 md:p-7"><label className="grid gap-2 text-xs font-semibold">Announcement<input value={content.announcement} onChange={(event) => setContent({ ...content, announcement: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Hero eyebrow<input value={content.heroEyebrow} onChange={(event) => setContent({ ...content, heroEyebrow: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Hero title<textarea rows={2} value={content.heroTitle} onChange={(event) => setContent({ ...content, heroTitle: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Hero body<textarea rows={3} value={content.heroBody} onChange={(event) => setContent({ ...content, heroBody: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Marquee<input value={content.marquee} onChange={(event) => setContent({ ...content, marquee: event.target.value })} /></label><label className="grid gap-2 text-xs font-semibold">Footer note<input value={content.footerNote} onChange={(event) => setContent({ ...content, footerNote: event.target.value })} /></label><button disabled={busy} className="inline-flex w-fit items-center gap-2 bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-60"><Save size={15} /> {busy ? 'Saving…' : 'Save website content'}</button></form></section>
  </main>;
}

function DeliveryProofForm({ order, busy, onSave }: { order: StoreOrder; busy: boolean; onSave: (order: StoreOrder, file: File | undefined, notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState(order.proofOfDelivery?.notes || '');
  const [file, setFile] = useState<File>();
  return <div className="mt-5 grid gap-4 border-t border-[hsl(var(--border))] pt-5 md:grid-cols-[1fr_1fr_auto]"><label className="grid gap-2 text-xs font-semibold">Completion notes<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><label className="grid gap-2 text-xs font-semibold">Photo<input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0])} /></label><button disabled={busy} onClick={() => onSave(order, file, notes)} className="self-end inline-flex items-center justify-center gap-2 bg-[hsl(var(--accent))] px-4 py-3 text-sm font-semibold text-white"><ImagePlus size={15} /> Save proof</button></div>;
}