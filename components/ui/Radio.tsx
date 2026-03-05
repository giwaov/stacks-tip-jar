'use client';
export const Radio = ({ label, name, value, ...props }: any) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="radio" name={name} value={value} className="w-4 h-4 border-gray-300 text-blue-500 focus:ring-blue-500" {...props} />
    <span className="text-sm">{label}</span>
  </label>
);