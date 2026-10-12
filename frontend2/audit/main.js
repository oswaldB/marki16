import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';

window.workflows = {
  'init': { execute: initExecute },
};

Alpine.data('auditPage', () => ({
  loading: false,
  erreur: null,
  data: null,
  chartInstance: null,

  // ── Couleurs par phase ──
  COULEURS: {
    actifs: '#64748b',
    avec_email: '#0ea5e9',
    dans_sequence: '#0284c7',
    en_attente: '#f59e0b',
    recalcitrant: '#dc2626',
  },

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.erreur = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.data = result.data || null;
        this.$nextTick(() => this.initChart());
      } else {
        this.erreur = result.error || 'Erreur lors du chargement initial';
      }
    } catch (err) {
      console.error(err);
      this.erreur = err.message || 'Erreur inconnue';
    } finally {
      this.loading = false;
    }
  },

  async charger() {
    await this.loadInitialData();
  },

  // ── Couleur phase ──
  couleurPhase(key) {
    if (this.COULEURS[key]) return this.COULEURS[key];
    if (key === 'sans_sequence') return '#9ca3af';
    const k = Number(String(key).replace('relance_', '')) || 0;
    const palette = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'];
    return palette[Math.min(Math.max(k - 1, 0), palette.length - 1)];
  },

  // ── Entonnoir ──
  get entonnoir() {
    const stages = this.data?.funnel || [];
    if (!stages.length) return [];
    const base = stages[0].count || 1;

    return stages.map((stage, i) => {
      const width = (stage.count / base) * 100;
      const next = stages[i + 1];
      const nextWidth = next ? (next.count / base) * 100 : width * 0.45;

      const insetBas =
        width > 0 ? Math.max(0, (width - nextWidth) / 2 / width) * 100 : 0;
      const clipPath = `polygon(0% 0, 100% 0, ${100 - insetBas}% 100%, ${insetBas}% 100%)`;

      return {
        ...stage,
        couleur: this.couleurPhase(stage.key),
        barWidth: width,
        clipPath,
      };
    });
  },

  // ── Graphe Chart.js ──
  get barData() {
    return {
      labels: (this.data?.phases || []).map((p) => p.label),
      datasets: [
        {
          label: "Impayés à cette étape",
          data: (this.data?.phases || []).map((p) => p.count),
          backgroundColor: (this.data?.phases || []).map((p) => this.couleurPhase(p.key)),
          borderRadius: 5,
          maxBarThickness: 26,
        },
      ],
    };
  },

  get barOptions() {
    const self = this;
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const p = self.data?.phases?.[ctx.dataIndex];
              if (!p) return ` ${ctx.parsed.x} impayé(s)`;
              return [
                ` ${p.count} impayé(s) à cette étape`,
                ` ${p.cumulatif} ont atteint cette étape`,
                ` ${self.formatMontant(p.montant)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
          grid: { color: '#f3f4f6' },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
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

  // ── Helpers ──
  phaseByKey(key) {
    return this.data?.phases?.find((p) => p.key === key) || null;
  },

  pctActifs(val) {
    const total = this.data?.totaux?.actifs || 0;
    return total > 0 ? (val / total) * 100 : 0;
  },

  formatMontant(val) {
    if (val == null) return '—';
    return Number(val).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });
  },

  formatPct(val) {
    if (val == null || isNaN(val)) return '—';
    return `${Number(val).toFixed(1)} %`;
  },

  formatDateHeure(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return '—';
    return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
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
