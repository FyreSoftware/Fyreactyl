import React from 'react';

export type IButton = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export const PrimaryButton: React.FC<IButton> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <button
      className={`py-2 px-4 rounded bg-blue-500 hover:bg-blue-600 focus:outline-none ring-opacity-75 ring-blue-400 focus:ring text-white text-lg ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
