// app/lnh/page.tsx
// Même page que /nhl, accessible aussi par /lnh
import NhlPage from '../nhl/page';

export const runtime = 'edge';

export const metadata = {
  title: 'LNH en direct : résultats et classement · ToutIci',
  description: 'Tous les résultats de la LNH en direct et le classement à jour.',
  // Indique à Google que l'adresse principale est /nhl (évite le contenu en double)
  alternates: { canonical: 'https://toutici.ca/nhl' },
};

export default NhlPage;
