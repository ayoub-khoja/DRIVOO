import React, { useEffect, useState } from 'react'
import { IconButton } from '@mui/material'
import { KeyboardArrowUp as ArrowUpIcon } from '@mui/icons-material'

import '@/assets/css/scroll-top-button.css'

const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) {
    return null
  }

  return (
    <IconButton
      className="scroll-top-bubble"
      aria-label="Remonter en haut"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUpIcon />
    </IconButton>
  )
}

export default ScrollTopButton
