export async function execute(ctx, params) {
  const id = params?.sequenceId || new URLSearchParams(window.location.search).get('id');
  if (!id) return { success: false, error: 'ID manquant' };
  try {
    const seq = await new Parse.Query('Sequence').get(id);
    return { success: true, data: { sequence: seq } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
