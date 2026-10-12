export async function execute(context, params) {
  const { objectId } = params;
  window.location.href = `../impayes-detail/index.html?id=${encodeURIComponent(objectId)}`;
  return { success: true };
}
