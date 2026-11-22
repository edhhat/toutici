// app/components/AdBanner.tsx

export default function AdBanner({ label = 'Espace publicitaire' }: { label?: string }) {
  return (
    <div className="max-w-4xl mx-auto my-8 p-4 bg-slate-100 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
      {label} (AdSense / Affiliation)
    </div>
  );
}