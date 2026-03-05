'use client';
export const Checkbox = ({ label, ...props }: any) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" {...props} />
    <span className="text-sm">{label}</span>
  </label>
);