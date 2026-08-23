import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { T } from './Text';
import { Button, Row } from './ui';
import { hapticsLight, hapticsSuccess } from '../lib/haptics';
import type { PickedImageResult } from '../lib/storage';
import { colors, radius, spacing } from '../theme';

const CROP_BOX_SIZE = 280;
const MASK_SIZE = 250;

interface AvatarCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onCrop: (result: PickedImageResult) => void;
  onClose: () => void;
}

export function AvatarCropModal({ visible, imageUri, onCrop, onClose }: AvatarCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });

  // Load natural dimensions when image changes
  useEffect(() => {
    if (!imageUri) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setProcessing(false);

    RNImage.getSize(
      imageUri,
      (width, height) => {
        setImgNaturalSize({ width, height });
      },
      () => {
        setImgNaturalSize({ width: 800, height: 800 });
      }
    );
  }, [imageUri]);

  // Compute base rendered dimensions inside the CROP_BOX_SIZE container
  const baseScale = imgNaturalSize
    ? Math.max(CROP_BOX_SIZE / imgNaturalSize.width, CROP_BOX_SIZE / imgNaturalSize.height)
    : 1;
  const baseW = (imgNaturalSize?.width ?? CROP_BOX_SIZE) * baseScale;
  const baseH = (imgNaturalSize?.height ?? CROP_BOX_SIZE) * baseScale;

  // Web mouse & touch dragging
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDragging.current = true;
    dragStart.current = { x: clientX, y: clientY };
    startOffset.current = { ...offset };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setOffset({
      x: startOffset.current.x + dx,
      y: startOffset.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleZoomChange = (delta: number) => {
    hapticsLight();
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))));
  };

  const handleReset = () => {
    hapticsLight();
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!imageUri) return;
    setProcessing(true);
    hapticsSuccess();

    if (Platform.OS === 'web') {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUri;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = 400;
        outputCanvas.height = 400;
        const ctx = outputCanvas.getContext('2d');

        if (!ctx) throw new Error('Could not create canvas context');
        ctx.imageSmoothingQuality = 'high';

        // Scale ratio from crop box viewport to 400x400 output canvas
        const outputScale = 400 / MASK_SIZE;
        const center = CROP_BOX_SIZE / 2;

        // Effective rendered size of image in crop container
        const currentW = baseW * zoom;
        const currentH = baseH * zoom;

        // Position of image top-left relative to mask center
        const imgLeft = center - currentW / 2 + offset.x;
        const imgTop = center - currentH / 2 + offset.y;

        // Offset relative to mask top-left (center - MASK_SIZE/2)
        const maskLeft = center - MASK_SIZE / 2;
        const maskTop = center - MASK_SIZE / 2;

        const renderX = (imgLeft - maskLeft) * outputScale;
        const renderY = (imgTop - maskTop) * outputScale;
        const renderW = currentW * outputScale;
        const renderH = currentH * outputScale;

        // Dark background fallback
        ctx.fillStyle = '#1A1D24';
        ctx.fillRect(0, 0, 400, 400);

        ctx.drawImage(img, renderX, renderY, renderW, renderH);

        const dataUrl = outputCanvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

        onCrop({ localUri: dataUrl, base64 });
        onClose();
      } catch (err) {
        console.warn('Web crop failed:', err);
        onCrop({ localUri: imageUri });
        onClose();
      } finally {
        setProcessing(false);
      }
    } else {
      // Native fallback
      onCrop({ localUri: imageUri });
      onClose();
      setProcessing(false);
    }
  };

  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Row align="space-between" style={{ marginBottom: spacing.md }}>
            <View>
              <T variant="h3">Adjust Profile Photo</T>
              <T variant="small" dim style={{ marginTop: 2 }}>
                Drag and zoom to position within the circle
              </T>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textDim} />
            </Pressable>
          </Row>

          {/* Viewport Cropper Box */}
          <View
            style={styles.cropViewport}
            {...(Platform.OS === 'web'
              ? {
                  onMouseDown: (e: any) => handlePointerDown(e.clientX, e.clientY),
                  onMouseMove: (e: any) => handlePointerMove(e.clientX, e.clientY),
                  onMouseUp: handlePointerUp,
                  onMouseLeave: handlePointerUp,
                  onTouchStart: (e: any) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY),
                  onTouchMove: (e: any) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY),
                  onTouchEnd: handlePointerUp,
                }
              : {})}>
            {/* The Pan/Zoom Image */}
            <View
              style={[
                styles.imageContainer,
                {
                  width: baseW,
                  height: baseH,
                  transform: [
                    { translateX: offset.x },
                    { translateY: offset.y },
                    { scale: zoom },
                  ],
                },
              ]}>
              <RNImage
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            {/* Circular Mask Overlay */}
            <View style={styles.maskContainer} pointerEvents="none">
              <View style={styles.maskRing} />
            </View>
          </View>

          {/* Zoom and Position Controls */}
          <Row align="space-between" style={{ marginTop: spacing.md }}>
            <Row gap={8} align="center">
              <Pressable
                onPress={() => handleZoomChange(-0.2)}
                disabled={zoom <= 1}
                style={[styles.ctrlBtn, zoom <= 1 && styles.ctrlDisabled]}>
                <Ionicons name="remove" size={18} color={zoom <= 1 ? colors.textMuted : colors.text} />
              </Pressable>
              <View style={styles.zoomPill}>
                <T variant="smallSemi" style={{ fontSize: 13, color: colors.accent }}>
                  {Math.round(zoom * 100)}%
                </T>
              </View>
              <Pressable
                onPress={() => handleZoomChange(0.2)}
                disabled={zoom >= 3}
                style={[styles.ctrlBtn, zoom >= 3 && styles.ctrlDisabled]}>
                <Ionicons name="add" size={18} color={zoom >= 3 ? colors.textMuted : colors.text} />
              </Pressable>
            </Row>

            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Ionicons name="refresh-outline" size={16} color={colors.textDim} />
              <T variant="small" dim style={{ fontSize: 12 }}>
                Reset
              </T>
            </Pressable>
          </Row>

          {/* Action Buttons */}
          <Row gap={spacing.sm} style={{ marginTop: spacing.lg }}>
            <Button label="Cancel" variant="dark" onPress={onClose} style={{ flex: 1 }} />
            <Button
              label={processing ? 'Saving...' : 'Set Profile Photo'}
              variant="primary"
              onPress={handleSave}
              disabled={processing}
              style={{ flex: 2 }}
              iconRight={processing ? undefined : 'checkmark'}
            />
          </Row>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'stretch',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropViewport: {
    width: CROP_BOX_SIZE,
    height: CROP_BOX_SIZE,
    alignSelf: 'center',
    backgroundColor: '#000',
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: Platform.OS === 'web' ? 'grab' : undefined,
    userSelect: 'none',
  } as any,
  imageContainer: {
    position: 'absolute',
  },
  maskContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskRing: {
    width: MASK_SIZE,
    height: MASK_SIZE,
    borderRadius: MASK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.65)`,
  } as any,
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctrlDisabled: {
    opacity: 0.35,
  },
  zoomPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface2,
  },
});
