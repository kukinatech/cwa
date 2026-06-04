import AdmZip from 'adm-zip'
import { uploadFiles } from './storage.service'
import { BUCKET, supabase } from './supabase';

const REQUIRED_FILES = ['cwa.config.ts']
const ALLOWED_EXTENSIONS = ['.ts', '.html', '.css', '.json']

export type ZipValidationResult =
  | { ok: true; files: { filename: string; content: Buffer }[] }
  | { ok: false; error: string }

export function extractAndValidateZip(buffer: Buffer): ZipValidationResult {
  let zip: AdmZip

  try {
    zip = new AdmZip(buffer)
  } catch {
    return { ok: false, error: 'Invalid or corrupted zip file' }
  }

  const entries = zip.getEntries().filter(e => !e.isDirectory)
  
  // valida extensões permitidas
  const invalidFiles = entries.filter(e => {
    const name = e.entryName.toLowerCase()
    return !ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext))
  })
  if (invalidFiles.length) {
    return {
      ok: false,
      error: `O Ficheiro : ${invalidFiles.map(e => e.entryName).join(', ')} não é válido`,
    }
  }
  // normaliza paths — remove pasta raiz do zip se existir
  const files = entries.map(e => {
    const parts = e.entryName.split('/')
    const filename = parts.length > 1 ? parts.slice(1).join('/') : parts[0]
    return { filename: filename!, content: e.getData() }
  })
  

  // valida ficheiros obrigatórios
  const filenames = files.map(f => f.filename)
  const missing = REQUIRED_FILES.filter(r => !filenames.includes(r))
  
  if (missing.length > 0)
    return { ok: false, error: `Missing required files: ${missing.join(', ')}` }



  return { ok: true, files }
}



//processComponentUpload
export async function processComponentUpload(
  slug: string,
  zipBuffer: Buffer
): Promise<
  | { ok: true; uploadedFiles: string[] }
  | { ok: false; error: string; details?: string[] }
> {
  // 1. valida e extrai zip
  const validation = extractAndValidateZip(zipBuffer)
  if (!validation.ok) return { ok: false, error: validation.error }

  // 2. faz upload para o Storage
  const { ok, failed } = await uploadFiles(slug, validation.files)

  if (failed.length)
    return { ok: false, error: 'Some files failed to upload', details: failed }

  return { ok: true, uploadedFiles: ok }
}


