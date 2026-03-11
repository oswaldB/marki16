## 1. Cloud Function `importImpayes` — persister le chemin local

- [x] 1.1 Dans `backend/cloud/main.js`, fonction `importImpayes`, ajouter après `impaye.set('pdf_filename', data.pdf_filename || null)` la ligne : `impaye.set('pdf_local_path', data.pdf_path || null)` — ce champ contient le chemin absolu du fichier sur le serveur

## 2. Endpoint `/api/pdf/:impayelId` — dual source

- [x] 2.1 Dans `backend/server.js`, dans le handler `GET /api/pdf/:impayelId`, après avoir chargé l'impayé, lire `const source = impaye.get('source')`
- [x] 2.2 Ajouter la branche `source === 'upload'` :
  - Lire `const localPath = impaye.get('pdf_local_path')`
  - Retourner 404 si `!localPath`
  - Vérifier que `localPath` commence bien par `UPLOAD_PATH` (sécurité path traversal) → 403 sinon
  - Vérifier que le fichier existe avec `fs.existsSync(localPath)` → 404 sinon
  - Définir les en-têtes `Content-Type: application/pdf` et `Content-Disposition: inline; filename="..."`
  - Appeler `res.sendFile(localPath)` et retourner
- [x] 2.3 La branche `source === 'db_externe'` (ou default) garde le comportement actuel : lire `url_pdf`, ouvrir SFTP, streamer — déplacer simplement dans un `else` ou laisser en fallback après le `return` de la branche upload
