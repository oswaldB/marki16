import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as syncDataExecute } from './workflows/sync-data.js';
import { execute as clearEventsExecute } from './workflows/clear-events.js';

window.workflows = {
  'init': { execute: initExecute },
  'sync-data': { execute: syncDataExecute },
  'clear-events': { execute: clearEventsExecute },
};

Alpine.data('dashboardPage', () => ({
  loading: true,
  error: null,

  kpi: {
    factures_en_attente: 0,
    impayes_actifs: 0,
    montant_total: 0,
    relances_jour: 0,
    taux_recouvrement: 0,
  },

  aging: {
    j7: { count: 0, montant: 0 },
    j30: { count: 0, montant: 0 },
    j60: { count: 0, montant: 0 },
    j120: { count: 0, montant: 0 },
    j60_120: { count: 0, montant: 0 },
  },

  montantsMois: {
    ttc: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    paye: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    reste: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    count: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  relancesJour: [],
  impayes_recents: [],
  contactsSansEmail: [],
  syncing: false,
  chartInstance: null,

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.kpi = result.data.kpi;
        this.aging = result.data.aging;
        this.montantsMois = result.data.montantsMois;
        this.relancesJour = result.data.relancesJour;
        this.impayes_recents = result.data.impayes_recents;
        this.contactsSansEmail = result.data.contactsSansEmail;
        this.$nextTick(() => this.initChart());
      } else {
        this.error = result.error || 'Erreur lors du chargement initial';
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
    } finally {
      this.loading = false;
    }
  },

  async lancerSync() {
    this.syncing = true;
    try {
      const result = await this.runWorkflow('sync-data', {});
      if (result.success) {
        window.location.reload();
      } else {
        this.error = result.error || 'Erreur de synchronisation';
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
    } finally {
      this.syncing = false;
    }
  },

  // ── Helpers ──
  startOfDay() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },

  endOfDay() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  },

  getJoursEcheance(dateEcheance) {
    if (!dateEcheance) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const echeance = new Date(dateEcheance);
    echeance.setHours(0, 0, 0, 0);
    const diffTime = echeance.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  },

  formatMontant(val) {
    if (val == null) return '—';
    return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  },

  formatMontantCourt(val) {
    if (val == null) return '—';
    const n = Number(val);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.', ',') + ' k€';
    return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  },

  labelsMois() {
    const mois = [];
    for (let i = 13; i >= 0; i--) {
      if (i === 13) {
        mois.push('Avant');
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        mois.push(d.toLocaleDateString('fr-FR', { month: 'short' }));
      }
    }
    return mois;
  },

  get barData() {
    return {
      labels: this.labelsMois(),
      datasets: [
        {
          label: 'Reste à payer',
          data: this.montantsMois.reste,
          backgroundColor: '#fb923c',
          borderRadius: 4,
          yAxisID: 'y',
          order: 2,
        },
        {
          label: 'Montant payé',
          data: this.montantsMois.paye,
          backgroundColor: '#22c55e',
          borderRadius: 4,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Nb factures impayées',
          data: this.montantsMois.count,
          borderColor: '#6366f1',
          backgroundColor: '#6366f1',
          pointBackgroundColor: '#6366f1',
          pointRadius: 4,
          borderWidth: 2,
          tension: 0.3,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    };
  },

  get barOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
          }
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              if (ctx.dataset.yAxisID === 'y1') {
                return ` ${ctx.parsed.y} facture${ctx.parsed.y > 1 ? 's' : ''} impayée${ctx.parsed.y > 1 ? 's' : ''}`;
              }
              const val = ctx.parsed.y;
              if (val >= 1000) return ` ${ctx.dataset.label} : ${(val / 1000).toFixed(1)} k€`;
              return ` ${ctx.dataset.label} : ${val.toLocaleString('fr-FR')} €`;
            }
          }
        }
      },
      scales: {
        y: {
          stacked: true,
          position: 'left',
          ticks: {
            callback: (val) => {
              if (val >= 1000) return (val / 1000).toFixed(0) + ' k€';
              return val + ' €';
            },
          },
          grid: { color: '#f3f4f6' },
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            callback: (val) => val + ' fa.',
          },
          grid: { drawOnChartArea: false },
        },
        x: {
          stacked: true,
          grid: { display: false }
        },
      },
    };
  },

  initChart() {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: this.barData,
      options: this.barOptions,
    });
  },

  async runWorkflow(name, params = {}) {
    const wf = window.workflows[name];
    if (!wf || !wf.execute) {
      throw new Error('Workflow "' + name + '" introuvable');
    }
    return await wf.execute(this, params);
  },
}));

Alpine.start();
