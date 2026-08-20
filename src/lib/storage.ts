import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Convert base64 string to Uint8Array for binary upload across web and React Native.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface PickedImageResult {
  localUri: string;
  base64?: string;
}

/**
 * Prompt user to select an image from their gallery, crop to 1:1 square,
 * and resize to 400x400 with high-quality compression.
 */
export async function pickAndCropAvatar(): Promise<PickedImageResult | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) {
      return null;
    }

    const rawUri = pickerResult.assets[0].uri;

    // Resize to 400x400 with 0.85 near-lossless JPEG compression
    const manipulated = await manipulateAsync(
      rawUri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.85, format: SaveFormat.JPEG, base64: true },
    );

    return {
      localUri: manipulated.uri,
      base64: manipulated.base64,
    };
  } catch (err) {
    console.warn('Failed to pick and crop avatar image:', err);
    return null;
  }
}

/**
 * Upload cropped avatar to Supabase Storage `avatars` bucket and return public URL.
 * Falls back to localUri if Supabase is offline or not configured.
 */
export async function uploadAvatarImage(userId: string, image: PickedImageResult): Promise<string> {
  if (!isSupabaseConfigured || !userId || !image.base64) {
    return image.localUri;
  }

  try {
    const fileBytes = base64ToUint8Array(image.base64);
    const fileName = `${userId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, fileBytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      // Fallback to local image URI so the app keeps working offline
      return image.localUri;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    if (data?.publicUrl) {
      // Append cache-busting timestamp parameter to force refresh
      return `${data.publicUrl}?t=${Date.now()}`;
    }

    return image.localUri;
  } catch (err) {
    console.warn('Exception during avatar upload to Supabase:', err);
    return image.localUri;
  }
}
