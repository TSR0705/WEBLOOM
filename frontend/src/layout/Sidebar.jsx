import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutGrid,
  Briefcase,
  Clock,
  GitCompare,
  Settings,
  Zap,
  ChevronRight,
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { cn } from "../utils/cn"

/* -----------------------------
   Navigation config (scalable)
------------------------------ */

const NAV = [
  {
    section: "Core",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutGrid,
      },
      {
        label: "New Jobs",
        path: "/jobs/new",
        icon: Briefcase,
        disabled: false, 
      },
    ],
  },
  {
    section: "Analysis",
    items: [
      {
        label: "History",
        path: "/history",
        icon: Clock,
        disabled: true,
      },
      {
        label: "Compare",
        path: "/compare",
        icon: GitCompare,
        disabled: true,
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
        disabled: true,
      },
    ],
  },
]

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const location = useLocation()

  /* -----------------------------
     Persist expand state
  ------------------------------ */
  useEffect(() => {
    const saved = localStorage.getItem("webloom.sidebar")
    if (saved) setExpanded(saved === "expanded")
  }, [])

  const toggleSidebar = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(
        "webloom.sidebar",
        next ? "expanded" : "collapsed"
      )
      return next
    })
  }

  /* -----------------------------
     Memoized navigation
  ------------------------------ */
  const navigation = useMemo(() => NAV, [])

  const collapsed = !expanded

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        "relative flex min-h-dvh flex-col border-r border-white/5 bg-[#0C0F14]",
        "transition-[width] duration-300 ease-out",
        expanded ? "w-[240px]" : "w-[84px]"
      )}
    >
      {/* --------------------------------
         Logo
      -------------------------------- */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#111418] shadow-[0_0_20px_rgba(50,255,195,0.15)]">
          <Zap className="h-5 w-5 text-[#32FFC3]" />
        </div>

        {!collapsed && (
          <span className="text-[#32FFC3] font-semibold tracking-wide">
            Webloom
          </span>
        )}
      </div>

      {/* --------------------------------
         Navigation
      -------------------------------- */}
      <nav className="flex flex-col">
        {navigation.map((group) => (
          <div key={group.section}>
            {/* Section title */}
            {!collapsed && (
              <div className="px-4 pt-6 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {group.section}
              </div>
            )}

            <div className="flex flex-col gap-1 px-2">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path

                return (
                  <NavLink
                    key={item.label}
                    to={item.disabled ? "#" : item.path}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    tabIndex={item.disabled ? -1 : 0}
                    className={cn(
                      "group relative flex items-center gap-4 rounded-xl px-4 py-3",
                      "transition-colors focus:outline-none focus:ring-2 focus:ring-[#32FFC3]/40",
                      item.disabled
                        ? "cursor-not-allowed opacity-40"
                        : isActive
                        ? "bg-[#111418] text-[#32FFC3] shadow-[0_0_16px_rgba(50,255,195,0.2)]"
                        : "text-gray-400 hover:bg-white/5"
                    )}
                  >
                    {/* Active rail */}
                    {isActive && (
                      <span className="absolute left-0 h-6 w-1 rounded-r bg-[#32FFC3]" />
                    )}

                    <Icon className="h-5 w-5 shrink-0" />

                    {/* Label */}
                    <span
                      className={cn(
                        "text-sm font-medium transition-opacity",
                        collapsed
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100"
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Tooltip (collapsed mode) */}
                    {collapsed && !item.disabled && (
                      <span className="absolute left-full ml-3 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      {/* --------------------------------
         Expand / Collapse
      -------------------------------- */}
      <button
        onClick={toggleSidebar}
        aria-expanded={expanded}
        className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl text-gray-400 transition hover:bg-white/5 hover:text-[#32FFC3]"
      >
        <ChevronRight
          className={cn(
            "h-5 w-5 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
    </aside>
  )
}
