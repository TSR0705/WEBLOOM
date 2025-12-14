import { cn } from '../../utils/cn'

export function Table({ className, children, ...props }) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn(
          'w-full border-collapse text-sm text-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead
      className={cn(
        'border-b border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody
      className={cn(
        'divide-y divide-white/5',
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  )
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr
      className={cn(
        `
        transition
        hover:bg-white/[0.04]
        data-[state=selected]:bg-white/[0.06]
        `,
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ className, children, ...props }) {
  return (
    <th
      className={cn(
        `
        px-4 py-3
        text-left
        text-xs
        font-medium
        uppercase
        tracking-wide
        text-gray-400
        `,
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }) {
  return (
    <td
      className={cn(
        `
        px-4 py-4
        align-middle
        text-gray-200
        `,
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}
