export async function execute(context, params) {
  try {
    const Sequence = Parse.Object.extend('Sequence');
    const query = new Parse.Query(Sequence);
    query.ascending('nom');
    query.limit(200);

    const sequences = await query.find();

    // Compter les impayés assignés à chaque séquence
    const counts = await Promise.all(
      sequences.map(seq => {
        const ptr = Parse.Object.fromJSON({ __type: 'Pointer', className: 'Sequence', objectId: seq.id });
        return new Parse.Query('Impaye').equalTo('sequence', ptr).count();
      })
    );

    const data = sequences.map((seq, i) => ({
      id: seq.id,
      type: seq.get('type') || 'relances',
      nom: seq.get('nom'),
      publiee: seq.get('publiee') || false,
      emails_count: (seq.get('emails') || []).length,
      impayes_count: counts[i] ?? 0,
      _seq: seq,
    }));

    return { success: true, data };
  } catch (error) {
    console.error('Erreur init sequences:', error);
    return { success: false, error: error.message || 'Erreur lors du chargement' };
  }
}
