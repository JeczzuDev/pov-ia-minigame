import { twMerge } from 'tailwind-merge';

export const container = 'relative mb-4';

export const input = 'w-full border rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400';

export const inputError = 'border-red-500 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-700';

export const inputDisabled = 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-70';

export const validationIcon = 'absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none';

export const errorText = 'text-red-500 dark:text-red-400 text-sm mt-1';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(' '));
}
