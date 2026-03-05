import { useState, useRef, useEffect, RefObject } from 'react';

export function useHover<T extends HTMLElement>(): { ref: RefObject<T>; hovered: boolean } {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (node) {
      const enter = () => setHovered(true);
      const leave = () => setHovered(false);
      node.addEventListener('mouseenter', enter);
      node.addEventListener('mouseleave', leave);
      return () => {
        node.removeEventListener('mouseenter', enter);
        node.removeEventListener('mouseleave', leave);
      };
    }
  }, []);

  return { ref, hovered };
}