// DropdownMenu.jsx
import React, { useRef, useState, useEffect, cloneElement } from "react"

export default function CardDropdownMenu({ 
  trigger, // JSX element to trigger menu (usually a button)
  items = [], // Array of { label, onClick, className }
  align = "right", // Menu alignment: 'right' or 'left'
  className = "",
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (open && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Clone the trigger and inject onClick to stopPropagation and open menu
  const enhancedTrigger = React.cloneElement(
    trigger,
    {
      onClick: (e) => {
        e.stopPropagation()
        setOpen((o) => !o)
        if (trigger.props.onClick) trigger.props.onClick(e)
      }
    }
  )

  return (
    <div className="relative inline-block" ref={menuRef}>
      {enhancedTrigger}
      {open && (
        <div
          className={`
            absolute ${align === "right" ? "right-0" : "left-0"}
            top-7 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in
            ${className}
          `}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={e => {
                e.stopPropagation()
                item.onClick()
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${item.className || ""}`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
