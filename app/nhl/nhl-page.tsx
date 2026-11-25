// app/nhl/page.tsx
import NhlLive from '../components/NhlLive';

export const runtime = 'edge';

export const metadata = {
  title: 'LNH en direct : résultats et classement · ToutIci',
  description: 'Tous les résultats de la LNH en direct et le classement à jour.',
};

export default function NhlPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center gap-5 px-4 py-8 text-white"
      style={{ background: 'linear-gradient(180deg, #0b2447 0%, #19376d 50%, #576cbc 100%)' }}
    >
      <div className="w-full max-w-6xl">
        <a href="/" className="text-sm text-white/80 hover:text-white hover:underline">
          ← Accueil
        </a>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight drop-shadow">
          LNH · Résultats et classement en direct
        </h1>
        <p className="mt-1 text-white/80 text-sm">
          Mise à jour automatique toutes les 20 secondes.
        </p>
      </div>

      <div className="w-full max-w-6xl">
        <NhlLive />
      </div>

      <footer className="w-full max-w-6xl mt-4 pt-6 border-t border-white/25 text-center text-xs leading-relaxed text-white/80">
        <nav
          aria-label="Liens du pied de page"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
        >
          <a href="/" className="hover:underline">Accueil</a>
          <a href="/conditions" className="hover:underline">Conditions d’utilisation</a>
          <a href="/confidentialite" className="hover:underline">Politique de confidentialité</a>
        </nav>
        <p className="mt-4">Données : LNH (api-web.nhle.com). Site non affilié à la LNH.</p>
        <p className="mt-3">© {new Date().getFullYear()} Eddy Huart. Tous droits réservés.</p>
      </footer>
    </main>
  );
}
