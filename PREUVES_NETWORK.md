# Preuves Network et captures — TP1, TP2, TP3

Ces captures ont été réalisées sur l'application réelle :

- frontend Angular : `http://localhost:4200` ;
- backend Express : `http://localhost:3000` ;
- compte de démonstration : `demo@example.com` ;
- navigateur : Google Chrome, fenêtre 1440 × 1100.

Le JWT et les corps contenant des identifiants ne sont jamais affichés : le journal
indique seulement la présence de l'en-tête `Authorization` et masque sa valeur.

## TP1 — Authentification, profil et routes protégées

| Preuve | Fichier | Ce que l'on observe |
|---|---|---|
| Connexion refusée | [`preuves/01-connexion-refusee.png`](preuves/01-connexion-refusee.png) | `POST /api/auth/login` répond **401** et le message « Identifiants incorrects » est affiché. |
| Connexion réussie | [`preuves/02-bibliotheque-page1.png`](preuves/02-bibliotheque-page1.png) | `POST /api/auth/login` répond **200**, le token est stocké et la navigation passe à `/tracks`. |
| Lecture du profil | [`preuves/08-profil.png`](preuves/08-profil.png) | `GET /api/users/me` répond **200** avec `Authorization: Bearer <masqué>`. |
| Modification du profil | [`preuves/09-profil-modifie.png`](preuves/09-profil-modifie.png) | `PUT /api/users/me` répond **200** et la bannière « Nom mis à jour avec succès ! » apparaît. |

Sur les routes publiques (`/api/auth/login`), l'en-tête `Authorization` est absent.
Sur les routes protégées (`/api/tracks`, `/api/users/me`, `/api/tracks/:id/audio`,
`DELETE /api/tracks/:id`), il est présent.

## TP2 — Validation, upload et lecture audio

| Preuve | Fichier | Ce que l'on observe |
|---|---|---|
| Pagination page 1 | [`preuves/10-pagination-page1.png`](preuves/10-pagination-page1.png) | `GET /api/tracks?page=1&limit=5` répond **200** ; 8 morceaux au total, bouton « Précédent » désactivé. |
| Pagination page 2 | [`preuves/11-pagination-page2.png`](preuves/11-pagination-page2.png) | Le clic sur « Suivant » émet `GET /api/tracks?page=2&limit=5` (**200**) et affiche « Page 2 sur 2 » ; bouton « Suivant » désactivé. |
| Fichier invalide refusé avant l'appel HTTP | [`preuves/07-fichier-invalide.png`](preuves/07-fichier-invalide.png) | Un fichier texte est refusé localement : aucun `POST /api/tracks` n'est émis. |
| Progression de l'upload | [`preuves/03-upload-progression.png`](preuves/03-upload-progression.png) | `POST /api/tracks` est en cours en `multipart/form-data`, la barre affiche **21 %**, les champs sont désactivés. |
| Succès de l'upload | [`preuves/04-upload-succes.png`](preuves/04-upload-succes.png) | Réponse **201**, SnackBar Angular Material, formulaire vidé et liste rechargée en page 1. |
| Lecture audio authentifiée | [`preuves/05-lecture-audio.png`](preuves/05-lecture-audio.png) | `GET /api/tracks/:id/audio` répond **200** en `audio/mpeg` ; le Blob est converti en `ObjectURL` et lu par la balise `<audio>`. |

Le journal complet des requêtes est disponible dans
[`preuves/journal-requetes.md`](preuves/journal-requetes.md) et
[`preuves/network-log.json`](preuves/network-log.json). La pagination est
détaillée dans [`preuves/journal-pagination.md`](preuves/journal-pagination.md).

## TP3 — Suppression et progression

| Preuve | Fichier | Ce que l'on observe |
|---|---|---|
| Suppression confirmée | [`preuves/06-suppression-succes.png`](preuves/06-suppression-succes.png) | `DELETE /api/tracks/:id` répond **204**, la carte disparaît, la liste est rechargée et la SnackBar confirme la suppression. |
| Upload avec pourcentage | [`preuves/03-upload-progression.png`](preuves/03-upload-progression.png) | Les événements `HttpEventType.UploadProgress` alimentent le pourcentage ; `withXhr()` est nécessaire car le backend `fetch` d'Angular 22 ne rapporte pas la progression d'upload. |

## Vérifications complémentaires

- `npm run build` : succès (0 erreur).
- `npm test` côté frontend : **11 tests / 11 réussis**.
- `npm test` côté backend : **6 tests / 6 réussis**, dont les refus `401` sans JWT,
  `401` avec JWT invalide, `400` sans fichier et `400` pour un type MIME non audio.
