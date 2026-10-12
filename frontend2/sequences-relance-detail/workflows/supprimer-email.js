export async function execute(ctx, params) {
  try {
    const { emails, key } = params;
    const idx = emails.findIndex(e => e._key === key);
    if (idx !== -1) emails.splice(idx, 1);
    return { success: true, data: { emails } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
