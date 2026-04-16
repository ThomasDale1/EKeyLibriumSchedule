import type { SubjectColor } from './types'

type ColorStyle = {
  bg: string
  border: string
  text: string
  solid: string
  chip: string
}

export const COLOR_STYLES: Record<SubjectColor, ColorStyle> = {
  warning: {
    bg: 'bg-status-warning/15',
    border: 'border-status-warning/40',
    text: 'text-status-warning',
    solid: 'bg-status-warning',
    chip: 'bg-status-warning/20 text-status-warning',
  },
  info: {
    bg: 'bg-status-info/15',
    border: 'border-status-info/40',
    text: 'text-status-info',
    solid: 'bg-status-info',
    chip: 'bg-status-info/20 text-status-info',
  },
  success: {
    bg: 'bg-status-success/15',
    border: 'border-status-success/40',
    text: 'text-status-success',
    solid: 'bg-status-success',
    chip: 'bg-status-success/20 text-status-success',
  },
  critical: {
    bg: 'bg-status-critical/15',
    border: 'border-status-critical/40',
    text: 'text-status-critical',
    solid: 'bg-status-critical',
    chip: 'bg-status-critical/20 text-status-critical',
  },
  accent: {
    bg: 'bg-[#3b82f6]/15',
    border: 'border-[#3b82f6]/40',
    text: 'text-[#60a5fa]',
    solid: 'bg-[#3b82f6]',
    chip: 'bg-[#3b82f6]/20 text-[#60a5fa]',
  },
  violet: {
    bg: 'bg-[#8b5cf6]/15',
    border: 'border-[#8b5cf6]/40',
    text: 'text-[#a78bfa]',
    solid: 'bg-[#8b5cf6]',
    chip: 'bg-[#8b5cf6]/20 text-[#a78bfa]',
  },
  pink: {
    bg: 'bg-[#ec4899]/15',
    border: 'border-[#ec4899]/40',
    text: 'text-[#f472b6]',
    solid: 'bg-[#ec4899]',
    chip: 'bg-[#ec4899]/20 text-[#f472b6]',
  },
  teal: {
    bg: 'bg-[#14b8a6]/15',
    border: 'border-[#14b8a6]/40',
    text: 'text-[#2dd4bf]',
    solid: 'bg-[#14b8a6]',
    chip: 'bg-[#14b8a6]/20 text-[#2dd4bf]',
  },
}
