import React from 'react';

import { DateTime } from "luxon";

class EventList extends React.Component{
  render() {
    const { events, eventCount, title } = this.props;

    let eventsList = <ul>
     {events.length} / {eventCount} events shown
     { events.map((event) => {
      return (
        <li key={event.id}>
        {event.conflicts.length} - {event.summary}{" "}
          (<a
            href={event.htmlLink}
            target="_blank" rel="noopener noreferrer"
          >
            {DateTime.fromMillis(event.start.ms).toLocaleString(DateTime.TIME_SIMPLE)},{" "}
            {DateTime.fromMillis(event.end.ms).diff(
                  DateTime.fromMillis(event.start.ms),
                  "minutes"
                ).toFormat("mm")}{" "}
            minutes, {DateTime.fromMillis(event.start.ms).toLocaleString()}{" "}
            </a>)
          </li>
      );
    }) }
    </ul>;

    let emptyState = (
      <div className="empty">
        <h3>
        Empty
        </h3>
      </div>
    );

    return (
      <div className="event-container">
        <div>
          <h1>{title}</h1>
          <div>
            {events.length > 0 && eventsList}
            {events.length === 0 && emptyState}
          </div>
        </div>
      </div>
    );
  }
}

export default EventList;
