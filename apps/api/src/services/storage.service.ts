import { getContentType } from '../lib/mime'
import { BUCKET, supabase } from './supabase';

export interface FileUploader {
  filename: string;
  content: Buffer
}


async function fileUploaderFn(slug: string, file: FileUploader): Promise<{ filename: string, error: Error | null }> {
  const { filename, content } = file;
  const path = `components/${slug}/${filename}`
  const contentType = getContentType(filename)
  const blob = new Blob([content.buffer as ArrayBuffer], { type: contentType })

  const { error } = await supabase.storage.from(BUCKET)
    .upload(path, blob, { contentType, upsert: true })


  return { error, filename }
}

export async function uploadFiles(
  slug: string,
  files: FileUploader[]
): Promise<{ ok: string[]; failed: string[] }> {
  const results = await Promise.all(
    files.map(async ({ filename, content }) =>
    (await fileUploaderFn(slug, { filename, content }))
    )
  )
  return {
    ok: results.filter(r => !r.error).map(r => r.filename),
    failed: results.filter(r => r.error).map(r => r.filename),
  }
}

export async function deleteComponentFiles(slug: string): Promise<void> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .list(`components/${slug}`)

  if (!data?.length) return

  const paths = data.map(f => `components/${slug}/${f.name}`)
  await supabase.storage.from(BUCKET).remove(paths)
}

export async function listComponentFiles(slug: string): Promise<{ name: string; url: string }[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(`components/${slug}`)

  if (error || !data) return []

  return data.map(f => {
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(`components/${slug}/${f.name}`)

    return { name: f.name, url: urlData.publicUrl }
  })
}



