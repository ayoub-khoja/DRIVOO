import React, { CSSProperties } from 'react'
import { Button } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/unauthorized'
import { appNavigate } from '@/utils/appNavigate'

interface UnauthorizedProps {
  style?: CSSProperties
}

const Unauthorized = ({ style }: UnauthorizedProps) => (
  <div className="msg" style={style || {}}>
    <h2>{strings.UNAUTHORIZED}</h2>
    <p>
      <Button variant="text" onClick={() => appNavigate('/')} className="btn-lnk">{commonStrings.GO_TO_HOME}</Button>
    </p>
  </div>
)

export default Unauthorized
