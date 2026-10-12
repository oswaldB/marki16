export async function execute(context, params) {
  try {
    const result = await Parse.Cloud.run('getRecalcitrants');
    const recalcitrants = (result.recalcitrants || []).map((r) => ({
      ...r,
      impayes: (r.impayes || []).map((imp) => ({
        ...imp,
        contact_derniere_relance: imp.contact_derniere_relance || r.derniereRelanceDate,
      })),
    }));
    return { success: true, data: { recalcitrants } };
  } catch (error) {
    console.error('Erreur load-all recalcitrants:', error);
    return { success: false, error: error.message };
  }
}
