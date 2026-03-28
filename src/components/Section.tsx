import React from 'react';

interface SectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  description?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export function Section({ title, children, description, headerActions, className = '' }: SectionProps) {
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mb-4 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-4 px-6 py-4 bg-white">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
        </div>
        {headerActions}
      </div>
      <div className="border-t border-gray-100 px-6 py-6">{children}</div>
    </div>
  );
}
