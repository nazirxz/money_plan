import {
  Banknote,
  Briefcase,
  Bus,
  Car,
  CircleDollarSign,
  CreditCard,
  Film,
  Gift,
  GraduationCap,
  Heart,
  Home,
  PawPrint,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
  tag: Tag,
  wallet: Wallet,
  banknote: Banknote,
  briefcase: Briefcase,
  'circle-dollar-sign': CircleDollarSign,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  gift: Gift,
  utensils: Utensils,
  car: Car,
  bus: Bus,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  receipt: Receipt,
  film: Film,
  heart: Heart,
  home: Home,
  plane: Plane,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
  zap: Zap,
  wifi: Wifi,
  'paw-print': PawPrint,
};

export const ICON_NAMES = Object.keys(ICONS);

export function getIcon(name: string | null | undefined): LucideIcon {
  if (name && ICONS[name]) return ICONS[name];
  return Tag;
}

export const COLOR_PALETTE = [
  '#10b981', // emerald
  '#22c55e', // green
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#64748b', // slate
];
