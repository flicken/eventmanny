import React from 'react';
import './App.css';

import EventList from "./EventList";
import WithLoading from "./WithLoading";

import Grid from '@material-ui/core/Grid';

const GridWithLoading = WithLoading(Grid);

export default function Conflicts(props) {
  console.log("Conflicts")
  console.log(props)
  return <GridWithLoading className={props.classes.root} container isLoading={props.loading} spacing={3}>
   <Grid item xs={6}>
          <EventList
            {...props.eventHandlers}
            events={props.conflictedEvents}
            eventCount={props.eventCount}
            title="Has Conflicts"
          />
    </Grid>
      <Grid item xs={6}>
        <EventList
          events={props.eventsConflicting}
          eventCount={props.eventCount}
          title="Conflicts"
         />
      </Grid>
  </GridWithLoading>

}
