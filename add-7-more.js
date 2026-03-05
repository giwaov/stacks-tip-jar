const fs = require('fs');
const { execSync } = require('child_process');

const commits = [
  { file: 'components/ui/Textarea.tsx', content: `'use client';
export const Textarea = ({ label, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium">{label}</label>}
    <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" {...props} />
  </div>
);`, msg: 'feat(ui): add Textarea component' },
  { file: 'components/ui/Checkbox.tsx', content: `'use client';
export const Checkbox = ({ label, ...props }: any) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" {...props} />
    <span className="text-sm">{label}</span>
  </label>
);`, msg: 'feat(ui): add Checkbox component' },
  { file: 'components/ui/Radio.tsx', content: `'use client';
export const Radio = ({ label, name, value, ...props }: any) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="radio" name={name} value={value} className="w-4 h-4 border-gray-300 text-blue-500 focus:ring-blue-500" {...props} />
    <span className="text-sm">{label}</span>
  </label>
);`, msg: 'feat(ui): add Radio component' },
  { file: 'components/ui/Switch.tsx', content: `'use client';
export const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={\`relative w-11 h-6 rounded-full transition-colors \${checked ? 'bg-blue-500' : 'bg-gray-300'}\`}
  >
    <span className={\`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform \${checked ? 'translate-x-5' : ''}\`} />
  </button>
);`, msg: 'feat(ui): add Switch toggle' },
  { file: 'hooks/useForm.ts', content: `import { useState, useCallback } from 'react';

export function useForm<T extends Record<string, any>>(initial: T) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const setError = useCallback(<K extends keyof T>(key: K, error: string) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
    setErrors({});
  }, [initial]);

  return { values, errors, setValue, setError, reset };
}`, msg: 'feat(hooks): add useForm hook' },
  { file: 'hooks/useHover.ts', content: `import { useState, useRef, useEffect, RefObject } from 'react';

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
}`, msg: 'feat(hooks): add useHover hook' },
  { file: 'lib/date.ts', content: `export const isToday = (date: Date): boolean => {
  return new Date().toDateString() === date.toDateString();
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toDateString() === date.toDateString();
};

export const daysAgo = (date: Date): number => {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
};

export const formatRelativeDate = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const days = daysAgo(date);
  if (days < 7) return \`\${days} days ago\`;
  if (days < 30) return \`\${Math.floor(days / 7)} weeks ago\`;
  return date.toLocaleDateString();
};`, msg: 'feat(lib): add date utilities' },
];

console.log('Adding 7 more commits...');
let count = 0;
for (const commit of commits) {
  const dir = commit.file.includes('/') ? commit.file.substring(0, commit.file.lastIndexOf('/')) : null;
  if (dir) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(commit.file, commit.content);
  execSync('git add -A', { stdio: 'pipe' });
  execSync(`git commit -m "${commit.msg}"`, { stdio: 'pipe' });
  count++;
  console.log(`  ${count}. ${commit.msg}`);
}
console.log('\nDone! Total commits:');
execSync('git rev-list --count HEAD', { stdio: 'inherit' });
