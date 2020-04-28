
import React from 'react'

import {DateTime} from "luxon"

export default function RelativeDate({date}) {
  return <time dateTime={date.toISO()} title={date.toLocaleString(DateTime.DATETIME_FULL)}>{date.toRelative()}</time>
}
