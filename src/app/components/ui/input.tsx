import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string
}

function Input({ className = '', type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${className}`}
    />
  )
}

export default Input
