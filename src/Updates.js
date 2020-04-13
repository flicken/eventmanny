import React from 'react';
import './App.css';

import EventList from "./EventList";
import RelativeDate from "./RelativeDate"
import WithLoading from "./WithLoading";
import UpdatesFilter from "./UpdatesFilter";

import Grid from '@material-ui/core/Grid';

import {DateTime} from "luxon"
import {parseUpdatesSince} from "./dates"

const GridWithLoading = WithLoading(Grid);

export default function Conflicts(props) {
  let updatesSinceDate = parseUpdatesSince(props.updatesSince)
  let startOfNextMonth = new DateTime({}).plus({month: 1, days: 3}).startOf("month")
  let updatedEventIds = new Set(props.events.filter(e =>
    DateTime.fromISO(e.updated).diff(updatesSinceDate).valueOf() > 0 &&
    DateTime.fromMillis(e.start.ms).diff(startOfNextMonth).valueOf() < 0
  ).map(e => e.id))
  let updatedEvents = props.events.filter(e => updatedEventIds.has(e.id))
  let conflictWithUpdatedEventIds = new Set(updatedEvents.flatMap(e => e.conflicts).filter(id => !updatedEventIds.has(id)))

  return <Grid className={props.classes.root} container spacing={3}>

    <Grid item xs={6}>
         <EventList
           {...props.eventHandlers}
           events={updatedEvents}
           eventCount={props.eventCount}
           title={<UpdatesFilter title="Recent updates since "
           placeholder="a week ago"
           defaultValue={props.updatesSince}
            onValidated={props.handleUpdatesSince}/>}
         />

       </Grid>
       <GridWithLoading isLoading={props.loading} item xs={6}>
         <EventList
           events={props.events.filter(e => conflictWithUpdatedEventIds.has(e.id))}
           eventCount={props.eventCount}
           title={<>Conflicts with updates since <RelativeDate date={updatesSinceDate}/></>}
          />
       </GridWithLoading>
  </Grid>

}
