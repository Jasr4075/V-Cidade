import { supabase } from '@/services/supabase';
import { Photo } from '@/types';
import { MAX_PHOTO_SIZE, ALLOWED_IMAGE_TYPES } from '@/constants';

const BUCKET_NAME = 'report-photos';

export async function uploadPhoto(
  uri: string,
  reportId: string,
  updateId: string | null = null
): Promise<Photo> {
  const response = await fetch(uri);
  const blob = await response.blob();

  if (blob.size > MAX_PHOTO_SIZE) {
    throw new Error('Arquivo muito grande. Máximo 5MB.');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(blob.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
  }

  const fileExt = blob.type.split('/')[1] || 'jpg';
  const fileName = `${reportId}/${updateId || 'report'}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('photos')
    .insert({
      report_id: reportId,
      update_id: updateId,
      storage_path: fileName,
      moderation_status: 'PENDING',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Photo;
}

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function getPhotosByReportId(reportId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('report_id', reportId)
    .eq('moderation_status', 'APPROVED')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as Photo[];
}

export async function getPhotosByUpdateId(updateId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('update_id', updateId)
    .eq('moderation_status', 'APPROVED')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as Photo[];
}

export async function deletePhoto(photoId: string): Promise<void> {
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('id', photoId)
    .single();

  if (fetchError) throw fetchError;

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([(photo as { storage_path: string }).storage_path]);

  if (storageError) throw storageError;

  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId);

  if (dbError) throw dbError;
}