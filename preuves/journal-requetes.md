# Journal des requêtes HTTP observées

Capture réelle effectuée sur l’application Angular connectée au backend Express (compte de démonstration).
Les valeurs du JWT et les corps contenant des identifiants ne sont volontairement pas enregistrés.

| Méthode | URL | Statut | Type de réponse | Authorization | Corps envoyé |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | 401 | application/json | absent | oui (non enregistré) |
| POST | `/api/auth/login` | 200 | application/json | absent | oui (non enregistré) |
| GET | `/api/tracks?page=1&limit=5` | 200 | application/json | Bearer <masqué> | non |
| POST | `/api/tracks` | 201 | application/json | Bearer <masqué> | non |
| GET | `/api/tracks?page=1&limit=5` | 200 | application/json | Bearer <masqué> | non |
| GET | `/api/tracks/6ae768d478b8bdde81d8d289/audio` | 200 | audio/mpeg | Bearer <masqué> | non |
| DELETE | `/api/tracks/6ae768d478b8bdde81d8d289` | 204 | text/plain | Bearer <masqué> | non |
| GET | `/api/tracks?page=1&limit=5` | 200 | application/json | Bearer <masqué> | non |
| GET | `/api/users/me` | 200 | application/json | Bearer <masqué> | non |
| PUT | `/api/users/me` | 200 | application/json | Bearer <masqué> | oui (non enregistré) |
