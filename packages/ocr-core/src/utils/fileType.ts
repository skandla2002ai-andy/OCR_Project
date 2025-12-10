export type FileType = 'image' | 'pdf' | 'word' | 'excel' | 'ppt' | 'unknown';

const EXTENSION_TYPE_MAP: Record<string, FileType> = {
  // Images
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.bmp': 'image',
  '.tiff': 'image',
  '.tif': 'image',

  // PDF
  '.pdf': 'pdf',

  // Word
  '.doc': 'word',
  '.docx': 'word',

  // Excel
  '.xls': 'excel',
  '.xlsx': 'excel',

  // PowerPoint
  '.ppt': 'ppt',
  '.pptx': 'ppt',
};

const MIME_TYPE_MAP: Record<string, FileType> = {
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',

  // PDF
  'application/pdf': 'pdf',

  // Word
  'application/msword': 'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',

  // Excel
  'application/vnd.ms-excel': 'excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',

  // PowerPoint
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
};

/**
 * Detect file type from File object using both MIME type and extension
 * Priority: MIME type > extension
 */
export function detectFileType(file: File): FileType {
  // 1. Try MIME type first (more reliable)
  if (file.type && MIME_TYPE_MAP[file.type]) {
    return MIME_TYPE_MAP[file.type];
  }

  // 2. Fallback to extension
  const fileName = file.name.toLowerCase();
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return 'unknown';
  }

  const extension = fileName.substring(dotIndex);
  const typeFromExtension = EXTENSION_TYPE_MAP[extension];

  if (typeFromExtension) {
    return typeFromExtension;
  }

  // 3. Check if MIME type suggests a general category
  if (file.type.startsWith('image/')) {
    return 'image';
  }

  return 'unknown';
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.substring(dotIndex).toLowerCase();
}
