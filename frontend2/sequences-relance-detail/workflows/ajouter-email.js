const SCENARIO_FORMATS = ["single", "multiple", "both", "broker"];

export async function execute(ctx, params) {
  try {
    const count = params?.count ?? 0;
    const email = {
      _key: `email_new_${Date.now()}`,
      email_index: count + 1,
      delai: 0,
      smtp: '',
      to: '[[payeur_email]]',
      cc: '',
      activeScenario: 'single',
      scenarios: SCENARIO_FORMATS.map(format => ({
        format,
        active: true,
        smtp: '',
        cc: '',
        objet: '',
        corps: '',
      })),
    };
    return { success: true, data: email };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
