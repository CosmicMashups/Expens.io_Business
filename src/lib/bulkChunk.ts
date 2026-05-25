export const DEFAULT_BULK_CHUNK = 500

export async function insertInChunks<T>(
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
  chunkSize = DEFAULT_BULK_CHUNK,
): Promise<number> {
  let total = 0
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    await insert(chunk)
    total += chunk.length
  }
  return total
}

export function formatImportSummary(imported: number, skipped: number, skippedTags?: string[]): string {
  let msg = `Imported ${imported} row${imported === 1 ? '' : 's'}`
  if (skipped > 0) {
    msg += `, skipped ${skipped}`
    if (skippedTags?.length) {
      const sample = skippedTags.slice(0, 3).join(', ')
      const more = skippedTags.length > 3 ? ` (+${skippedTags.length - 3} more)` : ''
      msg += ` (${sample}${more})`
    }
  }
  return msg
}
