// backend/cloud/jobs/envoyerRelances.js
// Cloud Function : envoie les relances pending dont dateEnvoi <= maintenant

const nodemailer  = require('nodemailer');
const SftpClient  = require('ssh2-sftp-client');
const fs          = require('fs');
const path        = require('path');

// Retourne un Buffer du PDF ou null si introuvable
async function fetchPdfBuffer(impaye) {
  const source = impaye.get('source');

  if (source === 'upload') {
    const localPath = impaye.get('pdf_local_path');
    if (!localPath || !fs.existsSync(localPath)) return null;
    return fs.readFileSync(localPath);
  }

  // db_externe : récupération via SFTP
  const urlPdf = impaye.get('url_pdf');
  if (!urlPdf) return null;

  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host:     process.env.FTP_HOST,
      port:     parseInt(process.env.FTP_PORT || '2222', 10),
      username: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
    });
    const buffer = await sftp.get(urlPdf);
    return buffer;
  } catch (err) {
    console.warn(`[envoyerRelances] PDF SFTP introuvable (${urlPdf}) : ${err.message}`);
    return null;
  } finally {
    sftp.end().catch(() => {});
  }
}

module.exports = async function envoyerRelances() {
  const now = new Date();

  const q = new Parse.Query('Relance');
  q.equalTo('statut', 'pending');
  q.lessThanOrEqualTo('dateEnvoi', now);
  q.equalTo('valide', true); // Ne pas envoyer les relances non validées
  q.include('smtpProfil');
  q.include('impaye');
  q.limit(100);
  const relances = await q.find({ useMasterKey: true });

  console.log(`[envoyerRelances] ${relances.length} relance(s) à traiter`);

  let envoyees = 0;
  let echecs = 0;

  for (const relance of relances) {
    try {
      const smtp = relance.get('smtpProfil');
      if (!smtp) throw new Error('Aucun profil SMTP configuré sur cette relance');

      const to    = relance.get('to');
      const cc    = relance.get('cc');
      const objet = relance.get('objet');
      const corps = relance.get('corps');

      if (!to) throw new Error('Destinataire vide');

      // Récupération du PDF en pièce jointe
      const impaye = relance.get('impaye');
      const attachments = [];
      if (impaye) {
        const pdfBuffer = await fetchPdfBuffer(impaye);
        if (pdfBuffer) {
          const refPiece  = impaye.get('ref_piece') || impaye.get('nfacture') || impaye.id;
          attachments.push({
            filename:    `${refPiece}.pdf`,
            content:     pdfBuffer,
            contentType: 'application/pdf',
          });
        }
      }

      const port = smtp.get('port') || 587;
      const transporter = nodemailer.createTransport({
        host:   smtp.get('host'),
        port,
        secure: port === 465,
        auth: {
          user: smtp.get('username'),
          pass: smtp.get('password'),
        },
      });

      await transporter.sendMail({
        from:    `"${smtp.get('nom_affiche') || ''}" <${smtp.get('email_from')}>`,
        to,
        ...(cc ? { cc } : {}),
        subject: objet,
        html:    corps,
        ...(attachments.length ? { attachments } : {}),
      });

      relance.set('statut', 'envoyé');
      relance.unset('erreur');
      envoyees++;
      console.log(`[envoyerRelances] ✓ Envoyé → ${to} | ${objet} | ${attachments.length} PJ`);
    } catch (err) {
      relance.set('statut', 'échec');
      relance.set('erreur', err.message);
      echecs++;
      console.log(`[envoyerRelances] ✗ Échec — ${err.message}`);
    }

    await relance.save(null, { useMasterKey: true });
  }

  const result = { envoyees, echecs, total: relances.length };
  console.log(`[envoyerRelances] Terminé :`, result);
  return result;
};
