import { useState, useCallback, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto, getPhotoUrl } from '@/services/storage/storage';
import { Photo } from '@/types';
import { MAX_PHOTOS_PER_REPORT } from '@/constants';

export function usePhotoPicker() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch {
      setError('Erro ao selecionar imagem');
      return null;
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch {
      setError('Erro ao tirar foto');
      return null;
    }
  }, []);

  const uploadPhotos = useCallback(
    async (
      uris: string[],
      reportId: string,
      updateId: string | null = null
    ): Promise<Photo[]> => {
      try {
        setLoading(true);
        setError(null);
        const uploaded: Photo[] = [];
        for (const uri of uris) {
          const photo = await uploadPhoto(uri, reportId, updateId);
          uploaded.push(photo);
        }
        return uploaded;
      } catch (err) {
        setError('Erro ao enviar fotos');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addLocalPhoto = useCallback((uri: string) => {
    setPhotos(prev => {
      if (prev.length >= MAX_PHOTOS_PER_REPORT) return prev;
      return [...prev, { id: `local-${Date.now()}`, report_id: '', update_id: null, storage_path: uri, moderation_status: 'PENDING', created_at: new Date().toISOString() } as Photo];
    });
  }, []);

  const removeLocalPhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  return {
    photos,
    loading,
    error,
    pickImage,
    takePhoto,
    uploadPhotos,
    addLocalPhoto,
    removeLocalPhoto,
    clearPhotos,
  };
}

export function usePhotoUrls(photoPaths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (photoPaths.length === 0) return;
    
    const fetchUrls = async () => {
      setLoading(true);
      const urlMap: Record<string, string> = {};
      for (const path of photoPaths) {
        urlMap[path] = await getPhotoUrl(path);
      }
      setUrls(urlMap);
      setLoading(false);
    };
    
    fetchUrls();
  }, [photoPaths]);

  return { urls, loading };
}