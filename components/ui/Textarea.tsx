'use client';
export const Textarea = ({ label, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium">{label}</label>}
    <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" {...props} />
  </div>
);