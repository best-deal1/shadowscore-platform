export default function Loading() {
  return <main className="product-page-loading" aria-busy="true" aria-live="polite"><div className="product-loading-shell"><div className="product-loading-kicker" /><div className="product-loading-title" /><div className="product-loading-copy" /><div className="product-loading-grid"><span /><span /><span /></div><p className="sr-only">Loading page</p></div></main>;
}
