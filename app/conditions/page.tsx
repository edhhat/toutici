export const runtime = 'edge';

export const metadata = { title: 'Conditions d’utilisation – ToutIci' };

export default function Page() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-5 py-10 text-white"
      style={{ background: 'linear-gradient(180deg, #0b1026 0%, #1b2250 55%, #3a3470 100%)' }}
    >
      <article className="w-full max-w-xl space-y-6">
        <a href="/" className="text-sm text-white/60 hover:text-white hover:underline">
          ← Retour à ToutIci
        </a>
        <h1 className="text-3xl font-semibold tracking-tight">Conditions d’utilisation</h1>
        <p className="text-xs text-white/50">Dernière mise à jour : 24 novembre 2026</p>

        <section>
          <h2 className="text-lg font-semibold mb-1">Acceptation</h2>
          <p className="text-white/75 leading-relaxed">En utilisant ToutIci, vous acceptez les présentes conditions. Si vous n’êtes pas d’accord, veuillez ne pas utiliser le site.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Service</h2>
          <p className="text-white/75 leading-relaxed">ToutIci affiche des informations météo et des renseignements d’intérêt général. Ces informations sont fournies à titre indicatif, sans garantie d’exactitude ni de disponibilité. Ne vous y fiez pas pour des décisions critiques ou liées à la sécurité.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Propriété intellectuelle</h2>
          <p className="text-white/75 leading-relaxed">Le site, son nom, son logo et son design appartiennent à Eddy Huart. Toute reproduction sans autorisation est interdite. Les données météo proviennent d’OpenWeather et les textes sur les personnalités de Wikipédia, qui demeurent soumis à leurs propres licences.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Limitation de responsabilité</h2>
          <p className="text-white/75 leading-relaxed">Le propriétaire de ToutIci ne peut être tenu responsable des dommages résultant de l’utilisation du site ou de l’impossibilité de l’utiliser.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Modifications</h2>
          <p className="text-white/75 leading-relaxed">Ces conditions peuvent être modifiées en tout temps. La version en vigueur est celle publiée sur cette page.</p>
        </section>

        <p className="pt-4 text-xs text-white/50">
          © {new Date().getFullYear()} Eddy Huart. Tous droits réservés.
        </p>
      </article>
    </main>
  );
}
