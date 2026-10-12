// backend/cloud/workflows/users/00-master.js
// Orchestrateur et Cloud Functions de gestion des utilisateurs

// Charger les variables d'environnement depuis .env
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const { info, warn, error } = require("../../utils/logger");

// Initialiser Parse si nécessaire
if (typeof Parse === "undefined") {
    const Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID,
        process.env.PARSE_JAVASCRIPT_KEY,
        process.env.PARSE_MASTER_KEY,
    );
    Parse.serverURL = process.env.PARSE_SERVER_URL;
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
}

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */

/** Vérifie si un utilisateur Parse est membre du rôle "admin" */
async function userIsAdmin(user) {
    if (!user) return false;
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo("name", "admin");
    const adminRole = await roleQuery.first({ useMasterKey: true });
    if (!adminRole) return false;
    const relation = adminRole.get("users");
    const userInRole = await relation
        .query()
        .equalTo("objectId", user.id)
        .first({ useMasterKey: true });
    return !!userInRole;
}

/** Renvoie la liste des utilisateurs avec leur statut admin */
async function listUsersMaster() {
    const userQuery = new Parse.Query(Parse.User);
    const users = await userQuery.find({ useMasterKey: true });

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo("name", "admin");
    const adminRole = await roleQuery.first({ useMasterKey: true });

    let adminUserIds = new Set();
    if (adminRole) {
        const adminUsers = await adminRole
            .get("users")
            .query()
            .find({ useMasterKey: true });
        adminUserIds = new Set(adminUsers.map((u) => u.id));
    }

    return users.map((u) => {
        const email = u.get("email") || null;
        const username = u.get("username") || null;
        return {
            id: u.id,
            // Les comptes historiques n'ont pas de champ `email` : on retombe
            // sur le username pour que la colonne Email ne soit jamais vide.
            email: email || username,
            username,
            hasEmail: !!email,
            createdAt: u.createdAt,
            isAdmin: adminUserIds.has(u.id),
        };
    });
}

/* ───────────────────────────────────────────────
   Cloud Functions publiques
   ─────────────────────────────────────────────── */

/** Vérifie si l'utilisateur authentifié est admin (pour le middleware frontend) */
Parse.Cloud.define("checkAdmin", async (request) => {
    const isAdmin = await userIsAdmin(request.user);
    return { isAdmin };
});

/** Liste tous les utilisateurs (admin only) */
Parse.Cloud.define("listUsers", async (request) => {
    if (!await userIsAdmin(request.user)) {
        throw new Error("Accès refusé : administrateur requis");
    }
    return await listUsersMaster();
});

/** Crée un nouvel utilisateur (admin only) */
Parse.Cloud.define("createUser", async (request) => {
    if (!await userIsAdmin(request.user)) {
        throw new Error("Accès refusé : administrateur requis");
    }
    const { email, password, makeAdmin } = request.params;
    if (!email || !password) {
        throw new Error("Email et mot de passe obligatoires");
    }

    const user = new Parse.User();
    user.set("username", email);
    user.set("email", email);
    user.set("password", password);

    await user.signUp(null, { useMasterKey: true });

    if (makeAdmin) {
        const roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", "admin");
        const adminRole = await roleQuery.first({ useMasterKey: true });
        if (adminRole) {
            adminRole.getUsers().add(user);
            await adminRole.save(null, { useMasterKey: true });
        }
    }

    return { id: user.id, email };
});

/** Met à jour le mot de passe d'un utilisateur (admin only) */
Parse.Cloud.define("updateUserPassword", async (request) => {
    if (!await userIsAdmin(request.user)) {
        throw new Error("Accès refusé : administrateur requis");
    }
    const { userId, newPassword } = request.params;
    if (!userId || !newPassword) {
        throw new Error("userId et newPassword obligatoires");
    }

    const query = new Parse.Query(Parse.User);
    const user = await query.get(userId, { useMasterKey: true });
    if (!user) throw new Error("Utilisateur introuvable");

    user.set("password", newPassword);
    await user.save(null, { useMasterKey: true });

    return { success: true };
});

/** Ajoute ou retire le rôle admin à un utilisateur (admin only) */
Parse.Cloud.define("setAdminRole", async (request) => {
    if (!await userIsAdmin(request.user)) {
        throw new Error("Accès refusé : administrateur requis");
    }
    const { userId, makeAdmin } = request.params;
    if (!userId) throw new Error("userId obligatoire");

    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo("name", "admin");
    const adminRole = await roleQuery.first({ useMasterKey: true });
    if (!adminRole) throw new Error("Rôle admin introuvable");

    const userQuery = new Parse.Query(Parse.User);
    const user = await userQuery.get(userId, { useMasterKey: true });
    if (!user) throw new Error("Utilisateur introuvable");

    if (makeAdmin) {
        adminRole.getUsers().add(user);
    } else {
        adminRole.getUsers().remove(user);
    }
    await adminRole.save(null, { useMasterKey: true });

    return { success: true };
});

/** Supprime un utilisateur (admin only) */
Parse.Cloud.define("deleteUser", async (request) => {
    if (!await userIsAdmin(request.user)) {
        throw new Error("Accès refusé : administrateur requis");
    }
    const { userId } = request.params;
    if (!userId) throw new Error("userId obligatoire");

    const query = new Parse.Query(Parse.User);
    const user = await query.get(userId, { useMasterKey: true });
    if (!user) throw new Error("Utilisateur introuvable");

    await user.destroy({ useMasterKey: true });
    return { success: true };
});

/* ───────────────────────────────────────────────
   Orchestrateur legacy (conservé pour compatibilité)
   ─────────────────────────────────────────────── */

/**
 * Orchestrateur principal du workflow users
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Statistiques
 */
async function usersMaster(options = {}) {
    const startedAt = new Date();
    const stats = {
        processed: 0,
        errors: [],
        total: {
            startedAt,
            finishedAt: null,
            durationMs: 0,
        },
    };

    info(
        `[users/master] Début du processus de gestion des utilisateurs (trigger: ${options.trigger || "manual"})`,
        "users",
        "usersMaster",
    );

    try {
        info(
            `[users/master] Workflow users non encore implémenté`,
            "users",
            "usersMaster",
        );
        stats.processed = 0;
    } catch (err) {
        error(
            `[users/master] Erreur: ${err.message}`,
            "users",
            "usersMaster",
        );
        stats.errors.push({
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt;
    stats.total.durationMs = finishedAt - startedAt;

    info(
        `[users/master] Durée totale: ${(finishedAt - startedAt) / 1000} secondes`,
        "users",
        "usersMaster",
    );

    return stats;
}

module.exports = usersMaster;

// Cloud Function pour déclencher la gestion des utilisateurs via Parse
Parse.Cloud.define("usersWorkflow", async (request) => {
    info(
        "Cloud Function usersWorkflow appelée",
        "users",
        "usersWorkflow",
        { user: request.user?.id, master: request.master },
    );

    if (!request.master && !request.user) {
        throw new Error(
            "Non autorisé - cette fonction nécessite un utilisateur authentifié ou le master key",
        );
    }

    return await usersMaster({ trigger: "cloud-function" });
});

// Exécution directe si appelé en CLI
if (require.main === module) {
    usersMaster({ trigger: "cli" })
        .then((stats) => {
            info(
                "Workflow users terminé via CLI",
                "users",
                "usersMaster",
                {
                    errors: stats.errors.length,
                    durationMs: stats.total.durationMs,
                },
            );
            process.exit(stats.errors.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            error(
                `Erreur dans users/master: ${error.message}`,
                "users",
                "usersMaster",
                { error: error.message, stack: error.stack?.substring(0, 500) },
            );
            process.exit(1);
        });
}
