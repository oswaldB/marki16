<template>
  <div class="p-6 space-y-6">

    <!-- ── Header ── -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/sequences" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <UIcon name="i-heroicons-arrow-left" class="size-4" />
        Retour
      </NuxtLink>
      <UInput
        v-model="nom"
        class="flex-1 text-xl font-semibold"
        placeholder="Nom de la séquence"
      />
      <UBadge :color="publiee ? 'success' : 'neutral'" variant="subtle" class="shrink-0">
        {{ publiee ? 'Publiée' : 'Brouillon' }}
      </UBadge>
      <UButton
        :icon="publiee ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
        :color="publiee ? 'neutral' : 'success'"
        :variant="publiee ? 'outline' : 'solid'"
        :loading="publishing"
        @click="togglePublication"
      >
        {{ publiee ? 'Dépublier' : 'Publier' }}
      </UButton>
      <UButton icon="i-heroicons-floppy-disk" :loading="saving" @click="sauvegarder">
        Enregistrer
      </UButton>
    </div>

    <!-- ── Toggle validation obligatoire ── -->
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium text-gray-700 w-36 shrink-0">Validation obligatoire</span>
      <button
        type="button"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        :class="validationObligatoire ? 'bg-green-500' : 'bg-gray-300'"
        @click="validationObligatoire = !validationObligatoire"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          :class="validationObligatoire ? 'translate-x-6' : 'translate-x-1'"
        />
        <span class="absolute text-[9px] font-bold tracking-wide transition-opacity"
          :class="validationObligatoire ? 'left-1.5 text-white opacity-100' : 'opacity-0'"
        >ON</span>
        <span class="absolute text-[9px] font-bold tracking-wide transition-opacity"
          :class="!validationObligatoire ? 'right-1.5 text-gray-500 opacity-100' : 'opacity-0'"
        >OFF</span>
      </button>
      <span class="text-sm text-gray-500">{{ validationObligatoire ? 'Validation obligatoire activée' : 'Validation obligatoire désactivée' }}</span>
    </div>

    <!-- ── Section EMAILS ── -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold text-gray-800">EMAILS DE RELANCE</span>
          <UButton variant="outline" size="sm" @click="showIaModal = true">
            <UIcon name="i-heroicons-sparkles" class="size-4" />
            Générer par IA
          </UButton>
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="loading" class="text-center py-6 text-gray-400">Chargement...</div>

        <UCard
          v-for="(email, idx) in emailsSorted"
          :key="email._key"
          class="border border-gray-100"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium text-sm text-gray-700">Email {{ idx + 1 }} — J+{{ email.delai }}</span>
              <div class="flex items-center gap-2">
                <UButton :icon="collapsedEmails[email._key] ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" variant="ghost" size="xs" @click="toggleEmailVisibility(email._key)" />
                <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs" @click="supprimerEmail(email._key)" />
              </div>
            </div>
          </template>

          <div class="space-y-2" v-show="!collapsedEmails[email._key]">
            <!-- Délai -->
            <div>
              <label class="text-xs text-gray-500 mb-1 block">J+</label>
              <UInput v-model.number="email.delai" type="number" min="0" class="w-full" />
            </div>

            <!-- À (partagé entre tous les formats) -->
            <div>
              <label class="text-xs text-gray-500 mb-1 block">À</label>
              <UInput v-model="email.to" placeholder="[[payeur_email]]" class="w-full" />
            </div>

            <!-- Onglets scénario -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-gray-500">Contenu par format</label>
                <div class="flex gap-1">
                  <UButton size="xs" variant="ghost" @click="openChatGptModal(idx)">
                    <UIcon name="i-heroicons-sparkles" class="size-4" />
                    IA
                  </UButton>
                </div>
              </div>
              <div class="space-y-2">
                <UTabs :items="scenarioTabs" :model-value="email.activeScenario" @update:modelValue="(scenario) => switchScenario(email, scenario)" class="px-2 pt-1" />
                <div class="px-1 space-y-3">

                  <!-- Toggle activer/désactiver ce format -->
                  <div class="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <span class="text-xs font-medium text-gray-600">Format actif</span>
                    <button
                      type="button"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                      :class="getScenario(email, email.activeScenario).active ? 'bg-green-500' : 'bg-gray-300'"
                      @click="getScenario(email, email.activeScenario).active = !getScenario(email, email.activeScenario).active"
                    >
                      <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                        :class="getScenario(email, email.activeScenario).active ? 'translate-x-6' : 'translate-x-1'"
                      />
                      <span class="absolute text-[9px] font-bold tracking-wide transition-opacity"
                        :class="getScenario(email, email.activeScenario).active ? 'left-1.5 text-white opacity-100' : 'opacity-0'"
                      >ON</span>
                      <span class="absolute text-[9px] font-bold tracking-wide transition-opacity"
                        :class="!getScenario(email, email.activeScenario).active ? 'right-1.5 text-gray-500 opacity-100' : 'opacity-0'"
                      >OFF</span>
                    </button>
                  </div>

                  <template v-if="getScenario(email, email.activeScenario).active">
                    <!-- Profil expéditeur (par format) -->
                    <div>
                      <div v-if="smtpOptions.length > 0">
                        <div class="flex items-center justify-between mb-1">
                          <label class="text-xs text-gray-500">Profil expéditeur</label>
                          <UButton size="xs" variant="link" class="text-xs" @click="showSmtpModal = true">+ Créer un profil</UButton>
                        </div>
                        <USelect
                          v-model="getScenario(email, email.activeScenario).smtp"
                          :items="smtpOptions"
                          @change="onSmtpChange(email, getScenario(email, email.activeScenario), $event)"
                          class="w-full"
                        />
                      </div>
                      <UAlert v-else icon="i-heroicons-exclamation-triangle" color="amber" variant="soft" title="Aucun profil expéditeur configuré" class="text-xs">
                        <template #description>
                          <div class="flex items-center gap-2">
                            <span>Créez un profil expéditeur pour envoyer des emails.</span>
                            <UButton size="xs" variant="solid" @click="showSmtpModal = true">Créer un profil</UButton>
                          </div>
                        </template>
                      </UAlert>
                    </div>

                    <!-- CC (par format) -->
                    <div>
                      <label class="text-xs text-gray-500 mb-1 block">CC</label>
                      <UInput v-model="getScenario(email, email.activeScenario).cc" class="w-full" />
                    </div>

                    <!-- Objet (par format) -->
                    <div>
                      <label class="text-xs text-gray-500 mb-1 block">Objet</label>
                      <UInput v-model="getScenario(email, email.activeScenario).objet" placeholder="Relance — [[nfacture]]" class="w-full" />
                    </div>

                    <!-- Corps (par format) -->
                    <div class="border border-gray-200 rounded-md overflow-hidden">
                      <ToastuiEditor
                        :ref="el => { if (el) editorRefs[email._key] = el }"
                        :initial-value="getCurrentCorps(email)"
                        :options="editorOptions"
                        initial-edit-type="wysiwyg"
                        @change="updateCorps(email, $event)"
                      />
                    </div>
                  </template>

                  <div v-else class="text-xs text-gray-400 italic py-2 text-center">
                    Ce format est désactivé — aucun email ne sera envoyé pour ce cas.
                  </div>
                </div>
              </div>
            </div>

            <!-- Variables -->
            <div class="border border-gray-100 rounded-lg bg-gray-50 p-2">
              <p class="text-xs font-semibold text-gray-500 mb-2">Variables</p>
              <UInput
                v-model="varsSearch"
                size="xs"
                placeholder="Rechercher..."
                icon="i-heroicons-magnifying-glass"
                class="mb-2"
              />
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="group in getVariablesForEmail(email._key)" :key="group.groupe" class="space-y-2">
                  <!-- Masquer le groupe MULTIPLE si le format est 'single' -->
                  <template v-if="!(group.groupe === 'MULTIPLE' && email.activeScenario === 'single')">
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center gap-1">
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ group.groupe }}</p>
                        <!-- Bouton d'édition pour les liens de paiement -->
                        <UButton
                          v-if="group.groupe === 'LIENS DE PAIEMENT'"
                          variant="ghost"
                          size="2xs"
                          icon="i-heroicons-pencil-square"
                          @click="ouvrirLienModal"
                          class="p-0 h-4 w-4"
                        />
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <button
                        v-for="v in group.vars"
                        :key="v.isPaymentLink ? v.name : v"
                        class="text-xs bg-white hover:bg-sky-50 hover:text-sky-700 border border-gray-200 rounded px-1.5 py-0.5 font-mono transition-colors"
                        @click="v.isPaymentLink ? copyPaymentLink(v) : copyVariable(v)"
                      >
                        {{ v.isPaymentLink ? v.display : v }}
                      </button>
                    </div>
                  </template>
                </div>
              </div>
              <p class="text-xs text-gray-400 pt-1.5 mt-1.5 border-t border-gray-100">Clic → copié · Ctrl+V</p>
            </div>
          </div>
        </UCard>

        <UButton variant="outline" icon="i-heroicons-plus" @click="ajouterEmail">
          Ajouter un email
        </UButton>
      </div>
    </UCard>

    <!-- ── Section RÈGLES ── -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold text-gray-800">RÈGLES D'ATTRIBUTION AUTOMATIQUE</span>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">Activé</span>
            <button
              type="button"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              :class="attributionAutomatique ? 'bg-green-500' : 'bg-gray-300'"
              @click="attributionAutomatique = !attributionAutomatique"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                :class="attributionAutomatique ? 'translate-x-6' : 'translate-x-1'"
              />
              <span class="absolute text-[9px] font-bold tracking-wide transition-opacity"
                :class="attributionAutomatique ? 'left-1.5 text-white opacity-100' : 'opacity-0'"
              >ON</span>
              <span class="absolute text-[9px] font-bold tracking-wide transition-opacity"
                :class="!attributionAutomatique ? 'right-1.5 text-gray-500 opacity-100' : 'opacity-0'"
              >OFF</span>
            </button>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Groupes de règles -->
        <div v-for="(groupe, groupeIdx) in groupesRegles" :key="groupeIdx" class="border border-gray-200 rounded-lg p-3">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <USelect
                v-model="groupe.logique"
                :items="groupeLogiqueOptions"
                class="w-20"
              />
              <span class="text-sm font-medium">Groupe {{ groupeIdx + 1 }}</span>
            </div>
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              size="xs"
              @click="supprimerGroupe(groupeIdx)"
            />
          </div>

          <div class="space-y-2">
            <div v-for="(regle, regleIdx) in groupe.regles" :key="regleIdx" class="flex items-center gap-2 flex-wrap">
              <USelect
                v-model="regle.champ"
                :items="champOptions"
                class="w-44"
                @change="chargerOptionsPourChamp(regle)"
              />
              <USelect
                v-model="regle.operateur"
                :items="operateurOptions"
                class="w-36"
              />
              
              <!-- Champ valeur - Select ou Input selon le champ -->
              <USelect
                v-if="regle.options && regle.options.length > 0"
                v-model="regle.valeur"
                :items="regle.options"
                :multiple="regle.operateur === 'egal' || regle.operateur === 'different'"
                class="flex-1 min-w-32"
              >
                <template #label>
                  <span v-if="regle.valeur && regle.valeur.length">
                    {{ regle.valeur.join(', ') }}
                  </span>
                  <span v-else class="text-gray-400">
                    Sélectionner {{ regle.operateur === 'egal' || regle.operateur === 'different' ? 'des valeurs' : 'une valeur' }}
                  </span>
                </template>
              </USelect>
              <UInput
                v-else
                v-model="regle.valeur"
                placeholder="Valeur"
                class="flex-1 min-w-24"
              />

              <UButton
                icon="i-heroicons-trash"
                color="red"
                variant="ghost"
                size="xs"
                @click="supprimerRegle(groupeIdx, regleIdx)"
              />
            </div>

            <UButton
              variant="outline"
              icon="i-heroicons-plus"
              size="sm"
              @click="ajouterRegleAuGroupe(groupeIdx)"
            >
              Ajouter une règle
            </UButton>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            variant="outline"
            icon="i-heroicons-plus"
            size="sm"
            @click="ajouterGroupeRegles()"
          >
            Ajouter un groupe
          </UButton>
        </div>

        <!-- Aperçu live -->
        <div class="pt-2 flex items-center gap-4 text-sm flex-wrap">
          <span class="text-green-600 font-medium"><UIcon name="i-heroicons-check-circle" class="size-4" /> {{ apercuConcernes }} impayés concernés</span>
          <span class="text-red-500 font-medium"><UIcon name="i-heroicons-x-circle" class="size-4" /> {{ apercuExclus }} exclus</span>
          <UButton
            v-if="apercuConcernes > 0"
            variant="outline"
            size="xs"
            @click="showImpayesTable = !showImpayesTable"
          >
            {{ showImpayesTable ? 'Masquer' : 'Voir' }} les {{ apercuConcernes }} impayés concernés
          </UButton>
        </div>

        <!-- Tableau des impayés concernés -->
        <div v-if="showImpayesTable && apercuConcernes > 0" class="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-gray-700">Facture</th>
                <th class="px-4 py-2 text-left font-medium text-gray-700">Payeur</th>
                <th class="px-4 py-2 text-left font-medium text-gray-700">Montant</th>
                <th class="px-4 py-2 text-left font-medium text-gray-700">Échéance</th>
                <th class="px-4 py-2 text-left font-medium text-gray-700">Statut</th>
                <th class="px-4 py-2 text-left font-medium text-gray-700">Déjà dans séquence</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr v-for="impaye in impayesConcernes" :key="impaye.id">
                <td class="px-4 py-2 text-gray-800">{{ impaye.nfacture }}</td>
                <td class="px-4 py-2 text-gray-600">{{ impaye.payeur_nom }}</td>
                <td class="px-4 py-2 text-gray-600">{{ impaye.reste_a_payer }} €</td>
                <td class="px-4 py-2 text-gray-600">{{ impaye.date_echeance }}</td>
                <td class="px-4 py-2">
                  <span class="px-2 py-1 rounded-full text-xs font-medium" :class="{
                    'bg-green-100 text-green-800': impaye.statut === 'validé',
                    'bg-yellow-100 text-yellow-800': impaye.statut === 'en attente',
                    'bg-red-100 text-red-800': impaye.statut === 'impayé',
                    'bg-gray-100 text-gray-800': !impaye.statut
                  }">
                    {{ impaye.statut || 'inconnu' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center">
                  <UIcon v-if="impaye.dejaDansSequence" name="i-heroicons-check-circle" class="size-5 text-green-500" />
                  <UIcon v-else name="i-heroicons-x-circle" class="size-5 text-gray-300" />
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="impayesConcernes.length === 0" class="p-4 text-center text-gray-400">
            Aucun impayé trouvé correspondant aux critères
          </div>
        </div>
      </div>
    </UCard>

    <!-- ════════════════════════════════════════════
         DRAWER : Lien de paiement
    ════════════════════════════════════════════ -->
    <UDrawer v-model:open="showLienModal" direction="right">
      <template #header>
        <p class="font-semibold">Gestion des liens de paiement</p>
      </template>

      <template #body>
        <div class="flex flex-col gap-4 p-4">
          <!-- Liste des liens de paiement existants -->
          <div>
            <p class="text-xs font-semibold text-gray-500 mb-2">Liens de paiement existants</p>
            <div v-if="liensPaiement.length > 0" class="space-y-2">
              <div v-for="lien in liensPaiement" :key="lien.id" class="border border-gray-200 rounded-lg p-2">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium">{{ lien.nom }}</p>
                    <p class="text-xs text-gray-500 break-all">{{ lien.url }}</p>
                  </div>
                  <div class="flex gap-1">
                    <UButton
                      variant="ghost"
                      size="2xs"
                      icon="i-heroicons-pencil"
                      @click="editerLienPaiement(lien)"
                    />
                    <UButton
                      variant="ghost"
                      size="2xs"
                      icon="i-heroicons-trash"
                      color="red"
                      @click="supprimerLienPaiement(lien.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400">Aucun lien de paiement existant.</p>
          </div>

          <!-- Séparateur -->
          <div class="border-t border-gray-200"></div>

          <!-- Variables (filtrées pour exclure les liens de paiement) -->
          <div class="border border-gray-100 rounded-lg bg-gray-50 p-2">
            <p class="text-xs font-semibold text-gray-500 mb-2">Variables</p>
            <UInput
              v-model="lienVarsSearch"
              size="xs"
              placeholder="Rechercher..."
              icon="i-heroicons-magnifying-glass"
              class="mb-2"
            />
            <div class="space-y-2">
              <div v-for="group in filteredLienVars" :key="group.groupe">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{{ group.groupe }}</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="v in group.vars"
                    :key="v.isPaymentLink ? v.name : v"
                    class="text-xs bg-white hover:bg-sky-50 hover:text-sky-700 border border-gray-200 rounded px-1.5 py-0.5 font-mono transition-colors"
                    @click="!v.isPaymentLink && insererVariableEnLien(v)"
                  >
                    {{ v.isPaymentLink ? v.display : v }}
                  </button>
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-400 pt-1.5 mt-1.5 border-t border-gray-100">Clic → inséré à la position du curseur</p>
          </div>

          <!-- Création/Édition d'un lien de paiement -->
          <div>
            <p class="text-xs font-semibold text-gray-500 mb-2">
              {{ editingLienId ? 'Modifier le lien de paiement' : 'Créer un nouveau lien de paiement' }}
            </p>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Nom du lien</label>
                <UInput
                  v-model="nouveauLienNom"
                  placeholder="Nom du lien de paiement"
                  class="w-full"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">URL avec variables</label>
                <textarea
                  ref="lienPaiementTextareaEl"
                  v-model="lienPaiementEdit"
                  class="w-full border border-gray-300 rounded-md p-2 font-mono text-sm resize-y min-h-24 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="https://paiement.exemple.com?facture=[[nfacture]]&montant=[[reste_a_payer]]"
                />
                <div v-if="lienPaiementEdit" class="bg-gray-50 rounded p-2 mt-2">
                  <p class="text-xs text-gray-500 mb-1">Aperçu (valeurs d'exemple)</p>
                  <p class="text-xs text-sky-700 font-mono break-all">{{ lienPaiementApercu }}</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </template>

      <template #footer>
        <div class="flex justify-end p-4 w-full gap-2">
          <UButton
            v-if="editingLienId"
            variant="outline"
            size="sm"
            @click="annulerEditionLien"
            class="flex-1"
          >
            Annuler
          </UButton>
          <UButton
            variant="outline"
            size="sm"
            @click="enregistrerNouveauLienPaiement"
            class="flex-1"
          >
            {{ editingLienId ? 'Mettre à jour' : 'Créer' }}
          </UButton>
        </div>
      </template>
    </UDrawer>

    <!-- ════════════════════════════════════════════
         MODAL : Générer par IA
    ════════════════════════════════════════════ -->
    <UModal v-model:open="showIaModal" title="Générer les emails par IA">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-sparkles" class="size-5" />
          <span>Générer les emails par IA</span>
        </div>
      </template>
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-gray-600">
            Copiez le prompt, collez-le dans ChatGPT, puis collez la réponse YAML ici.
          </p>
          <UButton variant="outline" size="sm" @click="copyPromptIA">
            <UIcon name="i-heroicons-clipboard" class="size-4" />
            Copier le prompt
          </UButton>
          <div class="w-full">
            <label class="text-xs text-gray-500 mb-1 block">Réponse YAML de ChatGPT</label>
            <UTextarea v-model="iaResponse" :rows="8" placeholder='---
- delai: 7
  scenarios:
    - format: single
      objet: "Rappel facture [[nfacture]]"
      corps: |
        Bonjour [[payeur_nom]], ...
    - format: multiple
      objet: "Rappel factures impayées"
      corps: |
        Bonjour [[payeur_nom]], ...
    - format: both
      objet: "..."
      corps: |
        ...
    - format: broker
      objet: "..."
      corps: |
        ...' class="w-full" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="showIaModal = false" class="w-full">Annuler</UButton>
          <UButton @click="validerIA" class="w-full">
            <UIcon name="i-heroicons-check" class="size-4" />
            Valider et remplacer les emails
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- ════════════════════════════════════════════
         MODAL : Demander à ChatGPT (par email)
    ════════════════════════════════════════════ -->
    <UModal v-model:open="showChatGptModal" :title="`Demander à ChatGPT — Email ${chatGptEmailIdx + 1}`">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Copiez le prompt pour le format souhaité, collez-le dans ChatGPT, puis collez la réponse ci-dessous.
          </p>
          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="tab in scenarioTabs" :key="tab.value"
              variant="outline" size="sm"
              :color="chatGptTargetFormat === tab.value ? 'primary' : 'neutral'"
              @click="copyChatGptPrompt(tab.value)"
            >
              <UIcon name="i-heroicons-clipboard" class="size-4" />
              {{ tab.label }}
            </UButton>
          </div>
          <p v-if="chatGptTargetFormat" class="text-xs text-gray-500">
            La réponse sera insérée dans le format <strong>{{ scenarioTabs.find(t => t.value === chatGptTargetFormat)?.label }}</strong>.
          </p>
          <div class="w-full">
            <label class="text-xs text-gray-500 mb-1 block">Corps de l'email (Markdown)</label>
            <UTextarea v-model="chatGptResponse" :rows="8" placeholder="Bonjour [[payeur_nom]],

Votre facture [[nfacture]] est en retard..." class="w-full" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="showChatGptModal = false" class="w-full">Annuler</UButton>
          <UButton @click="insererReponseChatGpt" :disabled="!chatGptResponse" class="w-full">
            <UIcon name="i-heroicons-check" class="size-4" />
            Insérer dans l'éditeur
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- ════════════════════════════════════════════
         DRAWER : Créer profil SMTP
    ════╕════════════════════════════════════════════ -->
    <SmtpDrawer
      v-model="showSmtpModal"
      :mode-edition="false"
      @saved="onSmtpSaved"
    />

  </div>
</template>

<script setup>
import ToastuiEditor from '~/components/ToastuiEditor.vue'
import yaml from 'js-yaml'
import { useDynamicOptions } from '~/composables/useDynamicOptions'

const { $parse } = useNuxtApp()
const route = useRoute()
const toast = useToast()

// ── State ──────────────────────────────────────────────────────
const loading = ref(true)
const saving = ref(false)
const savingSmtp = ref(false)
const publiee = ref(false)
const publishing = ref(false)

const sequence = ref(null)
const nom = ref('')
const lienPaiement = ref('')
const emails = ref([])
const groupesRegles = ref([]) // Nouveau state pour les groupes de règles
const attributionAutomatique = ref(false) // Nouveau state pour le toggle
const validationObligatoire = ref(false) // Nouveau state pour la validation obligatoire
const smtpProfiles = ref([])
const liensPaiement = ref([])

// Aperçu règles
const apercuConcernes = ref(0)
const apercuExclus = ref(0)

// Options pour les selects
const optionsPourChamps = ref({
  payeur_type: [],
  statut: [],
  statut_dossier: [],
  ville: [],
  code_postal: []
})

// Variables (emails)
const varsSearch = ref('')

// Variables popover (lien paiement)
const lienVarsSearch = ref('')

// Variables de relance filtrées pour l'email actuel
const filteredRelanceVars = computed(() => {
  return ALL_VARIABLES.value.filter(g => g.groupe.startsWith('RELANCE'))
})

// Variables pour l'email actuel (filtrées par email)
function getVariablesForEmail(emailKey) {
  const relanceVars = getRelanceVariablesForEmail(emailKey)
  const otherVars = ALL_VARIABLES.value.filter(g => !g.groupe.startsWith('RELANCE'))
  return [...otherVars, ...relanceVars]
}

// Email visibility
const collapsedEmails = ref({})

// Tableau impayés concernés
const showImpayesTable = ref(false)
const impayesConcernes = ref([])

// Modals
const showLienModal = ref(false)
const lienPaiementEdit = ref('')
const lienPaiementTextareaEl = ref(null)
const nouveauLienNom = ref('')
const editingLienId = ref(null)

const showIaModal = ref(false)
const iaResponse = ref('')

const showChatGptModal = ref(false)
const chatGptEmailIdx = ref(0)
const chatGptResponse = ref('')
const chatGptTargetFormat = ref('single')

const showSmtpModal = ref(false)
const smtpCreateForEmailKey = ref(null)   // { key, format }
const smtpCreateForEmailFormat = ref(null)

// Toast UI editor refs
const editorRefs = {}

// ── Helper functions ──────────────────────────────────────────
const SCENARIO_FORMATS = ['single', 'multiple', 'both', 'broker']

function getScenario(email, format) {
  const f = format || 'single'
  if (!Array.isArray(email.scenarios)) {
    email.scenarios = SCENARIO_FORMATS.map(fmt => ({ format: fmt, active: true, smtp: '', cc: '', objet: '', corps: '' }))
  }
  let s = email.scenarios.find(s => s.format === f)
  if (!s) {
    s = { format: f, active: true, smtp: '', cc: '', objet: '', corps: '' }
    email.scenarios.push(s)
  }
  // Assurer les champs manquants sur anciens objets
  if (s.active === undefined) s.active = true
  if (s.smtp === undefined) s.smtp = ''
  if (s.cc === undefined) s.cc = ''
  return s
}

function getCurrentCorps(email) {
  return getScenario(email, email.activeScenario || 'single').corps || ''
}

function updateCorps(email, html) {
  getScenario(email, email.activeScenario || 'single').corps = html
}

function switchScenario(email, newScenario) {
  const editor = editorRefs[email._key]
  if (editor) {
    try {
      const instance = editor.getInstance()
      if (instance) {
        // 1. Sauvegarder le corps courant
        getScenario(email, email.activeScenario || 'single').corps = instance.getHTML()
        // 2. Mettre à jour activeScenario AVANT setHTML
        email.activeScenario = newScenario
        // 3. Charger le contenu du nouveau scénario
        instance.setHTML(getScenario(email, newScenario).corps || '')
        return
      }
    } catch (err) {
      console.error('Erreur switch scénario:', err)
    }
  }
  email.activeScenario = newScenario
}

// ── Constants ──────────────────────────────────────────────────
const VARIABLES = [
  { groupe: 'PAYEUR',   vars: ['payeur_nom', 'payeur_email', 'payeur_telephone', 'payeur_type'] },
  { groupe: 'FACTURE',  vars: ['nfacture', 'ref_piece', 'date_piece', 'reste_a_payer', 'montant_total', 'date_echeance'] },
  { groupe: 'BIEN',     vars: ['adresse_bien', 'code_postal', 'ville', 'numero_lot', 'etage', 'porte', 'batiment', 'residence'] },
  { groupe: 'PROPRIETAIRE', vars: ['proprietaire_nom', 'proprietaire_email', 'proprietaire_telephone', 'proprietaire_adresse'] },
  { groupe: 'APPORTEUR',   vars: ['apporteur_nom', 'apporteur_email', 'apporteur_telephone', 'apporteur_societe'] },
  { groupe: 'DOSSIER',  vars: ['numero_dossier', 'employe_intervention', 'date_debut_mission'] },
  { groupe: 'MULTIPLE', vars: ['total_impayes', 'nfactures_liste', 'ndossier_liste'] },
]

// Variables pour les emails précédents (relances)
// Fonction pour obtenir les variables de relance pour un email spécifique
function getRelanceVariablesForEmail(emailKey) {
  const currentIndex = emailsSorted.value.findIndex(e => e._key === emailKey)
  if (currentIndex === -1) return []
  
  // Ne retourner que les variables des emails précédents
  return emailsSorted.value.slice(0, currentIndex).map((email, index) => {
    const emailIndex = index + 1
    return {
      groupe: `RELANCE ${emailIndex}`,
      vars: [
        `relance.${emailIndex}.objet`,
        `relance.${emailIndex}.dateEnvoi`
      ]
    }
  })
}

const LIENS_DE_PAIEMENT_VARS = computed(() => {
  return liensPaiement.value.map(lien => ({
    name: `lien_paiement_${lien.id}`,
    display: lien.nom,
    url: lien.url,
    isPaymentLink: true // Flag explicite pour identifier les liens de paiement
  }))
})

const ALL_VARIABLES = computed(() => [
  ...VARIABLES,
  { groupe: 'LIENS DE PAIEMENT', vars: LIENS_DE_PAIEMENT_VARS.value },
])

const EXEMPLE_VARS = {
  nfacture: 'FA-2024-01', ref_piece: 'REF-001', date_piece: '01/01/2024',
  reste_a_payer: '1200', montant_total: '1500', date_echeance: '31/01/2024',
  payeur_nom: 'Jean Dupont', payeur_email: 'jean@example.com',
  payeur_telephone: '0612345678', payeur_type: 'Propriétaire',
  adresse_bien: '123 rue de la Paix', code_postal: '75001', ville: 'Paris',
  numero_lot: 'A12', numero_dossier: 'DOS-001',
  employe_intervention: 'Marie Martin', date_debut_mission: '01/01/2024',
}

const champOptions = [
  { label: 'Type payeur', value: 'payeur_type' },
  { label: 'Nom payeur', value: 'payeur_nom' },
  { label: 'Email payeur', value: 'payeur_email' },
  { label: 'Téléphone payeur', value: 'payeur_telephone' },
  { label: 'Reste à payer', value: 'reste_a_payer' },
  { label: 'Statut', value: 'statut' },
  { label: 'Statut dossier', value: 'statut_dossier' },
  { label: 'Nom apporteur', value: 'apporteur_nom' },
  { label: 'Email apporteur', value: 'apporteur_email' },
  { label: 'Téléphone apporteur', value: 'apporteur_telephone' },
  { label: 'Société apporteur', value: 'apporteur_societe' },
  { label: 'Nom propriétaire', value: 'proprietaire_nom' },
  { label: 'Email propriétaire', value: 'proprietaire_email' },
  { label: 'Téléphone propriétaire', value: 'proprietaire_telephone' },
  { label: 'Adresse bien', value: 'adresse_bien' },
  { label: 'Code postal', value: 'code_postal' },
  { label: 'Ville', value: 'ville' },
  { label: 'Numéro lot', value: 'numero_lot' },
]

const operateurOptions = [
  { label: 'est égal à', value: 'egal' },
  { label: 'n\'est pas égal à', value: 'different' },
  { label: 'supérieur à', value: 'superieur' },
  { label: 'inférieur à', value: 'inferieur' },
  { label: 'contient', value: 'contient' },
  { label: 'ne contient pas', value: 'ne_contient_pas' },
  { label: 'commence par', value: 'commence_par' },
  { label: 'ne commence pas par', value: 'ne_commence_pas_par' },
  { label: 'se termine par', value: 'se_termine_par' },
  { label: 'ne se termine pas par', value: 'ne_se_termine_pas_par' },
]

const groupeLogiqueOptions = [
  { label: 'ET', value: 'ET' },
  { label: 'OU', value: 'OU' },
]

const scenarioTabs = [
  { label: '1 impayé', value: 'single' },
  { label: 'Plusieurs impayés', value: 'multiple' },
  { label: 'Impayés + apporteur', value: 'both' },
  { label: 'Apporteur seul', value: 'broker' },
]

const editorOptions = {
  minHeight: '200px',
  language: 'fr',
  usageStatistics: false,
  hideModeSwitch: true,
}

// ── Computed ───────────────────────────────────────────────────
const emailsSorted = computed(() =>
  [...emails.value].sort((a, b) => a.delai - b.delai)
)

const smtpOptions = computed(() => [
  ...smtpProfiles.value.map(p => ({
    value: p.id,
    label: p.get('nom_affiche') || p.get('nom'),
  })),
])

const filteredVars = computed(() => {
  const s = varsSearch.value.toLowerCase()
  if (!s) return ALL_VARIABLES.value
  return ALL_VARIABLES.value
    .map(g => ({ ...g, vars: g.vars.filter(v => v.includes(s)) }))
    .filter(g => g.vars.length > 0)
})

const filteredLienVars = computed(() => {
  const s = lienVarsSearch.value.toLowerCase()
  const allVars = ALL_VARIABLES.value
    .map(g => ({ ...g, vars: g.vars.filter(v => {
      // Exclure les variables qui sont des liens de paiement (isPaymentLink = true)
      if (v && typeof v === 'object' && v.isPaymentLink) return false
      return true
    }) }))
    .filter(g => g.vars.length > 0)
  
  if (!s) return allVars
  return allVars
    .map(g => ({ ...g, vars: g.vars.filter(v => {
      const varName = typeof v === 'object' ? v.name || v.display : v
      return varName && varName.toLowerCase().includes(s)
    }) }))
    .filter(g => g.vars.length > 0)
})

const liensPaiementOptions = computed(() => {
  return liensPaiement.value.map(lien => ({
    value: lien.url,
    label: lien.nom,
  }))
})

const lienPaiementApercu = computed(() => {
  let url = lienPaiementEdit.value
  for (const [k, v] of Object.entries(EXEMPLE_VARS)) {
    url = url.replace(new RegExp(`\\[\\[${k}\\]\\]`, 'g'), v)
  }
  return url
})

// ── Options dynamiques pour les selects ──────────────────────────────────────
const { getOptions, invalidateCache } = useDynamicOptions()

// Charge les options pour un champ donné
async function loadOptionsForChamp(champ, regle) {
  try {
    // Ne pas charger pour les champs numériques qui utilisent des inputs texte
    const numericFields = ['reste_a_payer']
    
    if (numericFields.includes(champ)) {
      regle.options = []
      return
    }
    
    // Charger les options dynamiques pour tous les autres champs
    const options = await getOptions(champ, false) // false = ne pas utiliser le cache pour avoir les dernières données
    regle.options = options
  } catch (error) {
    console.error(`Failed to load options for ${champ}:`, error)
    regle.options = []
  }
}

// Charge les options pour toutes les règles existantes
async function loadAllOptions() {
  for (const groupe of groupesRegles.value) {
    for (const regle of groupe.regles) {
      await loadOptionsForChamp(regle.champ, regle)
    }
  }
}

// Charge les liens de paiement
async function chargerLiensPaiement() {
  try {
    const liens = await $parse.Cloud.run('listLiensPaiement')
    liensPaiement.value = liens
  } catch (err) {
    console.error('Erreur lors du chargement des liens de paiement:', err)
    toast.add({ title: 'Erreur', description: 'Impossible de charger les liens de paiement', color: 'red' })
  }
}

// ── Chargement ────────────────────────────────────────────────
async function charger() {
  loading.value = true
  try {
    const q = new $parse.Query('Sequence')
    const seq = await q.get(route.params.id)
    sequence.value = seq
    nom.value = seq.get('nom') || ''
    lienPaiement.value = seq.get('lien_paiement') || ''
    attributionAutomatique.value = seq.get('attribution_automatique') || false
    validationObligatoire.value = seq.get('validation_obligatoire') || false
    publiee.value = seq.get('publiee') || false
    
    // Charger les anciennes règles ou les nouvelles groupes de règles
    const anciennesRegles = seq.get('regles') || []
    const nouveauxGroupes = seq.get('groupes_regles') || []
    
    if (nouveauxGroupes.length > 0) {
      // Nouveau format avec groupes
      groupesRegles.value = nouveauxGroupes.map(g => ({
        logique: g.logique || 'ET',
        regles: g.regles.map(r => ({
          champ: r.champ || 'payeur_type',
          operateur: r.operateur || 'egal',
          // Convertir la valeur en tableau si c'est pour un opérateur multiple
          valeur: (r.operateur === 'egal' || r.operateur === 'different') && !Array.isArray(r.valeur) 
                   ? (r.valeur ? [r.valeur] : [])
                   : (Array.isArray(r.valeur) ? r.valeur : (r.valeur || '')),
          options: []
        }))
      }))
    } else if (anciennesRegles.length > 0) {
      // Migration depuis l'ancien format
      groupesRegles.value = [{
        logique: reglesType.value || 'ET',
        regles: anciennesRegles.map(r => ({
          champ: r.champ || 'payeur_type',
          operateur: r.operateur || 'egal',
          // Convertir la valeur en tableau si c'est pour un opérateur multiple
          valeur: (r.operateur === 'egal' || r.operateur === 'different') 
                   ? (r.valeur ? [r.valeur] : [])
                   : (r.valeur || ''),
          options: []
        }))
      }]
    } else {
      // Nouvelle séquence
      groupesRegles.value = [{
        logique: 'ET',
        regles: [{ champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }]
      }]
    }
    
    const rawEmails = seq.get('emails') || []
    emails.value = rawEmails.map((e, i) => {
      let scenarios
      if (Array.isArray(e.scenarios)) {
        // Structure actuelle — s'assurer que les 4 formats existent avec tous les champs
        scenarios = SCENARIO_FORMATS.map(fmt => {
          const existing = e.scenarios.find(s => s.format === fmt) || {}
          return {
            format: fmt,
            active: existing.active !== false,
            smtp:   existing.smtp  ?? e.smtp ?? '',
            cc:     existing.cc    ?? e.cc   ?? '',
            objet:  existing.objet ?? '',
            corps:  existing.corps ?? ''
          }
        })
      } else if (e.corps && typeof e.corps === 'object') {
        // Migration depuis corps objet + smtp/cc/objet partagés
        scenarios = SCENARIO_FORMATS.map(fmt => ({
          format: fmt, active: true,
          smtp: e.smtp || '', cc: e.cc || '',
          objet: e.objet || '', corps: e.corps[fmt] || ''
        }))
      } else {
        // Migration depuis corps string (très ancienne structure)
        scenarios = SCENARIO_FORMATS.map(fmt => ({
          format: fmt, active: true,
          smtp: e.smtp || '', cc: e.cc || '',
          objet: e.objet || '',
          corps: fmt === 'single' ? (e.corps || '') : ''
        }))
      }
      return {
        _key: `email_${i}_${seq.id}`,
        delai: e.delai || 0,
        smtp: e.smtp || '',
        to: e.to || '[[payeur_email]]',
        cc: e.cc || '',
        activeScenario: 'single',
        scenarios
      }
    })

    const sq = new $parse.Query('SmtpProfile')
    sq.ascending('nom')
    sq.limit(50)
    smtpProfiles.value = await sq.find()

    // Charger les liens de paiement
    await chargerLiensPaiement()

    // Charger les options dynamiques pour toutes les règles
    await loadAllOptions()

    await calculerApercu()
  } catch (err) {
    toast.add({ title: 'Erreur de chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// ── Fonctions pour gérer les groupes de règles ────────────────────────────

async function chargerOptionsPourChamp(regle) {
  await loadOptionsForChamp(regle.champ, regle)
}

async function ajouterGroupeRegles() {
  const newRegle = {
    champ: 'payeur_type',
    operateur: 'egal',
    valeur: [],
    options: []
  }
  await loadOptionsForChamp('payeur_type', newRegle)
  groupesRegles.value.push({
    logique: 'ET',
    regles: [newRegle]
  })
}

function supprimerGroupe(groupeIdx) {
  if (groupesRegles.value.length > 1) {
    groupesRegles.value.splice(groupeIdx, 1)
  } else {
    toast.add({ title: 'Avertissement', description: 'Une séquence doit avoir au moins un groupe de règles', color: 'amber' })
  }
}

async function ajouterRegleAuGroupe(groupeIdx) {
  const newRegle = {
    champ: 'payeur_type',
    operateur: 'egal',
    valeur: [],
    options: []
  }
  await loadOptionsForChamp('payeur_type', newRegle)
  groupesRegles.value[groupeIdx].regles.push(newRegle)
}

function supprimerRegle(groupeIdx, regleIdx) {
  const groupe = groupesRegles.value[groupeIdx]
  if (groupe.regles.length > 1) {
    groupe.regles.splice(regleIdx, 1)
  } else {
    toast.add({ title: 'Avertissement', description: 'Un groupe doit avoir au moins une règle', color: 'amber' })
  }
}

// ── Sauvegarde ────────────────────────────────────────────────
async function sauvegarder() {
  saving.value = true
  try {
    // Sync editor HTML before saving
    for (const email of emails.value) {
      const editor = editorRefs[email._key]
      if (editor) {
        try {
          getScenario(email, email.activeScenario || 'single').corps = editor.getInstance().getHTML()
        } catch {}
      }
    }
    sequence.value.set('nom', nom.value)
    sequence.value.set('lien_paiement', lienPaiement.value)
    sequence.value.set('emails', emails.value.map(({ _key, activeScenario, ...rest }) => rest))
    sequence.value.set('groupes_regles', groupesRegles.value) // Sauvegarder les nouveaux groupes de règles
    sequence.value.set('attribution_automatique', attributionAutomatique.value) // Sauvegarder le toggle
    sequence.value.set('validation_obligatoire', validationObligatoire.value) // Sauvegarder la validation obligatoire
    
    // Conserver l'ancien format pour compatibilité arrière
    const anciennesRegles = groupesRegles.value.flatMap(g => 
      g.regles.map(r => ({ champ: r.champ, operateur: r.operateur, valeur: r.valeur }))
    )
    sequence.value.set('regles', anciennesRegles)
    sequence.value.set('regles_type', groupesRegles.value.length > 0 ? groupesRegles.value[0].logique : 'ET')
    
    await sequence.value.save()
    toast.add({ title: 'Séquence enregistrée', color: 'green' })
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

// ── Publication ───────────────────────────────────────────────
async function togglePublication() {
  publishing.value = true
  const precedent = publiee.value
  try {
    publiee.value = !precedent
    sequence.value.set('publiee', publiee.value)
    await sequence.value.save()
    toast.add({ title: publiee.value ? 'Séquence publiée' : 'Séquence dépubliée', color: 'green' })
  } catch (err) {
    publiee.value = precedent
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    publishing.value = false
  }
}

// ── Emails ────────────────────────────────────────────────────
function ajouterEmail() {
  emails.value.push({
    _key: `email_new_${Date.now()}`,
    delai: 0,
    smtp: '',
    to: '[[payeur_email]]',
    cc: '',
    activeScenario: 'single',
    scenarios: SCENARIO_FORMATS.map(format => ({ format, active: true, smtp: '', cc: '', objet: '', corps: '' }))
  })
}

// Watcher pour mettre à jour le contenu de l'éditeur lorsque l'onglet change
watch(emails.value, (newEmails) => {
  newEmails.forEach(email => {
    const editor = editorRefs[email._key]
    if (editor) {
      const currentContent = getScenario(email, email.activeScenario || 'single').corps || ''
      try {
        const editorInstance = editor.getInstance()
        if (editorInstance.getHTML() !== currentContent) {
          editorInstance.setHTML(currentContent)
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'éditeur:', err)
      }
    }
  })
}, { deep: true })

function supprimerEmail(key) {
  const idx = emails.value.findIndex(e => e._key === key)
  if (idx !== -1) emails.value.splice(idx, 1)
}

function toggleEmailVisibility(key) {
  if (collapsedEmails.value[key]) {
    delete collapsedEmails.value[key]
  } else {
    collapsedEmails.value[key] = true
  }
}

function onSmtpChange(email, scenario, val) {
  if (val === '__create__') {
    smtpCreateForEmailKey.value = email._key
    smtpCreateForEmailFormat.value = scenario.format
    scenario.smtp = ''
    showSmtpModal.value = true
  }
}

// ── Variables ─────────────────────────────────────────────────
async function copyVariable(varName) {
  const textToCopy = `[[${varName}]]`
  await navigator.clipboard.writeText(textToCopy)
  toast.add({ title: 'Copié', description: 'Collez avec Ctrl+V dans l\'éditeur', color: 'green', timeout: 2000 })
}

async function copyPaymentLink(paymentLink) {
  const textToCopy = paymentLink.url
  await navigator.clipboard.writeText(textToCopy)
  toast.add({ title: 'Copié', description: 'Collez avec Ctrl+V dans l\'éditeur', color: 'green', timeout: 2000 })
}

async function copyLienPaiement() {
  if (!lienPaiement.value) return
  await navigator.clipboard.writeText(lienPaiement.value)
  toast.add({ title: 'Lien copié', description: 'Collez avec Ctrl+V dans l\'éditeur', color: 'green', timeout: 2000 })
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  toast.add({ title: 'Copié', color: 'green', timeout: 2000 })
}

// ── Lien de paiement modal ────────────────────────────────────
function ouvrirLienModal() {
  nouveauLienNom.value = ''
  lienPaiementEdit.value = ''
  editingLienId.value = null
  lienVarsSearch.value = ''
  showLienModal.value = true
}

function editerLienPaiement(lien) {
  editingLienId.value = lien.id
  nouveauLienNom.value = lien.nom
  lienPaiementEdit.value = lien.url
  showLienModal.value = true
}

function annulerEditionLien() {
  editingLienId.value = null
  nouveauLienNom.value = ''
  lienPaiementEdit.value = ''
}

async function supprimerLienPaiement(lienId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce lien de paiement ?')) return
  
  try {
    await $parse.Cloud.run('deleteLienPaiement', { lienId })
    await chargerLiensPaiement()
    toast.add({ title: 'Lien supprimé', color: 'green' })
  } catch (err) {
    console.error('Erreur lors de la suppression du lien de paiement:', err)
    toast.add({ title: 'Erreur', description: 'Impossible de supprimer le lien de paiement', color: 'red' })
  }
}

async function enregistrerNouveauLienPaiement() {
  if (!nouveauLienNom.value.trim() || !lienPaiementEdit.value.trim()) {
    toast.add({ title: 'Erreur', description: 'Veuillez remplir tous les champs', color: 'red' })
    return
  }
  
  try {
    const lienData = {
      nom: nouveauLienNom.value.trim(),
      url: lienPaiementEdit.value.trim()
    }
    
    if (editingLienId.value) {
      // Mise à jour d'un lien existant
      await $parse.Cloud.run('updateLienPaiement', { 
        lienId: editingLienId.value,
        ...lienData 
      })
      toast.add({ title: 'Lien mis à jour', color: 'green' })
    } else {
      // Création d'un nouveau lien
      await $parse.Cloud.run('createLienPaiement', lienData)
      toast.add({ title: 'Lien créé', color: 'green' })
    }
    
    await chargerLiensPaiement()
    annulerEditionLien()
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement du lien de paiement:', err)
    toast.add({ title: 'Erreur', description: err.message || 'Impossible d\'enregistrer le lien de paiement', color: 'red' })
  }
}

function insererVariableEnLien(varName) {
  const el = lienPaiementTextareaEl.value
  const v = `[[${varName}]]`
  if (el) {
    const s = el.selectionStart ?? lienPaiementEdit.value.length
    const e = el.selectionEnd ?? lienPaiementEdit.value.length
    lienPaiementEdit.value = lienPaiementEdit.value.slice(0, s) + v + lienPaiementEdit.value.slice(e)
    nextTick(() => {
      el.selectionStart = el.selectionEnd = s + v.length
      el.focus()
    })
  } else {
    lienPaiementEdit.value += v
  }
}

// ── IA modal ──────────────────────────────────────────────────
async function copyPromptIA() {
  const allVars = ALL_VARIABLES.value.flatMap(g => g.vars.map(v => `[[${v}]]`)).join(', ')
  const prompt = `Tu es un expert en relance de factures impayées pour le secteur immobilier.
Génère une séquence de ${emails.value.length || 3} emails de relance progressivement fermes.

Chaque email a 4 formats selon le contexte du payeur :
- single   : 1 seul impayé, sans apporteur d'affaire
- multiple : plusieurs impayés, sans apporteur d'affaire
- both     : plusieurs impayés ET un apporteur d'affaire
- broker   : 1 seul impayé ET un apporteur d'affaire

IMPORTANT: Retourne UNIQUEMENT un tableau YAML valide. Structure attendue :
---
- delai: [nombre de jours]
  scenarios:
    - format: single
      objet: "[Objet pour 1 impayé]"
      corps: |
        [Corps Markdown pour 1 impayé sans apporteur]
    - format: multiple
      objet: "[Objet pour plusieurs impayés]"
      corps: |
        [Corps Markdown pour plusieurs impayés sans apporteur]
    - format: both
      objet: "[Objet pour plusieurs impayés + apporteur]"
      corps: |
        [Corps Markdown pour plusieurs impayés avec apporteur]
    - format: broker
      objet: "[Objet pour 1 impayé + apporteur]"
      corps: |
        [Corps Markdown pour 1 impayé avec apporteur]

Variables disponibles : ${allVars}

Exemple complet :
---
- delai: 7
  scenarios:
    - format: single
      objet: "Rappel : Facture [[nfacture]] impayée"
      corps: |
        Bonjour [[payeur_nom]],

        Votre facture [[nfacture]] d'un montant de [[reste_a_payer]] € est en attente de règlement.

        [Régler ma facture]([[lien_paiement]])

        | Facture | Échéance | Montant | Reste dû |
        |---------|----------|---------|----------|
        | [[nfacture]] | [[date_echeance]] | [[montant_total]] € | [[reste_a_payer]] € |
    - format: multiple
      objet: "Rappel : Plusieurs factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Plusieurs de vos factures sont en attente de règlement, dont [[nfacture]] ([[reste_a_payer]] €).

        [Régler mes factures]([[lien_paiement]])
    - format: both
      objet: "Rappel : Plusieurs factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Plusieurs de vos factures sont en attente de règlement, dont [[nfacture]] ([[reste_a_payer]] €).
        Votre apporteur [[apporteur_nom]] est également informé.

        [Régler mes factures]([[lien_paiement]])
    - format: broker
      objet: "Rappel : Facture [[nfacture]] impayée"
      corps: |
        Bonjour [[payeur_nom]],

        Votre facture [[nfacture]] d'un montant de [[reste_a_payer]] € est en attente de règlement.
        Votre apporteur [[apporteur_nom]] est également informé.

        [Régler ma facture]([[lien_paiement]])

- delai: 14
  scenarios:
    - format: single
      objet: "Mise en demeure – Facture [[nfacture]]"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré notre rappel, votre facture [[nfacture]] ([[reste_a_payer]] €) reste impayée.
        Sans règlement sous 8 jours, nous engagerons une procédure de recouvrement.
    - format: multiple
      objet: "Mise en demeure – Factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré nos rappels, plusieurs de vos factures dont [[nfacture]] restent impayées.
        Sans règlement global sous 8 jours, nous engagerons une procédure de recouvrement.
    - format: both
      objet: "Mise en demeure – Factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré nos rappels, plusieurs de vos factures dont [[nfacture]] restent impayées.
        Votre apporteur [[apporteur_nom]] est informé de cette procédure.
    - format: broker
      objet: "Mise en demeure – Facture [[nfacture]]"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré notre rappel, votre facture [[nfacture]] ([[reste_a_payer]] €) reste impayée.
        Votre apporteur [[apporteur_nom]] est informé de cette procédure.
`
  await copyToClipboard(prompt)
}

function validerIA() {
  try {
    const parsed = yaml.load(iaResponse.value)
    if (!Array.isArray(parsed)) throw new Error('Attendu un tableau YAML')

    const newEmails = parsed.map((e, i) => {
      if (!Array.isArray(e.scenarios) || e.scenarios.length === 0)
        throw new Error(`Email ${i + 1} : propriété "scenarios" manquante ou vide`)

      const scenarios = SCENARIO_FORMATS.map(fmt => {
        const s = e.scenarios.find(s => s.format === fmt) || {}
        return { format: fmt, objet: s.objet || '', corps: s.corps || '' }
      })

      return {
        _key: `email_ia_${i}_${Date.now()}`,
        delai: e.delai ?? 0,
        smtp: '',
        to: '[[payeur_email]]',
        cc: '',
        activeScenario: 'single',
        scenarios
      }
    })

    emails.value = newEmails

    nextTick(() => {
      newEmails.forEach(email => {
        const editor = editorRefs[email._key]
        if (!editor) return
        const instance = editor.getInstance()
        if (!instance) return
        try {
          // Convertir le markdown → HTML pour chaque scénario via l'éditeur
          for (const scenario of email.scenarios) {
            if (!scenario.corps) continue
            email.activeScenario = scenario.format
            instance.setMarkdown(scenario.corps)
            scenario.corps = instance.getHTML()
          }
        } catch (err) {
          console.error('Erreur conversion markdown:', err)
        }
        // Remettre sur single et afficher
        email.activeScenario = 'single'
        instance.setHTML(getScenario(email, 'single').corps || '')
      })
    })

    showIaModal.value = false
    iaResponse.value = ''
    toast.add({ title: `${newEmails.length} email(s) générés`, color: 'green' })
  } catch (err) {
    toast.add({ title: 'YAML invalide', description: err.message, color: 'red' })
  }
}

// ── ChatGPT modal (par email) ─────────────────────────────────
function openChatGptModal(idx) {
  chatGptEmailIdx.value = idx
  chatGptResponse.value = ''
  chatGptTargetFormat.value = emailsSorted.value[idx]?.activeScenario || 'single'
  showChatGptModal.value = true
}

async function copyChatGptPrompt(fmt) {
  const idx = chatGptEmailIdx.value
  const email = emailsSorted.value[idx]
  chatGptTargetFormat.value = fmt
  const scenarioLabels = {
    single:   '1 seul impayé, sans apporteur d\'affaire',
    multiple: 'plusieurs impayés, sans apporteur d\'affaire',
    both:     'plusieurs impayés avec un apporteur d\'affaire',
    broker:   '1 seul impayé avec un apporteur d\'affaire',
  }
  const currentScenario = email ? getScenario(email, fmt) : null
  const emailsPrecedents = emailsSorted.value
    .slice(0, idx)
    .map((e, i) => `Email ${i + 1} (J+${e.delai}) : ${getScenario(e, fmt).objet || '(sans objet)'}`)
    .join('\n')
  const vars = ALL_VARIABLES.value.flatMap(g => g.vars.map(v => `[[${v}]]`)).join(', ')
  const prompt = `Rédige un email de relance de facture impayée pour le secteur immobilier.
Contexte du payeur : ${scenarioLabels[fmt]}.${emailsPrecedents ? `\nEmails précédents :\n${emailsPrecedents}\n` : ''}
Email ${idx + 1} (J+${email?.delai ?? 0}) - Objet prévu : ${currentScenario?.objet || '...'}
Variables disponibles : ${vars}

IMPORTANT: Retourne UNIQUEMENT le corps de l'email en Markdown (sans l'objet) :

Bonjour [[payeur_nom]],

Votre facture [[nfacture]] est en retard.

[Lien de paiement]([[lien_paiement]])

| Facture | Date d'échéance | Montant TTC | Reste à payer |
|---------|-----------------|-------------|---------------|
| [[nfacture]] | [[date_echeance]] | [[montant_total]] € | [[reste_a_payer]] € |
`
  await copyToClipboard(prompt)
}

function insererReponseChatGpt() {
  const idx = chatGptEmailIdx.value
  const email = emailsSorted.value[idx]
  if (email) {
    const fmt = chatGptTargetFormat.value || 'single'
    const scenario = getScenario(email, fmt)
    const editor = editorRefs[email._key]
    // Convertir markdown → HTML via l'éditeur si c'est le scénario actif,
    // sinon stocker directement (sera converti au prochain switchScenario)
    if (editor && email.activeScenario === fmt) {
      try {
        editor.getInstance().setMarkdown(chatGptResponse.value)
        scenario.corps = editor.getInstance().getHTML()
      } catch (err) {
        scenario.corps = chatGptResponse.value
      }
    } else {
      // Scénario en arrière-plan : on convertit via l'éditeur sans changer l'onglet visible
      if (editor) {
        try {
          const instance = editor.getInstance()
          const prevFormat = email.activeScenario
          email.activeScenario = fmt
          instance.setMarkdown(chatGptResponse.value)
          scenario.corps = instance.getHTML()
          email.activeScenario = prevFormat
          instance.setHTML(getScenario(email, prevFormat).corps || '')
        } catch (err) {
          scenario.corps = chatGptResponse.value
        }
      } else {
        scenario.corps = chatGptResponse.value
      }
    }
    toast.add({ title: `Corps "${scenarioTabs.find(t => t.value === fmt)?.label}" mis à jour`, color: 'green', timeout: 2000 })
  }
  showChatGptModal.value = false
  chatGptResponse.value = ''
}

// ── SMTP Drawer ────────────────────────────────────────────────
function onSmtpSaved(profile) {
  smtpProfiles.value.push(profile)
  // Auto-select on the email that triggered creation
  if (smtpCreateForEmailKey.value) {
    const email = emails.value.find(e => e._key === smtpCreateForEmailKey.value)
    if (email) getScenario(email, smtpCreateForEmailFormat.value || 'single').smtp = profile.id
  }
  smtpCreateForEmailKey.value = null
  smtpCreateForEmailFormat.value = null
}

// ── Aperçu règles (debounce) ──────────────────────────────────
async function calculerApercu() {
  try {
    // Construire une requête complexe avec les groupes ET/OU
    const queriesParGroupe = []
    
    for (const groupe of groupesRegles.value) {
      const groupeQuery = new $parse.Query('Impaye')
      const conditions = []
      
      for (const regle of groupe.regles) {
        if (!regle.champ || regle.valeur === '' || !regle.valeur) continue
        
        const conditionQuery = new $parse.Query('Impaye')
        
        switch (regle.operateur) {
          case 'egal':
            if (Array.isArray(regle.valeur)) {
              // Pour les tableaux, utiliser containedIn
              conditionQuery.containedIn(regle.champ, regle.valeur)
            } else {
              conditionQuery.equalTo(regle.champ, regle.valeur)
            }
            break
          case 'different':
            if (Array.isArray(regle.valeur)) {
              // Pour les tableaux, utiliser notContainedIn
              conditionQuery.notContainedIn(regle.champ, regle.valeur)
            } else {
              conditionQuery.notEqualTo(regle.champ, regle.valeur)
            }
            break
          case 'superieur':
            conditionQuery.greaterThan(regle.champ, Number(regle.valeur))
            break
          case 'inferieur':
            conditionQuery.lessThan(regle.champ, Number(regle.valeur))
            break
          case 'contient':
            conditionQuery.contains(regle.champ, regle.valeur)
            break
          case 'ne_contient_pas':
            conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').contains(regle.champ, regle.valeur))
            break
          case 'commence_par':
            conditionQuery.startsWith(regle.champ, regle.valeur)
            break
          case 'ne_commence_pas_par':
            conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').startsWith(regle.champ, regle.valeur))
            break
          case 'se_termine_par':
            conditionQuery.endsWith(regle.champ, regle.valeur)
            break
          case 'ne_se_termine_pas_par':
            conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').endsWith(regle.champ, regle.valeur))
            break
        }
        
        conditions.push(conditionQuery)
      }
      
      if (conditions.length > 0) {
        // Appliquer la logique ET au sein du groupe
        let groupeFinalQuery = conditions[0]
        for (let i = 1; i < conditions.length; i++) {
          groupeFinalQuery = $parse.Query.and(groupeFinalQuery, conditions[i])
        }
        queriesParGroupe.push(groupeFinalQuery)
      }
    }
    
    if (queriesParGroupe.length === 0) {
      // Aucune règle définie
      apercuConcernes.value = 0
      apercuExclus.value = 0
      impayesConcernes.value = []
      return
    }
    
    // Appliquer la logique OU entre les groupes
    let finalQuery = queriesParGroupe[0]
    for (let i = 1; i < queriesParGroupe.length; i++) {
      finalQuery = $parse.Query.or(finalQuery, queriesParGroupe[i])
    }
    
    const [concernes, total] = await Promise.all([
      finalQuery.count(),
      new $parse.Query('Impaye').count(),
    ])
    apercuConcernes.value = concernes
    apercuExclus.value = total - concernes
    
    // Si le tableau est affiché, charger les impayés concernés
    if (showImpayesTable.value && concernes > 0) {
      await chargerImpayesConcernes(finalQuery)
    }
  } catch (err) {
    console.error('Erreur calcul aperçu:', err)
    toast.add({ title: 'Erreur', description: 'Impossible de calculer l\'aperçu', color: 'red' })
  }
}

// Charge les impayés concernés par les règles
async function chargerImpayesConcernes(query) {
  try {
    // Limiter à 100 résultats pour éviter de surcharger l'interface
    query.limit(100)
    query.include(['payeur', 'dossier'])
    query.ascending('nfacture')
    
    const results = await query.find()
    
    // Vérifier quels impayés sont déjà dans la séquence
    const sequenceImpayes = sequence.value.get('impayes') || []
    const sequenceImpayeIds = new Set(sequenceImpayes.map(i => i.id))
    
    impayesConcernes.value = results.map(impaye => ({
      id: impaye.id,
      nfacture: impaye.get('nfacture') || 'N/A',
      payeur_nom: impaye.get('payeur_nom') || 'Inconnu',
      reste_a_payer: impaye.get('reste_a_payer') || '0',
      date_echeance: impaye.get('date_echeance') || 'N/A',
      statut: impaye.get('statut') || 'inconnu',
      dejaDansSequence: sequenceImpayeIds.has(impaye.id)
    }))
  } catch (err) {
    console.error('Erreur chargement impayés concernés:', err)
    toast.add({ title: 'Erreur', description: 'Impossible de charger les impayés concernés', color: 'red' })
  }
}

// Watcher pour charger les impayés quand le tableau est affiché
watch(showImpayesTable, async (newVal) => {
  if (newVal && apercuConcernes.value > 0) {
    // Reconstruire la requête et charger les impayés
    try {
      const queriesParGroupe = []
      
      for (const groupe of groupesRegles.value) {
        const groupeQuery = new $parse.Query('Impaye')
        const conditions = []
        
        for (const regle of groupe.regles) {
          if (!regle.champ || regle.valeur === '' || !regle.valeur) continue
          
          const conditionQuery = new $parse.Query('Impaye')
          
          switch (regle.operateur) {
            case 'egal':
              if (Array.isArray(regle.valeur)) {
                conditionQuery.containedIn(regle.champ, regle.valeur)
              } else {
                conditionQuery.equalTo(regle.champ, regle.valeur)
              }
              break
            case 'different':
              if (Array.isArray(regle.valeur)) {
                conditionQuery.notContainedIn(regle.champ, regle.valeur)
              } else {
                conditionQuery.notEqualTo(regle.champ, regle.valeur)
              }
              break
            case 'superieur':
              conditionQuery.greaterThan(regle.champ, Number(regle.valeur))
              break
            case 'inferieur':
              conditionQuery.lessThan(regle.champ, Number(regle.valeur))
              break
            case 'contient':
              conditionQuery.contains(regle.champ, regle.valeur)
              break
            case 'ne_contient_pas':
              conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').contains(regle.champ, regle.valeur))
              break
            case 'commence_par':
              conditionQuery.startsWith(regle.champ, regle.valeur)
              break
            case 'ne_commence_pas_par':
              conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').startsWith(regle.champ, regle.valeur))
              break
            case 'se_termine_par':
              conditionQuery.endsWith(regle.champ, regle.valeur)
              break
            case 'ne_se_termine_pas_par':
              conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').endsWith(regle.champ, regle.valeur))
              break
          }
          
          conditions.push(conditionQuery)
        }
        
        if (conditions.length > 0) {
          let groupeFinalQuery = conditions[0]
          for (let i = 1; i < conditions.length; i++) {
            groupeFinalQuery = $parse.Query.and(groupeFinalQuery, conditions[i])
          }
          queriesParGroupe.push(groupeFinalQuery)
        }
      }
      
      if (queriesParGroupe.length > 0) {
        let finalQuery = queriesParGroupe[0]
        for (let i = 1; i < queriesParGroupe.length; i++) {
          finalQuery = $parse.Query.or(finalQuery, queriesParGroupe[i])
        }
        await chargerImpayesConcernes(finalQuery)
      }
    } catch (err) {
      console.error('Erreur chargement impayés:', err)
      toast.add({ title: 'Erreur', description: 'Impossible de charger les impayés', color: 'red' })
    }
  }
})

let debounceTimer = null
watch(groupesRegles, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(calculerApercu, 600)
}, { deep: true })

// Watcher pour charger les impayés quand le tableau est affiché
watch(showImpayesTable, async (newVal) => {
  if (newVal && apercuConcernes.value > 0) {
    // Reconstruire la requête et charger les impayés
    try {
      const queriesParGroupe = []
      
      for (const groupe of groupesRegles.value) {
        const groupeQuery = new $parse.Query('Impaye')
        const conditions = []
        
        for (const regle of groupe.regles) {
          if (!regle.champ || regle.valeur === '' || !regle.valeur) continue
          
          const conditionQuery = new $parse.Query('Impaye')
          
          switch (regle.operateur) {
            case 'egal':
              if (Array.isArray(regle.valeur)) {
                conditionQuery.containedIn(regle.champ, regle.valeur)
              } else {
                conditionQuery.equalTo(regle.champ, regle.valeur)
              }
              break
            case 'different':
              if (Array.isArray(regle.valeur)) {
                conditionQuery.notContainedIn(regle.champ, regle.valeur)
              } else {
                conditionQuery.notEqualTo(regle.champ, regle.valeur)
              }
              break
            case 'superieur':
              conditionQuery.greaterThan(regle.champ, Number(regle.valeur))
              break
            case 'inferieur':
              conditionQuery.lessThan(regle.champ, Number(regle.valeur))
              break
            case 'contient':
              conditionQuery.contains(regle.champ, regle.valeur)
              break
            case 'ne_contient_pas':
              conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').contains(regle.champ, regle.valeur))
              break
            case 'commence_par':
              conditionQuery.startsWith(regle.champ, regle.valeur)
              break
            case 'ne_commence_pas_par':
              conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').startsWith(regle.champ, regle.valeur))
              break
            case 'se_termine_par':
              conditionQuery.endsWith(regle.champ, regle.valeur)
              break
            case 'ne_se_termine_pas_par':
              conditionQuery.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new $parse.Query('Impaye').endsWith(regle.champ, regle.valeur))
              break
          }
          
          conditions.push(conditionQuery)
        }
        
        if (conditions.length > 0) {
          let groupeFinalQuery = conditions[0]
          for (let i = 1; i < conditions.length; i++) {
            groupeFinalQuery = $parse.Query.and(groupeFinalQuery, conditions[i])
          }
          queriesParGroupe.push(groupeFinalQuery)
        }
      }
      
      if (queriesParGroupe.length > 0) {
        let finalQuery = queriesParGroupe[0]
        for (let i = 1; i < queriesParGroupe.length; i++) {
          finalQuery = $parse.Query.or(finalQuery, queriesParGroupe[i])
        }
        await chargerImpayesConcernes(finalQuery)
      }
    } catch (err) {
      console.error('Erreur chargement impayés:', err)
      toast.add({ title: 'Erreur', description: 'Impossible de charger les impayés', color: 'red' })
    }
  }
})

onMounted(() => {
  charger()
})

onUnmounted(() => {
  clearTimeout(debounceTimer)
})
</script>
