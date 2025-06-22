import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-orange-400 hover:bg-orange-700 text-white shadow-md shadow-orange-100 rounded-2xl border border-sm",

        ok: "bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-100 border border-green-100",
        cancel: "bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl shadow border border-blue-50",
        edit: "bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-100 border border-blue-100",

        default2: "bg-orange-500 text-white hover:bg-orange-600 shadow-[inset_-4px_-4px_8px_rgba(255,255,255,0.4),inset_4px_4px_8px_rgba(0,0,0,0.2)] rounded-full border border-orange-700",
        destructive: "bg-red-600 text-white hover:bg-red-700 rounded-xl shadow border border-red-50",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 rounded-full", // <-- FULLY ROUNDED
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)



export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className
    , variant = "default", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
