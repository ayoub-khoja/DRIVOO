import React from 'react'
import { Button } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { appNavigate } from '@/utils/appNavigate'

interface ErrorProps {
  style?: React.CSSProperties
}

const Error = ({ style }: ErrorProps) => (
  <div className="msg" style={style || {}}>
    <h2>{commonStrings.GENERIC_ERROR}</h2>
    <Button variant="text" onClick={() => appNavigate('/')} className="btn-lnk">{commonStrings.GO_TO_HOME}</Button>
  </div>
)

export default Error
