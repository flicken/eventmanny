
import { DateTime } from "luxon"
import * as chrono from 'chrono-node';

export const parseDatetime = (s, now) => {
  let datetimes = chrono.parse(s, now, { forwardDate: false })
  if (datetimes[0]) {
    let components = datetimes[0].start

    let values = {...components.impliedValues, ...components.knownValues}
    return DateTime.fromObject({
      year: values.year,
      month: values.month,
      day: values.day,
      hour: values.hour,
      minute: values.minute,
      second: values.second
    })
  } else {
    return undefined
  }
}

export const parseUpdatesSince = (since) => {
  let now = new DateTime({})
  let d = parseDatetime(since, now)
  if (!d) {
    return false
  }

  // try prefixing "last"
  if (d.diff(now).valueOf() > 0) {
    d = parseDatetime("last " + since, now)
  }
  // try suffixing "ago"
  if (d.diff(now).valueOf() > 0) {
    d = parseDatetime(since + " ago", now)
  }

  if (d.diff(now).valueOf() > 0) {
    return false
  }

  return d
}
