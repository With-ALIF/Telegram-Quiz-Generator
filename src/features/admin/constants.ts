import { PageDefinition } from './types';
import { 
  Camera,
  Type,
  Zap
} from 'lucide-react';

export const AVAILABLE_PAGES: PageDefinition[] = [
  { id: 'ocr', name: 'OCR Quiz Scan', path: '/ocr', icon: Camera },
  { id: 'rapid-fire', name: 'Rapid Fire', path: '/rapid-fire', icon: Zap },
  { id: 'suffix-edit', name: 'Can Edit Suffix', path: '#', icon: Type }
];
