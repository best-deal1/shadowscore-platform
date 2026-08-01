"use client";

export default function ArchiveError({ reset }: { reset: () => void }) {
  return <section className="workspace-empty-state" role="alert"><span aria-hidden="true">!</span><h1>Archive could not be loaded</h1><p>Try loading this page again.</p><button type="button" onClick={reset}>Try again</button></section>;
}
