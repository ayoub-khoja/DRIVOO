import React from 'react'
import { Button } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/no-match'
import Layout from '@/components/Layout'
import { appNavigate } from '@/utils/appNavigate'

interface NoMatchProps {
  hideHeader?: boolean
}

const NoMatch = ({ hideHeader }: NoMatchProps) => {
  const noMatch = () => (
    <div className="msg">
      <h2>{strings.NO_MATCH}</h2>
      <p>
        <Button variant="text" onClick={() => appNavigate('/')} className="btn-lnk">{commonStrings.GO_TO_HOME}</Button>
      </p>
    </div>
  )

  return hideHeader ? noMatch() : <Layout strict={false}>{noMatch()}</Layout>
}

export default NoMatch
