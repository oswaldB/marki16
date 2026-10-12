export async function execute(context, params) {
  try {
    const { impayelId } = params;
    const response = await Parse.Cloud.run('generatePdfLink', { impayelId });
    return { success: true, data: { url: response.url } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
