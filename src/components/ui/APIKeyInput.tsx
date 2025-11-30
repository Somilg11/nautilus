"use client"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface APIKeyInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export default function APIKeyInput({ label, value, onChange }: APIKeyInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="
        flex items-center border rounded-md px-3 py-2 
        bg-white dark:bg-gray-800 
        border-gray-300 dark:border-gray-600
      ">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 outline-none"
          placeholder="Enter API Key..."
          autoComplete="off"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="ml-2 text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
