import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.8;

/**
 * Comprime la imagen en el cliente antes de subir (MVP: compresión en el cliente).
 * Redimensiona a ancho máximo 1024px manteniendo ratio y guarda como JPEG con calidad 0.8.
 */
export async function compressImageForSymptom(localUri: string): Promise<{ uri: string }> {
  const result = await manipulateAsync(
    localUri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: COMPRESS_QUALITY, format: SaveFormat.JPEG }
  );
  return { uri: result.uri };
}
