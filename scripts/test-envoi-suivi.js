// Script test : envoie un suivi du 15 août à oswald.bernard@gmail.com
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const Parse = require("../backend/node_modules/parse/node");
const nodemailer = require("../backend/node_modules/nodemailer");

Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JAVASCRIPT_KEY,
    process.env.PARSE_MASTER_KEY
);
Parse.serverURL = "http://localhost:1556/api/parse";
Parse.Cloud.useMasterKey();
global.Parse = Parse;

async function testEnvoiSuivi() {
    try {
        // 1. Rechercher les suivis créés le 15 aoout
        const startOfDay = new Date("2026-08-15T00:00:00.000Z");
        const endOfDay = new Date("2026-08-16T00:00:00.000Z");

        const query = new Parse.Query("Suivi");
        query.greaterThanOrEqualTo("createdAt", startOfDay);
        query.lessThan("createdAt", endOfDay);
        query.include(["contact", "sequence", "impayes", "smtpProfil"]);
        query.limit(2);

        const suivis = await query.find({ useMasterKey: true });
        console.log(`🔍 Trouvé ${suivis.length} suivis créés le 15 août`);

        if (suivis.length === 0) {
            console.log("❌ Aucun suivi trouvé pour le 15 août");
            process.exit(1);
        }

        // 2. Récupérer le premier profil SMTP disponible
        const SmtpProfile = Parse.Object.extend("SmtpProfile");
        const smtpQuery = new Parse.Query(SmtpProfile);
        const smtpProfils = await smtpQuery.find({ useMasterKey: true });
        if (smtpProfils.length === 0) {
            console.log("❌ Aucun profil SMTP trouvé");
            process.exit(1);
        }
        const smtpProfil = smtpProfils[0];

        const transporter = nodemailer.createTransport({
            host: smtpProfil.get("host"),
            port: smtpProfil.get("port"),
            secure: smtpProfil.get("port") === 465,
            auth: {
                user: smtpProfil.get("username"),
                pass: smtpProfil.get("password"),
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === "production",
            },
        });

        const from = smtpProfil.get("email_from") || smtpProfil.get("username");
        const replyTo = smtpProfil.get("email_from") || null;

        for (let i = 0; i < Math.min(2, suivis.length); i++) {
            const suivi = suivis[i];
            const contact = suivi.get("contact");
            const contactEmail = contact?.get("email");
            const subject = `[TEST] ${suivi.get("objet") || "Suivi de dossiers"}`;
            let html = suivi.get("corps") || "<p>Contenu du suivi...</p>";

            // Ajouter signature SMTP
            const signatureHtml = smtpProfil.get("signature_html");
            if (signatureHtml && signatureHtml.trim()) {
                html = html + "<br><br>" + signatureHtml;
            }

            // Ajouter bandeau de test
            html = `
                <div style="background:#fff3cd;border:1px solid #ffc107;color:#856404;padding:10px;margin-bottom:15px;border-radius:4px;font-family:sans-serif;">
                    <strong>⚠️ EMAIL DE TEST</strong><br>
                    Destinataire original : ${contactEmail || "N/A"}<br>
                    Suivi ID : ${suivi.id}<br>
                    Envoyé à : oswald.bernard@gmail.com
                </div>
                ${html}
            `;

            const emailOptions = {
                from,
                to: "oswald.bernard@gmail.com",
                subject,
                html,
                replyTo,
            };

            console.log(`📤 Envoi suivi ${suivi.id} à oswald.bernard@gmail.com...`);
            const info = await transporter.sendMail(emailOptions);
            console.log(`✅ Suivi ${suivi.id} envoyé - MessageID: ${info.messageId}`);
        }

        console.log("\n🎉 Test terminé avec succès !");
        process.exit(0);
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

testEnvoiSuivi();
