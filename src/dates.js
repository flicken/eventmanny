
import { DateTime } from "luxon";
import chrono from "chrono-node";

export const parseDatetime = (s) => {
  let datetimes = chrono.parse(s, new Date(), { forwardDate: false })
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
    return undefined;
  }
}

export const parseUpdatesSince = (since) => {
  let d = parseDatetime(since)
  if (!d) {
    return false;
  }

  let now = new DateTime({})

  // try prefixing "last"
  if (d.diff(now).valueOf() > 0) {
    d = parseDatetime("last " + since)
  }
  // try suffixing "ago"
  if (d.diff(now).valueOf() > 0) {
    d = parseDatetime(since + " ago")
  }

  if (d.diff(now).valueOf() > 0) {
    return false
  }

  return d;
}
