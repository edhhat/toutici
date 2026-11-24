export const runtime = 'edge';

/* Coordonnées du responsable (obligatoires selon la Loi 25) :
   ajoute ici une adresse ou un lien vers un formulaire de contact.
   Tant que c'est vide, la ligne « Coordonnées » n'est pas affichée. */
const CONTACT = 'edhhat@gmail.com';

export const metadata = { title: 'Politique de confidentialité – ToutIci' };

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
        <h1 className="text-3xl font-semibold tracking-tight">Politique de confidentialité</h1>
        <p className="text-xs text-white/50">Dernière mise à jour : 24 novembre 2026</p>

        <section>
          <h2 className="text-lg font-semibold mb-1">Renseignements recueillis</h2>
          <p className="text-white/75 leading-relaxed">ToutIci ne demande ni compte ni renseignement personnel. Le site compte les visites au moyen d’un compteur de visiteurs. Si vous cliquez sur « Afficher la météo à ma position », votre navigateur vous demande d’abord l’autorisation de partager votre position. Elle n’est utilisée que pour afficher la météo locale : les coordonnées sont arrondies, transmises à OpenWeather pour obtenir la météo et à OpenStreetMap pour afficher un extrait de carte et trouver le nom de votre ville, et ne sont pas conservées par ToutIci.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Services tiers</h2>
          <p className="text-white/75 leading-relaxed">Pour afficher la météo, le nom de la ville consultée est transmis à OpenWeather. Les photos et descriptions des personnalités proviennent de Wikimedia/Wikipédia, et votre navigateur charge ces images directement depuis leurs serveurs. Ces services ont leur propre politique de confidentialité.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Hébergement</h2>
          <p className="text-white/75 leading-relaxed">Le site est hébergé sur Cloudflare, qui peut traiter des données techniques (adresse IP, journaux) pour assurer le fonctionnement et la sécurité du service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Témoins (cookies)</h2>
          <p className="text-white/75 leading-relaxed">ToutIci n’utilise pas de témoins publicitaires.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Vos droits</h2>
          <p className="text-white/75 leading-relaxed">Vous pouvez demander l’accès, la correction ou la suppression de tout renseignement vous concernant en communiquant avec le propriétaire du site, Eddy Huart.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">
            Responsable de la protection des renseignements personnels
          </h2>
          <p className="text-white/75 leading-relaxed">
            Eddy Huart, propriétaire de ToutIci, est responsable de la
            protection des renseignements personnels. Il veille au respect de
            la présente politique et traite les demandes d’accès, de
            rectification ou de suppression ainsi que les questions ou plaintes
            liées à vos renseignements personnels.
          </p>
          {CONTACT && (
            <p className="mt-2 text-white/75 leading-relaxed">
              Coordonnées : {CONTACT}
            </p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Modifications</h2>
          <p className="text-white/75 leading-relaxed">Cette politique peut être mise à jour. La version en vigueur est celle publiée sur cette page.</p>
        </section>

        <p className="pt-4 text-xs text-white/50">
          © {new Date().getFullYear()} Eddy Huart. Tous droits réservés.
        </p>
      </article>
    </main>
  );
}
