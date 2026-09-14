import React from 'react'
import { Button } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { appNavigate } from '@/utils/appNavigate'

interface InfoProps {
  className?: string
  message: string
  hideLink?: boolean
  style?: React.CSSProperties
}

const Info = ({
  className,
  message,
  hideLink,
  style
}: InfoProps) => (
  <div style={style || {}} className={`${className ? `${className} ` : ''}msg`}>
    <p>{message}</p>
    {!hideLink && <Button variant="text" onClick={() => appNavigate('/')} className="btn-lnk">{commonStrings.GO_TO_HOME}</Button>}
  </div>
)

export default Info
