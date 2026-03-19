// ============================================
// HANDWRITING INPUT TYPE DEFINITIONS
// ============================================

/**
 * Drawing tool types
 */
export type DrawingTool = "pen" | "eraser";

/**
 * Color options for pen
 */
export interface ColorOption {
  name: string;
  hex: string;
  label: string;
}

export const COLORS: ColorOption[] = [
  { name: "black", hex: "#1e293b", label: "Black" },
  { name: "blue", hex: "#2563eb", label: "Blue" },
  { name: "red", hex: "#dc2626", label: "Red" },
  { name: "green", hex: "#16a34a", label: "Green" },
  { name: "purple", hex: "#9333ea", label: "Purple" },
  { name: "orange", hex: "#ea580c", label: "Orange" },
  { name: "gray", hex: "#6b7280", label: "Gray" },
];

/**
 * Canvas drawing state
 */
export interface DrawingState {
  isDrawing: boolean;
  tool: DrawingTool;
  color: string;
  lineWidth: number;
  lastPoint: { x: number; y: number } | null;
}

/**
 * Handwriting canvas props
 */
export interface HandwritingCanvasProps {
  entryId: string;
  existingImageUrls?: string[];
  onSave: (dataUrl: string, sortOrder: number) => Promise<void>;
  onClear?: () => void;
  className?: string;
  readOnly?: boolean;
}

/**
 * Image data for display
 */
export interface HandwritingImage {
  id: string;
  entryId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string;
}

/**
 * Canvas configuration
 */
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: "png" | "jpeg";
  quality?: number;
  includeBackground?: boolean;
}

/**
 * Touch event handler types
 */
export type DrawingEvent = React.MouseEvent | React.TouchEvent;

/**
 * API response types
 */
export interface UploadImageResponse {
  success: boolean;
  imageUrl: string;
  entryImageId?: string;
  error?: string;
}

export interface DeleteImageResponse {
  success: boolean;
  error?: string;
}
