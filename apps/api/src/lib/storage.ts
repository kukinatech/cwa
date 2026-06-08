import { supabase } from "../services/supabase";



const BUCKET = 'components'

/** Faz upload de um ficheiro para o Storage */
export async function uploadFile(
  path: string,        // ex: "modal-component/modal.component.ts"
  content: ArrayBuffer | Uint8Array,
  contentType = 'text/plain'
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, content, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload falhou: ${error.message}`)
}

/** Devolve URL pública de um ficheiro */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Lista todos os ficheiros de um directório */
export async function listFiles(folder: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder)
  if (error) throw new Error(`Storage list falhou: ${error.message}`)
  return (data ?? []).map(f => `${folder}/${f.name}`)
}

/** Descarrega o conteúdo de um ficheiro como texto */
export async function downloadFile(path: string): Promise<string> {
  console.log(`Downloading file: ${path} `)
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error) throw new Error(`Storage download falhou: ${error.message}`)
  return data.text()
}

/** Remove todos os ficheiros de um directório */
export async function deleteFolder(folder: string): Promise<void> {
  const paths = await listFiles(folder)
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw new Error(`Storage delete falhou: ${error.message}`)
}