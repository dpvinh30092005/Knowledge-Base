import { Link } from 'react-router-dom'
import logoMark from '@/assets/logo-mark.png'

type LogoProps = {
  className?: string
  iconOnly?: boolean
  hideIcon?: boolean
}

export default function Logo({
  className = "",
  iconOnly = false,
  hideIcon = false
}: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 select-none hover:opacity-90 transition-opacity ${className}`}>
      {!hideIcon && (
        <img
          src={logoMark}
          alt="InteliPath"
          className="h-7 w-auto shrink-0"
          draggable={false}
        />
      )}
      {!iconOnly && (
        <span className="font-bold text-[18px] tracking-tight text-inherit">
          InteliPath
        </span>
      )}
    </Link>
  )
}
