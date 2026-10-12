export async function execute(context, params) {
  try {
    const syncStats = await Parse.Cloud.run('triggerImportInvoices');
    const verifyStats = await Parse.Cloud.run('verifyPaidInvoicesNow');
    return { success: true, data: { syncStats, verifyStats } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
