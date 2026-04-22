import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusLabel: Record<string, string> = {
  pending: 'Pending',
  price_discussion: 'Price Discussion',
  ongoing: 'Ongoing',
  review: 'Under Review',
  revision: 'Revision Requested',
  completed: 'Completed',
};

export const badgeLabel: Record<string, string> = {
  none: 'No Badge',
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  platinum: '💎 Platinum',
  diamond: '👑 Diamond',
};

export const timeAgo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatDate = (date: string | Date, fmt = 'MMM d, yyyy') =>
  format(new Date(date), fmt);

export const formatDateTime = (date: string | Date) =>
  format(new Date(date), 'MMM d, yyyy · h:mm a');

export const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as any).response;
    return resp?.data?.message || resp?.data?.errors?.[0]?.msg || 'Something went wrong';
  }
  return 'Something went wrong';
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const dashboardPath = (role: string) => {
  if (role === 'superadmin') return '/dashboard/superadmin';
  if (role === 'admin') return '/dashboard/admin';
  return '/dashboard/user';
};
