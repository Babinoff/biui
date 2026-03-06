import { useState, useEffect } from 'react';

export function useSidebarToggle(key: string, initialValue: boolean = true) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(isOpen));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return [isOpen, toggle] as const;
}
