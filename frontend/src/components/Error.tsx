import React from 'react'
import { Button } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { appNavigate } from '@/utils/appNavigate'

import '@/assets/css/error.css'

interface ErrorProps {
  message: string
  style?: React.CSSProperties
  homeLink?: boolean
}

const Error = ({ message, style, homeLink }: ErrorProps) => (
  <div style={style || {}}>
    <div className="error">
      <span className="message">{message}</span>
    </div>
    {homeLink && (
      <p>
        <Button variant="text" onClick={() => appNavigate('/')} className="btn-lnk">{commonStrings.GO_TO_HOME}</Button>
      </p>
    )}
  </div>
)

export default Error
