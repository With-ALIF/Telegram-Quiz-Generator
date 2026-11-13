import { PageDefinition } from './types';
import { 
  BarChart2, 
  FileEdit, 
  Camera, 
  Type,
  Zap
} from 'lucide-react';

export const AVAILABLE_PAGES: PageDefinition[] = [
  { id: 'polls', name: 'Polls', path: '/polls', icon: BarChart2 },
  { id: 'drafts', name: 'Drafts', path: '/drafts', icon: FileEdit },
  { id: 'ocr', name: 'OCR Quiz Scan', path: '/ocr', icon: Camera },
  { id: 'rapid-fire', name: 'Rapid Fire', path: '/rapid-fire', icon: Zap },
  { id: 'suffix-edit', name: 'Can Edit Suffix', path: '#', icon: Type }
];
