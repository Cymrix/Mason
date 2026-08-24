export interface SpritesheetSliceResult {
  imageUrl: string;
  dataUrl?: string;
  imageWidth: number;
  imageHeight: number;
  tileWidth: number;
  tileHeight: number;
  cols: number;
  rows: number;
  totalFrames: number;
  splitMode: 'pixels' | 'columns';
  marginX?: number;
  marginY?: number;
  spacingX?: number;
  spacingY?: number;
  name?: string;
}

export interface SpritesheetSliceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: SpritesheetSliceResult) => void;
  initialImage?: {
    url: string;
    name?: string;
    tileWidth?: number;
    tileHeight?: number;
    cols?: number;
    rows?: number;
    splitMode?: 'pixels' | 'columns';
    marginX?: number;
    marginY?: number;
    spacingX?: number;
    spacingY?: number;
  };
  title?: string;
  sheetLabel?: string;
}
