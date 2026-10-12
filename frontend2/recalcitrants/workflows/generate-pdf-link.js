export async function execute(context, params) {
  try {
    const response = await Parse.Cloud.run('generatePdfLink', { impayelId: params.impayelId });
    return { success: true, data: { url: response.url } };
  } catch (error) {
    console.error('Erreur generate-pdf-link:', error);
    return { success: false, error: error.message };
  }
}
