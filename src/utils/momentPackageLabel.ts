/**
 * Moment package (theme) titles: exactly two whitespace-separated words render as two lines
 * (e.g. “Brand Protection”, “Pre-Game Build-Up”). Explicit `\n` is kept for custom multi-line copy.
 */
export function momentPackageDisplayLines(name: string): string[] {
  const normalized = name.replace(/\n/g, ' ').trim()
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 2) {
    return words
  }
  if (name.includes('\n')) {
    return name
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  }
  return [normalized]
}
