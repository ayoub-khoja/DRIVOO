import { PDFDocument } from 'pdf-lib'

/**
 * Concatenate several PDF buffers into a single document (order preserved).
 */
export const mergePdfBuffers = async (buffers: Buffer[]): Promise<Buffer> => {
  const merged = await PDFDocument.create()

  for (const buffer of buffers) {
    if (!buffer?.length) {
      continue
    }
    const source = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const pages = await merged.copyPages(source, source.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
  }

  const bytes = await merged.save()
  return Buffer.from(bytes)
}
