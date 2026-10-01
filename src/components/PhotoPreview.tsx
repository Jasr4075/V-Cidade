import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Photo } from '@/types';

interface PhotoPreviewProps {
  photos: Array<{ uri: string; local?: boolean }>;
  onRemove?: (index: number) => void;
  maxHeight?: number;
}

export const PhotoPreview = ({ photos, onRemove, maxHeight = 120 }: PhotoPreviewProps) => {
  if (photos.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {photos.map((photo, index) => (
        <View key={index} style={styles.photoWrapper}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photo}
            resizeMode="cover"
          />
          {onRemove && (
            <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(index)}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

PhotoPreview.displayName = 'PhotoPreview';

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  photo: {
    width: maxHeight * 1.33,
    height: maxHeight,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});