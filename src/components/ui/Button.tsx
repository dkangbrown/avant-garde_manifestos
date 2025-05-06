import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function Button({ className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`px-4 py-2 rounded-lg shadow bg-slate-900 text-white hover:bg-slate-700 transition-colors ${className}`}
    />
  );
}
