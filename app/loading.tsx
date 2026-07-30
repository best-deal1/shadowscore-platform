export default function Loading() {
  return <main className="flex min-h-[60vh] items-center justify-center bg-black px-6 text-white" aria-busy="true" aria-live="polite"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-red-400 motion-reduce:animate-none" aria-hidden="true" /><p className="mt-4 font-bold text-zinc-300">Loading page...</p></div></main>;
}
