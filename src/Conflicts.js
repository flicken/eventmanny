import React from 'react';
import './App.css';

import EventList from "./EventList";
import WithLoading from "./WithLoading";

import Grid from '@material-ui/core/Grid';

const GridWithLoading = WithLoading(Grid);

export default function Conflicts(props) {
  console.log("Conflicts")
  console.log(props)
  const {focusedEvent, conflictedEvents} = props
  let focusedEvents = []
  let focusedTitle = "No event selected"
  if (focusedEvent) {
    focusedEvents = conflictedEvents.filter((e) => e.conflicts.includes(focusedEvent.id));
    focusedTitle = `Conflicts with ${focusedEvent.summary}`
  }

  return <GridWithLoading className={props.classes.root} container isLoading={props.loading} spacing={3}>
   <Grid item xs={6}>
          <EventList
            {...props.eventHandlers}
            events={conflictedEvents}
            eventCount={props.eventCount}
            title="Has Conflicts"
          />
    </Grid>
      <Grid item xs={6}>
       {focusedEvent &&  <EventList
                 events={focusedEvents}
                 eventCount={props.eventCount}
                 title={focusedTitle}
                />
}
      </Grid>
  </GridWithLoading>

}
