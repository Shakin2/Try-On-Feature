export interface ImageData {
  base64: string; // Pure base64 without mime prefix
  mimeType: string;
  previewUrl: string;
}

export enum AppStep {
  USER_PHOTO = 'USER_PHOTO',
  CLOTHING_INPUT = 'CLOTHING_INPUT',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT'
}

export enum ClothingInputType {
  UPLOAD = 'UPLOAD',
  URL = 'URL',
  DESCRIPTION = 'DESCRIPTION'
}

export const PRESET_MODELS = [
  { id: 'model1', url: 'https://picsum.photos/id/64/500/750', label: 'Model A' },
  { id: 'model2', url: 'https://picsum.photos/id/91/500/750', label: 'Model B' },
  { id: 'model3', url: 'https://picsum.photos/id/177/500/750', label: 'Model C' },
];
