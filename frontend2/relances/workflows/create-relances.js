export async function execute(context, params) {
  try {
    const response = await Parse.Cloud.run('triggerImportInvoices');
    const createRelances = response?.result?.createRelances || response?.createRelances || {};
    const relancesCrees = createRelances.created || createRelances.relancesCrees || 0;
    const relancesMisesAJour = createRelances.updated || 0;
    return {
      success: true,
      data: {
        relancesCrees,
        relancesMisesAJour,
        raw: response,
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
