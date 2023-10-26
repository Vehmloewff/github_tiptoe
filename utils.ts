export function convertMapToRecord<V>(map: Map<string, V>): Record<string, V> {
	const record: Record<string, V> = {}

	for (const [key, value] of map) record[key] = value

	return record
}
