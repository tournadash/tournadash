import { createClient } from './client'

/**
 * Extracts bucket and path from a Supabase public URL.
 */
export function getStoragePathFromUrl(url) {
  if (!url) return null
  const prefix = '/storage/v1/object/public/'
  const index = url.indexOf(prefix)
  if (index === -1) return null
  
  const relativePath = url.substring(index + prefix.length)
  const parts = relativePath.split('/')
  const bucket = parts[0]
  const path = parts.slice(1).join('/')
  return { bucket, path }
}

/**
 * Uploads a file to a specific Supabase bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(bucket, path, file) {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    })
  
  if (error) {
    throw error
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
    
  return publicUrl
}

/**
 * Deletes a file from a Supabase bucket by its storage path.
 */
export async function deleteImage(bucket, path) {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    console.error(`Error deleting image from ${bucket}/${path}:`, error)
  }
}

/**
 * Deletes a file from storage by its public URL.
 */
export async function deleteImageByUrl(url) {
  const info = getStoragePathFromUrl(url)
  if (!info) return
  await deleteImage(info.bucket, info.path)
}

/**
 * Uploads a tournament thumbnail and returns the public URL.
 */
export async function uploadThumbnail(tournamentId, file) {
  const extension = file.name.split('.').pop()
  const filename = `${tournamentId}_${Date.now()}.${extension}`
  return await uploadImage('thumbnails', filename, file)
}

/**
 * Uploads a user or organization avatar and returns the public URL.
 */
export async function uploadAvatar(entityType, entityId, file) {
  const extension = file.name.split('.').pop()
  const filename = `${entityType}/${entityId}_${Date.now()}.${extension}`
  return await uploadImage('avatars', filename, file)
}

export async function uploadOrgBanner(orgId, file) {
  const extension = file.name.split('.').pop()
  const filename = `banners/${orgId}_${Date.now()}.${extension}`
  return await uploadImage('avatars', filename, file)
}

export async function uploadSkin(userId, file) {
  const extension = file.name.split('.').pop()
  const filename = `skins/${userId}_${Date.now()}.${extension}`
  return await uploadImage('avatars', filename, file)
}
