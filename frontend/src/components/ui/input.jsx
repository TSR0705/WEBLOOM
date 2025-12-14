import { cn } from "../../utils/cn"

export function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      className={cn(
        `
        w-full
        rounded-lg
        bg-white/5
        border border-white/10
        px-4 py-2.5
        text-sm text-white
        placeholder:text-gray-500
        outline-none
        transition

        focus:border-[#32FFC3]/50
        focus:ring-2
        focus:ring-[#32FFC3]/20

        disabled:opacity-50
        disabled:cursor-not-allowed
        `,
        className
      )}
      {...props}
    />
  )
}
