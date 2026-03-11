## Architecture

Aucun nouveau fichier, aucune nouvelle dépendance. Deux modifications chirurgicales dans le backend.

### Champ `pdf_local_path` sur `Impaye`

Ajouté uniquement pour les impayés `source: 'upload'`. Contient le chemin absolu du fichier tel que retourné par multer (`file.path`), ex. `/home/oswald/Desktop/marki16/storage/uploads/1714000000000-123456789-facture-001.pdf`.

Ce champ est transmis depuis le frontend dans les données d'import (`pdf_path: f.storedPath`) et déjà reçu par `importImpayes` — il suffit de le persister.

### Logique de l'endpoint `/api/pdf/:impayelId`

```
GET /api/pdf/:impayelId
  │
  ├─ Charger Impaye (Parse, masterKey)
  │    └─ 404 si inexistant
  │
  ├─ source === 'upload' ?
  │    ├─ lire pdf_local_path
  │    ├─ 404 si null ou fichier inexistant (fs.existsSync)
  │    └─ res.sendFile(pdf_local_path)   ← pas de SFTP
  │
  └─ source === 'db_externe' (ou autre)
       ├─ lire url_pdf
       ├─ 404 si null
       └─ SFTP stream → res  (comportement actuel inchangé)
```

### Sécurité

`res.sendFile()` reçoit un chemin absolu. On vérifie que le fichier est bien sous `UPLOAD_STORAGE_PATH` (préfixe) avant de le servir, pour éviter toute path traversal.

### En-têtes de réponse

- `Content-Type: application/pdf` dans les deux cas
- `Content-Disposition: inline; filename="..."` avec le nom du fichier extrait du chemin
