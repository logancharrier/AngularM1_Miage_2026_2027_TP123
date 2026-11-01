# Rapport d'usage de l'IA - TP1, TP2 & TP3

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

## Outils et modèles utilisés

- **Gemini via Antigravity** : utilisé en début de travail pour expliquer les missions, clarifier le fonctionnement d'Angular et d'Express, et discuter des choix techniques.
- **DeepSeek v4.1 Flash via opencode** : utilisé ensuite pour l'implémentation, les corrections et la vérification du code.

---

## Mission 0 — Cartographier l'application

- **Objectif** : Identifier sans modifier le code l'architecture de base du projet Angular (composant racine, routes, HttpClient, modèles, services, pages, intercepteur JWT) et cartographier le flux d'authentification ainsi que le contrat API (routes publiques vs protégées).
- **Prompt principal** : `Analyse le contexte et aide moi à réaliser la mission 0`
- **Plan proposé par l'agent** :
  1. Parcourir et analyser les fichiers sources de `frontend-starter` (`main.ts`, `routes.ts`, `app/shared/*`, `app/components/*`).
  2. Identifier les responsabilités de chaque élément clé : racine, routage, injection de `HttpClient` et intercepteur d'authentification.
  3. Classer les endpoints du contrat HTTP (`API_CONTRACT.md`) en routes publiques vs routes protégées.
  4. Modéliser par un schéma annoté le parcours complet lors du clic sur le bouton « Se connecter » (Composant -> Service -> HTTP -> Proxy -> Backend Express -> MongoDB Atlas -> Réponse -> Signaux / LocalStorage -> Redirection).
  5. Documenter la mission dans ce rapport.
- **Vérifications réalisées par le binôme** :
  - Vérification de la présence de `bootstrapApplication` et `provideHttpClient` dans `src/main.ts`.
  - Contrôle de la configuration du proxy dans `proxy.conf.json` redirigeant `/api` vers `http://localhost:3000`.
  - Inspection de `auth.interceptor.ts` et `auth.guard.ts` pour comprendre l'ajout du JWT et la protection des routes.
- **Erreurs ou propositions rejetées** : Aucune modification de code n'était requise pour cette mission d'observation et de cartographie.
- **Fichiers effectivement consultés / modifiés** :
  - Consultés : `frontend-starter/src/main.ts`, `frontend-starter/src/app/routes.ts`, `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts`, `frontend-starter/src/app/shared/guards/auth.guard.ts`, `frontend-starter/src/app/shared/services/auth.service.ts`, `API_CONTRACT.md`.
  - Créé : [`SCHEMA_FLUX_CONNEXION.md`](SCHEMA_FLUX_CONNEXION.md) (schéma séquentiel Mermaid annoté, tableau des étapes, routes publiques/protégées et comparaison Signal vs localStorage).
  - Modifié : `RAPPORT_IA_MODELE.md`.
- **Preuve de fonctionnement** : Serveur backend actif sur port 3000, frontend Angular servi sur port 4200 via `npm start`. Cartographie complète validée et documentée dans [`SCHEMA_FLUX_CONNEXION.md`](SCHEMA_FLUX_CONNEXION.md).
- **Ce que chaque membre sait maintenant expliquer sans l'agent** :
  - Pourquoi `provideHttpClient(withInterceptors([authInterceptor]))` dans `main.ts` intercepte automatiquement chaque requête HTTP sortante.
  - Le rôle d'un intercepteur fonctionnel (`HttpInterceptorFn`) qui lit le signal de token et injecte l'en-tête `Authorization: Bearer <token>`.
  - La distinction fondamentale entre routes publiques (`/health`, `/auth/register`, `/auth/login`) et routes protégées qui nécessitent le JWT.
  - Le cycle complet de traitement d'un clic de connexion jusqu'à la redirection vers `/tracks`.

---

## Mission 1 — Inscription, Connexion et Profil

- **Objectif** : Implémenter et fiabiliser la couche utilisateur complète du frontend Angular :
  1. Formulaires réactifs pour l'inscription et la connexion avec validations et messages d'erreur compréhensibles.
  2. Appels des endpoints `/api/auth/register` et `/api/auth/login`.
  3. Sauvegarde sécurisée du JWT dans le `localStorage` sans jamais le logger.
  4. Mise à jour réactive des signaux Angular `currentUser` et `token`.
  5. Redirection automatique après authentification (`/tracks`).
  6. Déconnexion avec nettoyage de l'état local dans la barre de navigation et sur le profil.
  7. Chargement systématique du profil via `/api/users/me` lors de l'accès à la page profil.
  8. Modification du nom d'artiste via `PUT /api/users/me` avec réactivité immédiate.
  9. Gestion globale de l'erreur `401 Unauthorized` dans l'intercepteur HTTP avec redirection vers `/login`.

- **Prompt principal** :
  ```text
  aide-moi à faire la mission 1 du TP1 en suivant @SUJET_ETUDIANT_TP1.md 

  je dois compléter l'authentification et le profil dans @frontend-starter :
  - Formulaires réactifs pour le login et le register avec gestion des erreurs et validation (email valide, mot de passe de 8 caractères min pour s'inscrire).
  - Dans AuthService, enregistrer le token dans le localStorage, mettre à jour le signal currentUser et gérer la déconnexion.
  - Dans l'intercepteur, mettre le token dans Authorization et rediriger vers /login si on reçoit une 401.
  - Dans la page profil, charger les données de l'utilisateur avec /api/users/me et permettre de modifier le nom avec PUT.
  - Mettre à jour la barre de navigation avec le bouton de déconnexion.

  Explique moi la démarche étape par étape.
  ```

- **Plan proposé par l'agent** :
  1. **Service d'authentification (`AuthService`)** : Synchroniser le Signal `currentUser` avec le `localStorage` pour persister les sessions et mettre à jour le signal lors des appels `login`, `register`, `profile` et `update`.
  2. **Intercepteur HTTP (`authInterceptor`)** : Intercepter les erreurs `401` pour déclencher `auth.logout()` et rediriger vers `/login` sur expiration ou invalidation du jeton, tout en laissant la page de login afficher ses propres erreurs d'identifiants.
  3. **Composant Racine & Navigation (`AppComponent`)** : Ajouter la gestion réactive de l'état connecté/déconnecté dans le header avec affichage conditionnel des liens et bouton de déconnexion.
  4. **Formulaires réactifs (`LoginPageComponent`, `RegisterPageComponent`)** : Ajouter les validateurs (`required`, `email`, `minLength(8)` pour l'inscription), le blocage de soumission si formulaire invalide (`markAllAsTouched()`), la gestion d'un signal `loading` pour désactiver les boutons pendant les requêtes, et l'affichage des messages d'erreur sous chaque champ.
  5. **Page Profil (`ProfilePageComponent`)** : Implémenter le cycle de vie `OnInit` pour charger automatiquement `/api/users/me`, afficher les informations réactives de l'utilisateur, et gérer le formulaire de modification de nom avec bannières de succès et d'erreur.
  6. **Design et Feuilles de style (`styles.css`, `app.css`)** : Définir les classes `.field-error`, `.input-invalid`, `.error-banner`, `.success-banner` et styliser les boutons d'action.
  7. **Validation & Preuves** : Compiler avec `ng build`, exécuter les tests de bout en bout des requêtes HTTP (Network Checkpoint), et documenter les résultats.

- **Vérifications réalisées par le binôme** :
  - Compilation réussie du bundle Angular via `ng build` (0 erreurs TypeScript ou templates).
  - Validation du fonctionnement du proxy Angular redirigeant `/api` vers `http://localhost:3000`.
  - Exécution en direct des requêtes HTTP et inspection des statuts, corps et en-têtes (voir tableau des preuves ci-dessous).
  - Vérification de l'absence de tout log de jeton JWT ou de mot de passe dans la console navigateur (`console.log`).

- **Erreurs ou propositions rejetées** :
  - *Rejeté :* Utiliser une redirection globale sur 401 pour toutes les requêtes y compris `/api/auth/login`. Cela provoquait la perte des messages d'erreur de formulaire ("Identifiants incorrects"). Solution adoptée : exclure `/api/auth/login` de la redirection automatique de l'intercepteur afin que le composant de login puisse afficher l'alerte à l'utilisateur.
  - *Erreur résolue :* L'utilisation du pipe `slice` dans le template `profile-page.html` sans importation autonome a été détectée lors de `ng build` (`NG8004: No pipe found with name 'slice'`). Corrigé immédiatement en ajoutant `SlicePipe` aux `imports` du composant standalone `ProfilePageComponent`.

- **Fichiers effectivement modifiés** :
  - `frontend-starter/src/app/shared/services/auth.service.ts` : Restauration de l'utilisateur stocké, mise à jour réactive des signaux et persistance locale.
  - `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts` : Capture d'erreur `401`, déconnexion et redirection vers `/login`.
  - `frontend-starter/src/app/components/app/app.ts` & `app.html` & `app.css` : Navigation conditionnelle réactive, bouton de déconnexion et style de navigation active.
  - `frontend-starter/src/app/components/login-page/login-page.ts` & `login-page.html` : Validations complètes, gestion du signal `loading`, messages d'erreur par champ.
  - `frontend-starter/src/app/components/register-page/register-page.ts` & `register-page.html` : Formulaire avec contrainte de mot de passe à 8 caractères (`minLength(8)`), signaux d'état et messages de validation.
  - `frontend-starter/src/app/components/profile-page/profile-page.ts` & `profile-page.html` : Chargement automatique au cycle de vie `ngOnInit`, modification du nom, bannières d'alerte et bouton de déconnexion.
  - `frontend-starter/src/styles.css` : Styles partagés pour les bannières d'erreur/succès, erreurs de validation de formulaire et états de boutons.
  - `RAPPORT_IA_MODELE.md` : Mise à jour du rapport de suivi.

- **Preuve de fonctionnement (Checkpoint Network)** :

| Cas testé | Méthode | URL | Corps JSON envoyé | Statut HTTP | Header `Authorization` présent ? | Réponse reçue |
|---|---|---|---|---|---|---|
| **1. Connexion refusée** | `POST` | `/api/auth/login` | `{"email":"demo@example.com","password":"WrongPassword123!"}` | `401 Unauthorized` | Non | `{"message":"Identifiants incorrects"}` |
| **2. Connexion réussie** | `POST` | `/api/auth/login` | `{"email":"demo@example.com","password":"Demo1234!"}` | `200 OK` | Non | `{"token":"...","user":{"id":"...","name":"Demo","email":"demo@example.com"}}` |
| **3. Lecture du profil** | `GET` | `/api/users/me` | Aucun | `200 OK` | Oui (`Bearer <JWT>`) | `{"id":"...","name":"Demo","email":"demo@example.com","createdAt":"..."}` |
| **4. Modification du nom** | `PUT` | `/api/users/me` | `{"name":"Guitar Hero Demo"}` | `200 OK` | Oui (`Bearer <JWT>`) | `{"id":"...","name":"Guitar Hero Demo","email":"demo@example.com","createdAt":"..."}` |
| **5. Jeton invalide / expiré** | `GET` | `/api/users/me` | Aucun | `401 Unauthorized` | Oui (`Bearer invalid_token`) | `{"message":"Jeton invalide ou expiré"}` (déclenche redirection `/login`) |

  Captures réelles : [`preuves/01-connexion-refusee.png`](preuves/01-connexion-refusee.png),
  [`preuves/02-bibliotheque-page1.png`](preuves/02-bibliotheque-page1.png),
  [`preuves/08-profil.png`](preuves/08-profil.png) et
  [`preuves/09-profil-modifie.png`](preuves/09-profil-modifie.png).

- **Réponses aux questions du sujet** :
  - *Quel modèle utilisez-vous dans votre assistant IA ?* : deux usages complémentaires : **Gemini via Antigravity** pour comprendre les missions et discuter des choix, puis **`deepseek-v4.1-flash-free` via opencode** pour l'implémentation et la vérification. Aucun des deux ne remplace la relecture et la validation humaines.
  - *Comment savoir combien vous avez consommé de tokens ?* : Via les métadonnées d'utilisation de l'API (`usageMetadata.totalTokenCount`), les logs d'exécution de l'assistant (`transcript.jsonl`), ou par estimation (1 token ≈ 4 caractères en anglais, environ 0.75 mot).
  - *Qui peut vous conseiller quel est le meilleur modèle pour une tâche donnée ?* : Les benchmarks spécialisés (LMSYS Chatbot Arena, SWE-bench), la documentation officielle des fournisseurs (Google DeepMind, Anthropic, OpenAI) qui distingue les modèles "Reasoning/Pro" (raisonnement architectural) des modèles "Flash/Mini" (vitesse et itérations), et les outils d'évaluation automatisés (ex: Promptfoo).
  - *Quelles sont les différentes routes du backend qui sont utilisées ?* :
    - `GET /api/health` : santé du serveur Express.
    - `POST /api/auth/register` : inscription d'un utilisateur.
    - `POST /api/auth/login` : authentification et obtention du JWT.
    - `GET /api/users/me` : consultation du profil connecté.
    - `PUT /api/users/me` : modification du nom de l'utilisateur.
    - `GET /api/tracks` : liste des morceaux de musique.
    - `POST /api/tracks` : téléversement de fichier audio.
    - `GET /api/tracks/:id/audio` : streaming audio de la piste.
    - `DELETE /api/tracks/:id` : suppression d'une piste (TP3).
  - *Où s'effectue la tâche « mise à jour du profil utilisateur », dans quels fichiers côté back et côté front ?* :
    - **Côté Frontend :**
      1. [`profile-page.html`](frontend-starter/src/app/components/profile-page/profile-page.html) : Formulaire de saisie du nouveau nom.
      2. [`profile-page.ts`](frontend-starter/src/app/components/profile-page/profile-page.ts) : Méthode `save()` validant le formulaire et appelant `this.auth.update()`.
      3. [`auth.service.ts`](frontend-starter/src/app/shared/services/auth.service.ts) : Méthode `update(name)` effectuant `http.put<User>('/api/users/me', { name })` et mettant à jour le signal `currentUser`.
      4. [`auth.interceptor.ts`](frontend-starter/src/app/shared/interceptors/auth.interceptor.ts) : Injection de `Authorization: Bearer <token>`.
    - **Côté Backend :**
      1. [`backend/src/app.js`](backend/src/app.js) (lignes 249–268) : Route `app.put("/api/users/me", auth, async (req, res, next) => { ... })` validant le JWT, appelant `User.findByIdAndUpdate` sur MongoDB Atlas, et retournant l'utilisateur public mis à jour.

- **Ce que chaque membre sait maintenant expliquer sans l'agent** :
  - La différence fondamentale entre un **Signal Angular** (état réactif volatile en mémoire RAM qui notifie automatiquement le template lors d'un `set()`) et le **`localStorage`** (stockage persistant sur disque fourni par l'API Web du navigateur, sans réactivité native).
  - Pourquoi le composant Angular ne doit jamais appeler `HttpClient` directement, mais toujours déléguer au service `AuthService` avec l'injection moderne par `inject()`.
  - Comment l'intercepteur HTTP centralise la gestion du jeton JWT et la réaction aux codes de statut `401 Unauthorized`.
  - La gestion complète des `FormGroup` réactifs avec validation synchrone (`Validators.required`, `Validators.email`, `Validators.minLength(8)`) et affichage conditionnel des erreurs d'accessibilité.

---

# TP2 — Bibliothèque Upload et Lecture Audio

## Mission 2 — Bibliothèque paginée

- **Objectif** :
  - Implémenter une bibliothèque audio robuste avec pagination gérée côté serveur via `GET /api/tracks?page=...&limit=...`.
  - Piloter l'état de la bibliothèque exclusivement à l'aide de **Signals Angular** : `tracks`, `page`, `pages`, `total`, `loading`, `error`.
  - Afficher les données avec le nouveau bloc déclaratif `@for`, l'état vide avec `@empty` et le chargement avec `@if`.
  - Gérer les boutons « Précédent » et « Suivant » avec désactivation stricte aux bornes (`page <= 1` et `page >= pages`) et déclenchement d'une nouvelle requête HTTP à chaque navigation (interdiction formelle du découpage local dans Angular).

- **Plan proposé par l'agent** :
  1. **Service (`TrackService`)** : Vérifier que la méthode `list(page, limit)` envoie réellement les query params `{ page, limit }` via `HttpClient.get<Page<Track>>('/api/tracks', { params: { page, limit } })`.
  2. **Composant (`TracksPageComponent`)** :
     - Déclarer les Signals `tracks = signal<Track[]>([])`, `page = signal(1)`, `pages = signal(1)`, `total = signal(0)`, `loading = signal(false)`, `error = signal<string | null>(null)`.
     - Créer la méthode `load()` qui active l'indicateur de chargement et met à jour les signaux de retour.
     - Créer la méthode `go(targetPage)` avec vérification des bornes (`1 <= targetPage <= pages`).
  3. **Template (`tracks-page.html`)** :
     - Remplacer l'ancien affichage basique par une structure moderne utilisant `@for (track of tracks(); track track.id)`, `@empty` et `@if (loading())`.
     - Intégrer la barre de pagination affichant `Page {{ page() }} sur {{ pages() }}` avec boutons accessibles.
  4. **Validation** : Vérifier dans l'onglet Réseau (Network) du navigateur que chaque clic sur « Suivant » ou « Précédent » émet bien une requête avec le nouveau paramètre `page`.

- **Vérifications réalisées par le binôme** :
  - Contrôle dans les outils de développement (Network) : les requêtes passent bien de `?page=1&limit=5` à `?page=2&limit=5`.
  - Vérification de l'interdiction du découpage local : le serveur renvoie exactement 5 éléments (`items.length <= 5`) et le composant ne stocke en mémoire que la page active.
  - Test aux limites : le bouton « Précédent » est bien grisé et inactif en page 1, et le bouton « Suivant » est grisé dès que `page === pages`.

- **Erreurs ou propositions rejetées** :
  - *Rejeté :* Charger l'ensemble des morceaux puis faire une pagination locale par `tracks.slice(...)`. Le sujet interdit explicitement cette pratique pour préserver les performances et la consommation réseau.
  - *Proposition améliorée :* Ajout d'un badge indiquant le nombre total réel de pistes (`total`) renvoyé par l'agrégation backend `Track.countDocuments()`.

- **Fichiers effectivement modifiés** :
  - [`frontend-starter/src/app/shared/services/track.service.ts`](frontend-starter/src/app/shared/services/track.service.ts) : Vérification de la transmission des paramètres de pagination `page` et `limit`.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.ts`](frontend-starter/src/app/components/tracks-page/tracks-page.ts) : Définition des signaux d'état, méthodes de pagination et de chargement.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.html`](frontend-starter/src/app/components/tracks-page/tracks-page.html) : Templating réactif avec `@for`, `@empty`, `@if` et contrôles de pagination.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.css`](frontend-starter/src/app/components/tracks-page/tracks-page.css) : Styles de la barre de pagination et des états de boutons.

- **Preuve de fonctionnement (Checkpoint Network Pagination)** :
  Captures réelles : [`preuves/10-pagination-page1.png`](preuves/10-pagination-page1.png) et
  [`preuves/11-pagination-page2.png`](preuves/11-pagination-page2.png).
  Journal : [`preuves/journal-pagination.md`](preuves/journal-pagination.md).

| Action utilisateur | Méthode | URL demandée | Statut | Réponse JSON (extraits) | Résultat UI |
|---|---|---|---|---|---|
| Chargement initial | `GET` | `/api/tracks?page=1&limit=5` | `200 OK` | `{"items":[...],"page":1,"limit":5,"total":8,"pages":2}` | Affiche les 5 premiers morceaux, bouton Préc. désactivé |
| Clic « Suivant » | `GET` | `/api/tracks?page=2&limit=5` | `200 OK` | `{"items":[...],"page":2,"limit":5,"total":8,"pages":2}` | Affiche les 3 morceaux restants, bouton Suiv. désactivé |
| Clic « Précédent » | `GET` | `/api/tracks?page=1&limit=5` | `200 OK` | `{"items":[...],"page":1,"limit":5,"total":8,"pages":2}` | Retour aux 5 premiers morceaux |

- **Ce que chaque membre sait maintenant expliquer sans l'agent** :
  - Comment lier un signal `page` à une requête `HttpClient` pour rafraîchir dynamiquement l'affichage serveur.
  - Pourquoi la pagination serveur est indispensable dès que le volume de données augmente (économie de mémoire vive et de bande passante).
  - L'avantage des blocs déclaratifs Angular 17+ (`@for`, `@empty`, `@if`) par rapport aux anciennes directives structurelles (`*ngFor`, `*ngIf`).

---

## Mission 3 — Analyse, amélioration de l'upload et lecture audio

- **Objectif** :
  - **Validation frontend rigoureuse** : Contrôler la validité du fichier audio avant tout appel HTTP (formats autorisés : MP3, WAV, OGG, M4A ; taille max : 25 Mo).
  - **Amélioration de l'UX d'upload** : Afficher un état d'envoi (`uploading`), empêcher les doubles soumissions (désactivation du bouton), afficher les erreurs du serveur ou le message de succès, puis vider le formulaire et recharger la première page.
  - **Interface en Cards responsives et soignées** : Remplacer l'affichage minimaliste par des cartes modernes (titre, nom original, format, taille lisible, date d'ajout, boutons d'action).
  - **Design professionnel sans émojis** : Utiliser des **icônes vectorielles SVG intégrées** (style Feather / Lucide) à la place des émojis pour tous les éléments interactifs et informatifs.
  - **Lecture audio sécurisée & gestion mémoire** : Télécharger le flux audio authentifié via `responseType: 'blob'`, générer un `ObjectURL` pour la balise `<audio>`, afficher le morceau en cours de lecture et révoquer impérativement l'URL finale à la destruction du composant (`ngOnDestroy`) pour éviter toute fuite mémoire.
  - **Fonctionnalité complémentaire** : Implémenter la suppression d'une piste avec confirmation via `DELETE /api/tracks/:id` et rafraîchissement automatique.

- **Plan proposé par l'agent** :
  1. **Validation côté client (`choose`)** :
     - Vérifier la taille : `file.size <= 25 * 1024 * 1024` (25 Mo).
     - Vérifier le type MIME et l'extension du fichier (`audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/mp4`, `audio/x-m4a` / `.mp3`, `.wav`, `.ogg`, `.m4a`).
     - Afficher un message d'erreur immédiat et vider l'input si invalide.
  2. **Envoi multipart (`upload`)** :
     - Construire le `FormData` avec exactement `audio` (File) et `title` (texte).
     - Passer `uploading` à `true` pour désactiver les contrôles.
     - À la réussite : afficher la bannière de succès, réinitialiser le champ titre et l'input fichier, basculer sur la page 1 et appeler `load()`.
  3. **Lecture audio sécurisée (`play`) & Nettoyage (`ngOnDestroy`)** :
     - Si une `audioUrl` précédente existe, la révoquer immédiatement avec `URL.revokeObjectURL(previousUrl)`.
     - Appeler `TrackService.audio(track.id)` avec `responseType: 'blob'`.
     - Créer l'URL locale du Blob : `URL.createObjectURL(blob)` et l'affecter au lecteur `<audio>`.
     - Implémenter `OnDestroy` dans `TracksPageComponent` pour exécuter `URL.revokeObjectURL` lors du démontage du composant.
  4. **Suppression de piste (`deleteTrack`)** :
     - Ajouter la méthode `delete(id)` dans `TrackService`.
     - Demander confirmation à l'utilisateur, appeler l'API, stopper la lecture si c'était le morceau actif, et recharger la liste.
  5. **Élimination des émojis au profit d'icônes SVG intégrées** :
     - Remplacer tous les émojis (`🎵`, `⏳`, `⬆`, `🔄`, `📁`, `⚖`, `📅`, `🔊`, `▶`, `🗑`, `🎸`) par des tracés vectoriels SVG (`icon`, `icon-sm`) exploitant `currentColor`.

- **Vérifications réalisées par le binôme** :
  - **Validation client** : Tentative de sélection d'un fichier de plus de 25 Mo ou d'un fichier `.pdf` / `.txt` : le message d'erreur s'affiche immédiatement en rouge sans émettre de requête réseau inutile.
  - **Vérification multipart** : L'inspecteur réseau montre bien une requête `POST /api/tracks` de type `multipart/form-data` contenant les champs `audio` et `title`.
  - **Vérification JWT sur l'audio** : La requête `GET /api/tracks/:id/audio` émise par `HttpClient` contient bien l'en-tête `Authorization: Bearer <token>` grâce à l'intercepteur.
  - **Nettoyage mémoire** : Vérification dans le code et en console de la libération des URLs d'objets (`blob:http://localhost:4200/...`) lors d'un changement de piste et au changement de route.
  - **Suppression** : Morceau supprimé via `DELETE /api/tracks/:id` avec réponse `204 No Content` et disparition immédiate de la carte.

- **Erreurs ou propositions rejetées** :
  - *Rejeté :* Utiliser des émojis standard dans l'interface. Rejeté pour garantir un rendu graphique épuré, professionnel et homogène entre les navigateurs ; remplacé par des icônes SVG intégrées avec animation CSS de rotation (`spin`) pour les chargements.
  - *Rejeté :* Mettre directement l'URL d'API dans la propriété `src` de l'élément `<audio>` (`<audio src="/api/tracks/:id/audio">`). Cela échoue systématiquement car le lecteur natif ne transmet pas le token JWT dans les en-têtes HTTP (erreur 401).

- **Fichiers effectivement modifiés** :
  - [`frontend-starter/src/app/shared/services/track.service.ts`](frontend-starter/src/app/shared/services/track.service.ts) : Ajout de la méthode `delete(id: string)` pour appeler `DELETE /api/tracks/:id`.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.ts`](frontend-starter/src/app/components/tracks-page/tracks-page.ts) :
    - Validations frontend (formats autorisés et limite de 25 Mo).
    - Gestion des états d'upload (`uploading`, `uploadSuccess`, `uploadError`, `fileValidationError`).
    - Implémentation du cycle de vie `OnDestroy` pour révoquer l'`ObjectURL`.
    - Méthodes d'action `play()`, `deleteTrack()`, et formateurs d'affichage lisibles (`formatSize`, `formatDate`, `formatBadge`).
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.html`](frontend-starter/src/app/components/tracks-page/tracks-page.html) :
    - Interface complète en cards responsives.
    - Bannières d'alerte, zone d'aperçu de fichier, lecteur audio stylisé.
    - Intégration d'icônes SVG nettes pour chaque action (upload, refresh, fichier, disque, date, écoute, suppression, pagination).
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.css`](frontend-starter/src/app/components/tracks-page/tracks-page.css) :
    - Mise en page responsive (grille 2 colonnes / mobile 1 colonne).
    - Styles des cartes de morceaux, des badges de formats, du lecteur audio sombre et des animations de rotation des icônes.

- **Identification précise du flux upload et lecture** :

  | Opération | Fichier et méthode |
  |---|---|
  | Choix du fichier | `tracks-page.html` : `<input type="file" (change)="choose($event)">` ; `tracks-page.ts:choose()` |
  | Validation taille / type | `tracks-page.ts:choose()` avec `MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES`, `ALLOWED_EXTENSIONS` |
  | Construction du `FormData` | `track.service.ts:upload()` : `body.append('audio', file)` et `body.append('title', title)` |
  | Appel HTTP d'upload | `track.service.ts:upload()` : `http.post<Track>('/api/tracks', body, { reportProgress: true, observe: 'events' })` |
  | Récupération du `Blob` | `track.service.ts:audio()` : `http.get(..., { responseType: 'blob' })` |
  | Création de l'`ObjectURL` | `tracks-page.ts:play()` : `URL.createObjectURL(blob)` |
  | Affectation au lecteur | `tracks-page.html` : `<audio [src]="audioUrl()" controls autoplay (error)="onAudioError()">` |
  | Révocation de l'ancienne URL | `tracks-page.ts:revokeCurrentAudioUrl()`, appelée dans `play()` et `ngOnDestroy()` |

- **Contrôles déjà présents côté backend** :
  - `backend/src/app.js` : `MAX_FILE_SIZE = 25 * 1024 * 1024` et `limits: { fileSize: MAX_FILE_SIZE }` dans `multer` ;
  - `allowed` contient `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/ogg`, `audio/mp4`, `audio/x-m4a` ;
  - `upload.single("audio")` exige le champ multipart `audio` ; `req.body.title` lit le titre ;
  - la taille, le type MIME et la présence du fichier sont donc vérifiés une seconde fois par le serveur.

  La validation frontend améliore l'expérience (message immédiat, aucune requête inutile) mais ne remplace jamais la validation backend : une requête peut être forgée avec `curl` ou Postman en contournant totalement Angular.

- **Preuve de fonctionnement (Checkpoint Network Upload & Audio)** :

| Cas testé | Méthode | URL demandée | En-têtes particuliers | Statut HTTP | Résultat obtenu |
|---|---|---|---|---|---|
| Fichier > 25 Mo sélectionné | - | Aucune (bloqué en local) | - | - | Message d'erreur immédiat affiché, bouton bloqué |
| Envoi piste valide (MP3, 3 Mo) | `POST` | `/api/tracks` | `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` | `201 Created` | Piste enregistrée, formulaire vidé, actualisation page 1 |
| Lecture audio authentifiée | `GET` | `/api/tracks/:id/audio` | `Authorization: Bearer <token>` | `200 OK` (audio/mpeg) | Blob binaire reçu, URL `blob:` créée, lecture active |
| Suppression de piste | `DELETE` | `/api/tracks/:id` | `Authorization: Bearer <token>` | `204 No Content` | Métadonnée et fichier supprimés, liste rafraîchie |

  Captures réelles : [`preuves/07-fichier-invalide.png`](preuves/07-fichier-invalide.png),
  [`preuves/03-upload-progression.png`](preuves/03-upload-progression.png),
  [`preuves/04-upload-succes.png`](preuves/04-upload-succes.png) et
  [`preuves/05-lecture-audio.png`](preuves/05-lecture-audio.png).

- **Réponses aux questions sur mémoire, buffering et streaming** :

  1. *Le backend envoie-t-il le fichier entier en mémoire ou peut-il l’envoyer progressivement depuis le disque ?*  
     **Réponse :** Le backend Express utilise `res.sendFile()`, qui s'appuie en interne sur les flux de lecture Node.js (`fs.createReadStream`). Le fichier est donc lu par petits blocs (*chunks*) depuis le disque dur et acheminé progressivement sur le socket réseau HTTP, **sans charger l'intégralité du fichier (jusqu'à 25 Mo) en mémoire RAM du serveur**.

  2. *Avec `HttpClient` et `responseType: "blob"`, à quel moment le composant reçoit-il généralement le fichier ?*  
     **Réponse :** Le composant Angular ne reçoit le `Blob` qu'**une fois le téléchargement HTTP totalement terminé**. Le navigateur assemble tous les paquets réseau reçus en un objet binaire complet avant de résoudre l'Observable `HttpClient`.

  3. *Si la bibliothèque contient 100 morceaux, les 100 fichiers audio sont-ils chargés en mémoire dès l'affichage de la liste ? Justifier la réponse à partir du code.*  
     **Réponse :** **Non, absolument pas.** Le code de `load()` appelle uniquement `GET /api/tracks?page=...&limit=5`, qui n'interroge MongoDB que pour récupérer les **métadonnées textuelles** (titre, nom, taille, date) de 5 morceaux par page. Les fichiers audio ne sont transférés que lorsque l'utilisateur clique individuellement sur le bouton « Écouter » d'une carte, déclenchant alors `this.service.audio(track.id)`.

  4. *Quelle différence y aurait-il avec 100 éléments `<audio>` utilisant directement une URL HTTP ?*  
     **Réponse :** Si 100 éléments `<audio src="...">` étaient instanciés directement dans le DOM, le navigateur tenterait d'ouvrir 100 connexions concurrentes pour précharger les métadonnées audio et les premiers blocs de données (en-têtes HTTP `Range`). Cela saturerait inutilement la bande passante et le serveur. De plus, les requêtes directes du navigateur ne bénéficieraient pas de l'en-tête `Authorization: Bearer <token>`, provoquant 100 erreurs HTTP 401.

  5. *Pourquoi l'URL créée par `URL.createObjectURL` doit-elle être révoquée ?*  
     **Réponse :** Lorsqu'on appelle `URL.createObjectURL(blob)`, le navigateur associe une URL interne (`blob:http://...`) au `Blob` binaire conservé en mémoire vive (RAM). Tant que cette URL n'est pas explicitement libérée avec `URL.revokeObjectURL()`, le ramasse-miettes (*Garbage Collector*) a l'interdiction de détruire le `Blob`, ce qui entraîne une **fuite de mémoire** progressive à chaque nouveau morceau écouté.

- **Ce que chaque membre sait maintenant expliquer sans l'agent** :
  - Pourquoi la validation côté client est indispensable pour l'expérience utilisateur (retour visuel instantané, économie de bande passante), mais ne dispense en aucun cas de la validation côté serveur (sécurité face aux requêtes forgées).
  - Le cycle de vie d'une ressource binaire dans le navigateur : `HttpClient` -> `Blob` en mémoire RAM -> `URL.createObjectURL()` -> lecture par `<audio [src]>` -> `URL.revokeObjectURL()` lors du remplacement ou du `ngOnDestroy()`.
  - La raison technique pour laquelle une balise `<audio src="...">` native ne peut pas directement consommer une API protégée par jeton Bearer sans passer par un proxy ou par un `Blob` pré-authentifié.

---

# TP3 — Fiabilisation et enrichissement du frontend

## Mission 5 — Suppression d’une piste

- **Objectif** :
  - Ajouter une action « Supprimer » dans chaque card de piste via `TrackService.delete(id)`.
  - Demander une confirmation explicite à l'utilisateur avant toute suppression (`confirm()`).
  - Gérer un état de suppression réactif (`deletingId`) pour désactiver les contrôles et empêcher les doubles clics.
  - Afficher un message de succès ou d’erreur via le composant **Angular Material `MatSnackBar`**.
  - Mettre à jour le contenu de la page après suppression (avec recul d'une page si la dernière page devient vide).
  - Gérer les cas limites : piste inexistante (404 Not Found) ou tentative d'accès non autorisé (403 Forbidden).

- **Plan proposé par l'agent** :
  1. **Service (`TrackService`)** : Encapsuler l'appel HTTP `DELETE /api/tracks/:id` retournant un `Observable<void>`.
  2. **Composant (`TracksPageComponent`)** :
     - Ajouter le Signal `deletingId = signal<string | null>(null)` et `snackbarMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null)`.
     - Si la piste supprimée était en cours de lecture, stopper l'audio et révoquer l'ObjectURL.
     - Dans le callback de suppression, gérer le réajustement de pagination et le réaffichage via `this.load()`.
     - Intercepter les erreurs HTTP (404/403) et afficher un message adapté dans la SnackBar.
    3. **Template & Style (`tracks-page.html`, `tracks-page.css`, `styles.css`)** :
      - Bouton de suppression avec icône SVG corbeille, état désactivé et spinner animé quand la suppression est en cours.
      - SnackBar Angular Material (`MatSnackBar.open`) avec durée de 4,5 s, bouton « Fermer » et classes `snackbar-success` / `snackbar-error` pour la couleur.

- **Vérifications réalisées par le binôme** :
  - Clic sur « Supprimer » -> ouverture de la boîte de dialogue de confirmation.
  - Annulation -> aucune requête HTTP n'est émise.
  - Confirmation -> requête `DELETE /api/tracks/:id` émise avec l'en-tête `Authorization: Bearer <token>`.
  - Réception du statut `204 No Content` -> affichage de la SnackBar de succès et disparition immédiate de la carte.
  - Test d'erreur 404 simulé -> affichage de l'alerte « Cette piste a déjà été supprimée ou est introuvable. » et synchronisation de la liste.

- **Erreurs ou propositions rejetées** :
  - *Rejeté :* Appeler directement `HttpClient.delete` dans le composant `TracksPageComponent`. Le sujet interdit expressément cela : toute logique réseau doit passer par `TrackService`.
  - *Rejeté :* S'appuyer uniquement sur la disparition visuelle du bouton pour sécuriser la suppression : expliquer pourquoi le guard et l'interface ne suffisent pas (le backend Express effectue la vérification réelle de propriété `ownerId === req.auth.sub`).

- **Fichiers effectivement modifiés** :
  - [`frontend-starter/src/app/shared/services/track.service.ts`](frontend-starter/src/app/shared/services/track.service.ts) : Définition de `delete(id)`.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.ts`](frontend-starter/src/app/components/tracks-page/tracks-page.ts) : Gestion de `deletingId`, messages SnackBar, recul de page et gestion d'erreurs 404/403.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.html`](frontend-starter/src/app/components/tracks-page/tracks-page.html) : Composant SnackBar et bouton de suppression avec état de chargement.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.css`](frontend-starter/src/app/components/tracks-page/tracks-page.css) : Styles du bouton de suppression et de son état de chargement.
  - [`frontend-starter/src/styles.css`](frontend-starter/src/styles.css) : Couleurs des panneaux `MatSnackBar` succès/erreur.

- **Preuve de fonctionnement (Checkpoint Network Suppression)** :

| Action utilisateur | Méthode HTTP | URL demandée | En-têtes particuliers | Statut | Résultat UI |
|---|---|---|---|---|---|
| Annulation confirmation | - | Aucune requête émise | - | - | La carte reste intacte |
| Confirmation suppression | `DELETE` | `/api/tracks/67...` | `Authorization: Bearer <token>` | `204 No Content` | SnackBar verte « Piste supprimée », carte retirée |
| Suppression piste déjà retirée | `DELETE` | `/api/tracks/unknown` | `Authorization: Bearer <token>` | `404 Not Found` | SnackBar rouge « Cette piste a déjà été supprimée ou est introuvable » |

  Capture réelle : [`preuves/06-suppression-succes.png`](preuves/06-suppression-succes.png).

---

## Mission 6 — Progression de l’upload

- **Objectif** :
  - Faire évoluer l'upload HTTP classique vers une gestion asynchrone par événements de progression (`reportProgress: true`, `observe: 'events'`).
  - Distinguer clairement les 4 états du cycle de transfert :
    1. Absence d'upload en cours (`uploadProgress === null`, `uploading === false`).
    2. Upload en cours avec affichage dynamique du pourcentage (`uploadProgress = 0..100%`).
    3. Réussite de l'envoi (`uploadSuccess`, réinitialisation du formulaire, rechargement page 1).
    4. Échec du transfert (`uploadError`, SnackBar d'erreur, conservation des saisies).
  - Désactiver les contrôles de saisie pendant le transfert pour empêcher toute double soumission.
  - Garantir l'absence totale de journalisation de données sensibles (pas de token ni de mot de passe affichés).

- **Plan proposé par l'agent** :
  1. **Service (`TrackService`)** : Configurer les options HTTP `{ reportProgress: true, observe: 'events' }` sur `HttpClient.post<Track>('/api/tracks', body)`.
  2. **Composant (`TracksPageComponent`)** :
     - Gérer les types d'événements `HttpEventType.UploadProgress` et `HttpEventType.Response`.
     - Calculer le pourcentage d'avancement : `Math.round((100 * event.loaded) / event.total)`.
     - Mettre à jour le signal `uploadProgress`.
  3. **Interface utilisateur (`tracks-page.html`, `tracks-page.css`)** :
     - Intégrer une barre de progression visuelle avec pourcentage en temps réel (`progress-bar-bg`, `progress-bar-fill`).
     - Modifier le texte du bouton en « Envoi (X%)… » avec spinner animé pendant l'envoi.

- **Vérifications réalisées par le binôme** :
  - Sélection d'un fichier audio valide (ex: MP3 de 3,5 Mo) et soumission.
  - La barre de progression s'affiche et s'incrémente de façon fluide jusqu'à 100%.
  - Dès réception de la réponse finale (`HttpEventType.Response`), le formulaire est remis à zéro et la liste des pistes de la page 1 est actualisée avec le nouveau morceau.
  - Le bouton d'envoi et les champs de formulaire restent inaccessibles (`disabled`) durant tout le transfert.

- **Erreurs ou propositions rejetées** :
  - *Rejeté :* Traiter l'upload comme un Observable HTTP classique à émission unique. En mode standard, `HttpClient` n'émet qu'une seule fois à la réception complète de la réponse, ce qui rend impossible le suivi en temps réel de la progression réseau.
  - *Point technique important :* Angular 22 utilise `fetch` par défaut pour `HttpClient`, or le backend `fetch` ne sait pas rapporter la progression d'un upload. `withXhr()` a donc été ajouté à `provideHttpClient()` dans `main.ts` pour revenir au backend `XMLHttpRequest`, seul capable d'émettre `HttpEventType.UploadProgress`.

- **Fichiers effectivement modifiés** :
  - [`frontend-starter/src/main.ts`](frontend-starter/src/main.ts) : Ajout de `withXhr()` pour activer les événements de progression d'upload.
  - [`frontend-starter/src/app/shared/services/track.service.ts`](frontend-starter/src/app/shared/services/track.service.ts) : Activation de `reportProgress: true` et `observe: 'events'` dans `upload()`.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.ts`](frontend-starter/src/app/components/tracks-page/tracks-page.ts) : Écoute des événements `HttpEventType`, calcul du pourcentage et gestion des signaux `uploadProgress` et `uploading`.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.html`](frontend-starter/src/app/components/tracks-page/tracks-page.html) : Affichage conditionnel de la barre de progression accessible avec `role="progressbar"`.
  - [`frontend-starter/src/app/components/tracks-page/tracks-page.css`](frontend-starter/src/app/components/tracks-page/tracks-page.css) : Styles et transitions de remplissage de la barre de progression.

- **Preuve de fonctionnement (Checkpoint Network Progression)** :

| Événement HTTP | Type d'événement Angular | Valeurs observées | Impact visuel |
|---|---|---|---|
| Début du transfert | `HttpEventType.Sent` | Événement initial émis | Bouton passe à `disabled`, affichage de la jauge |
| Transfert partiel | `HttpEventType.UploadProgress` | `loaded = 1572864, total = 3145728` | Barre à 50%, libellé « Envoi (50%)… » |
| Fin du transfert | `HttpEventType.UploadProgress` | `loaded = 3145728, total = 3145728` | Barre à 100% |
| Réponse serveur | `HttpEventType.Response` | Statut `201 Created`, JSON de la piste | SnackBar verte de succès, réinitialisation du formulaire, rechargement page 1 |

  Capture réelle : [`preuves/03-upload-progression.png`](preuves/03-upload-progression.png)
  (21 % pendant l'envoi) et [`preuves/04-upload-succes.png`](preuves/04-upload-succes.png).

---

## Mission 7 — Tests automatisés

- **Objectif** :
  - Mettre en place une suite de tests unitaires automatisés pour le frontend Angular, reproductibles, isolés et ultra-rapides.
  - Tester les services, intercepteurs et guards clés sans dépendre d'un backend Express ni d'une base MongoDB.
  - Vérifier les URLs, méthodes HTTP, paramètres de requête, en-têtes d'autorisation et redirections simulées.

- **Plan proposé par l'agent** :
  1. **Environnement de test** : Exploiter le moteur d'exécution moderne Vitest (fourni dans le projet) configuré en environnement Node direct (`vitest run --environment node`), évitant ainsi l'installation de dépendances lourdes ou externes.
  2. **Tests de `TrackService`** :
     - Vérifier que `list(page, limit)` cible `GET /api/tracks` avec les paramètres `page` et `limit`.
     - Vérifier que `delete(id)` cible `DELETE /api/tracks/:id`.
     - Vérifier que `upload(file, title)` construit le `FormData` avec `audio` et `title` et demande `reportProgress`.
     - Vérifier que `audio(id)` demande le flux avec `responseType: 'blob'`.
  3. **Tests de `AuthService`** :
     - Vérifier que `login(email, password)` émet une requête `POST /api/auth/login` avec le bon payload et met à jour le token et `currentUser`.
     - Vérifier que `logout()` réinitialise les signaux `token` et `currentUser` ainsi que le `localStorage`.
  4. **Tests de `authInterceptor`** :
     - Vérifier l'ajout de l'en-tête `Authorization: Bearer <token>` si un jeton est présent.
     - Vérifier l'absence d'en-tête `Authorization` si aucun jeton n'est stocké.
     - Vérifier la capture de l'erreur `401 Unauthorized` déclenchant `auth.logout()` et la redirection vers `/login`.
  5. **Tests de `authGuard`** :
     - Vérifier l'autorisation d'accès (`true`) si un jeton est présent.
     - Vérifier le blocage et la redirection vers `/login` (`UrlTree`) si aucun jeton n'existe.
  6. **Configuration du script de test** : Adapter le script `"test"` dans `package.json` pour lancer instantanément tous les tests avec `npm test`.

- **Vérifications réalisées par le binôme** :
  - Exécution de `npm test` : **11 tests réussis sur 11** répartis dans 4 suites de tests, exécutés en moins de 500 millisecondes.
  - Vérification de l'isolation : les tests s'exécutent avec succès même avec le backend et MongoDB éteints.
  - Vérification de non-régression du build Angular : `npm run build` s'exécute avec succès en 1,28 seconde (0 erreurs).

- **Erreurs ou propositions rejetées** :
  - *Rejeté :* Installer des packages DOM superflus (`jsdom`) alors que l'exécution sous environnement Node avec Angular Core Injection (`Injector.create`, `runInInjectionContext`) permet de tester 100% de la logique métier et HTTP sans aucune surcharge.
  - *Erreur résolue :* Une erreur de compilation TypeScript (`TS2345: Property 'createdAt' is missing`) a été immédiatement corrigée dans le mock de `User` lors de l'exécution du build.

- **Fichiers créés / modifiés** :
  - [`frontend-starter/src/app/shared/services/track.service.spec.ts`](frontend-starter/src/app/shared/services/track.service.spec.ts) : Tests unitaires de `TrackService` (pagination et suppression).
  - [`frontend-starter/src/app/shared/services/auth.service.spec.ts`](frontend-starter/src/app/shared/services/auth.service.spec.ts) : Tests unitaires de `AuthService` (login, payload et logout).
  - [`frontend-starter/src/app/shared/interceptors/auth.interceptor.spec.ts`](frontend-starter/src/app/shared/interceptors/auth.interceptor.spec.ts) : Tests d'interception du Bearer token et de gestion du statut 401.
  - [`frontend-starter/src/app/shared/guards/auth.guard.spec.ts`](frontend-starter/src/app/shared/guards/auth.guard.spec.ts) : Tests de protection de route et redirection vers `/login`.
  - [`frontend-starter/package.json`](frontend-starter/package.json) : Intégration de `"test": "vitest run --environment node"`.

- **Rapport des tests automatisés (Résultats observés)** :

| Fichier de test | Test exécuté | Résultat attendu | Résultat observé | Durée |
|---|---|---|---|---|
| `track.service.spec.ts` | `list() transmet page et limit` | `GET /api/tracks?page=2&limit=5` émis | Conforme | 7 ms |
| `track.service.spec.ts` | `delete() appelle DELETE` | `DELETE /api/tracks/track-abc` émis | Conforme | 1 ms |
| `track.service.spec.ts` | `upload() construit le FormData` | Champs `audio` + `title`, options `reportProgress` | Conforme | 2 ms |
| `track.service.spec.ts` | `audio() demande un blob` | `responseType: 'blob'` sur `/audio` | Conforme | 1 ms |
| `auth.service.spec.ts` | `login() transmet credentials et stocke token` | `POST /api/auth/login`, signaux mis à jour | Conforme | 9 ms |
| `auth.service.spec.ts` | `logout() nettoie token et storage` | `token` et `currentUser` à `null` | Conforme | 1 ms |
| `auth.interceptor.spec.ts` | `ajoute l'en-tête Authorization` | En-tête `Authorization: Bearer ...` présent | Conforme | 4 ms |
| `auth.interceptor.spec.ts` | `ne modifie pas l'en-tête si sans token` | Aucun en-tête `Authorization` injecté | Conforme | 1 ms |
| `auth.interceptor.spec.ts` | `déclenche logout et redirection sur 401` | Appel `logout()` et redirection `/login` | Conforme | 2 ms |
| `auth.guard.spec.ts` | `autorise navigation si token existe` | Renvoie `true` | Conforme | 3 ms |
| `auth.guard.spec.ts` | `redirige vers /login si sans token` | Renvoie un `UrlTree` vers `/login` | Conforme | 1 ms |
| **TOTAL** | **11 tests exécutés** | **100% de succès** | **11 passed (4 suites)** | **~350 ms** |

### Extension backend (facultative) — tests de contrat et de sécurité

Quatre tests ont été ajoutés à `backend/test/api.test.js` sans modifier les routes :

- une route protégée renvoie `401` sans JWT ;
- une route protégée renvoie `401` avec un JWT invalide ;
- un upload sans fichier renvoie `400` ;
- un fichier de type MIME non audio renvoie `400`.

Résultat observé : **6 tests backend réussis sur 6** avec `npm test`.

### Preuves Network et captures

Les captures réelles (connexion refusée, connexion réussie, upload à 21 %, succès,
lecture audio, suppression, profil et fichier invalide) sont dans le dossier
[`preuves/`](preuves) et détaillées dans [`PREUVES_NETWORK.md`](PREUVES_NETWORK.md).
Le journal HTTP complet est dans
[`preuves/journal-requetes.md`](preuves/journal-requetes.md).

---

## Réponses aux questions du sujet (TP3)

1. **Pourquoi la suppression passe-t-elle par un service ?**  
   Pour respecter le principe de séparation des responsabilités (SoC) : le composant gère uniquement l'affichage et les interactions utilisateur (confirmation, état de chargement, notification), tandis que `TrackService` encapsule l'URL, la méthode HTTP, le formatage des requêtes et les modèles de données. Cela permet également de tester la logique réseau indépendamment du DOM.

2. **Comment le backend protège-t-il la suppression ?**  
   La sécurité repose entièrement sur le backend Express :
   - Le middleware `auth` décode et vérifie la signature cryptographique du JWT.
   - La requête Mongoose `Track.findOneAndDelete({ _id: req.params.id, ownerId: req.auth.sub })` s'assure que la piste appartient bien à l'utilisateur demandeur (`ownerId === req.auth.sub`). Même si un utilisateur malveillant modifie le code Angular ou tente d'envoyer un `DELETE` via Postman sur l'ID d'une autre piste, le serveur renvoie `404 Not Found`.

3. **Comment Angular calcule-t-il le pourcentage d’upload ?**  
   Grâce à l'option `{ reportProgress: true, observe: 'events' }`, `HttpClient` écoute les événements de niveau socket émis par **XMLHttpRequest** (`HttpEventType.UploadProgress`). Le backend `fetch`, utilisé par défaut par Angular 22, ne rapporte pas la progression d'upload ; c'est pourquoi `withXhr()` est présent dans `main.ts`. Chaque événement contient le nombre d'octets déjà envoyés (`event.loaded`) et le nombre total d'octets du fichier (`event.total`). Le pourcentage est calculé par la formule :  
   $$\text{Progression (\%)} = \text{Math.round}\left(\frac{100 \times \text{event.loaded}}{\text{event.total}}\right)$$

4. **Pourquoi les tests HTTP n’ont-ils pas besoin de MongoDB ?**  
   Les tests frontend vérifient le **contrat de communication** (quelle URL est appelée, avec quel verbe, quels paramètres et quel en-tête), et non la persistance réelle en base de données. En simulant (*mocking*) `HttpClient`, les tests fournissent des réponses immédiates en mémoire, garantissant des tests déterministes, autonomes et exécutables en quelques millisecondes sans dépendance d'infrastructure.

5. **Ce que vérifie un test d’intercepteur ou de guard :**  
   - Le test de guard vérifie la logique d'autorisation : laisser passer la navigation si un jeton existe (`true`), ou bloquer et rediriger vers la page de connexion (`/login`) si l'utilisateur est anonyme.
   - Le test d'intercepteur vérifie que le jeton d'authentification est correctement extrait du service et greffé dans les en-têtes HTTP de chaque requête sortante, et que les erreurs d'expiration (401) provoquent la purge de session.

6. **Quelle différence existe entre un test unitaire et un test d’intégration ?**  
   - Un **test unitaire** valide une unité isolée de code (une fonction, une méthode de service, un guard) en bouchonnant (*mocking*) toutes ses dépendances extérieures pour tester son comportement intrinsèque.
   - Un **test d’intégration** vérifie l'interaction conjointe de plusieurs composants du système (par exemple le composant graphique interagissant avec le vrai service, le proxy réseau, le serveur backend Express et la base de données MongoDB Atlas).



