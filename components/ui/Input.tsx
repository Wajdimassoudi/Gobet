
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>}
      <input
        id={id}
        className="w-full px-3 py-2 bg-brand-surface border border-gray-600 rounded-md text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        {...props}
      />
    </div>
  );
};

export default Input;
