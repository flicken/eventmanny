import React from "react"

import { Link } from "react-router-dom"

export default function Home({children, onSelectTab}) {
  return <>
    <div>Bring a bit of structure to your chaotic schedule.</div>
    <ul>
      <li><Link to="/new">New</Link> events, easily created</li>
      <li><Link to="/conflicts">Conflicts</Link> shown for recently entered events</li>
      <li><Link to="/updates">Updates</Link> to calendar since e.g. a week ago, so you can sync to a paper calendar</li>
    </ul>

    <div>
      Suggestions and feature requests on Github <a href="https://github.com/flicken/eventmanny">flicken/eventmanny</a>.  Current TODOs:
    <ul>
      <li>Select (multiple) calendars</li>
      <li>Grouping of events (e.g. concert series or rehearsals that are related, but not regularly scheduled)</li>
      <li>Easy exception handling (e.g. school is out, so no regularly scheduled events)</li>
      <li>Attach image to events / series (e.g. picture of poster for concert series)</li>
      <li>Even easier entering of series (e.g. concert series that has mostly the same info, but different dates, times, location, headline acts, etc)</li>
    </ul>
    </div>

    <div>Follow the journey via the <a href="https://blog.eventmanny.com/">Event Manny blog</a></div>

    {children}
  </>
}
