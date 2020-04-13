
import React from 'react';
import './App.css';

import UpdatesFilter from "./UpdatesFilter"
import AddEvent from "./AddEvent"
import RelativeDate from "./RelativeDate"

import EventList from "./EventList";
import WithLoading from "./WithLoading";

import Grid from '@material-ui/core/Grid';

import {DateTime} from "luxon"

import {parseUpdatesSince} from "./dates"

const GridWithLoading = WithLoading(Grid);

export default function Creation(props) {
  console.log("Creation")
  console.log(props)
  let recent = parseUpdatesSince(props.newSince)
  let recentEvents = props.events.filter(e => {
    let created = DateTime.fromISO(e.created)
    let a = created.diff(recent)
    return a.valueOf() > 0
  })


  let recentEventIds = new Set(recentEvents.map(e => e.id))
  let conflictingIds = new Set(recentEvents.flatMap(e => e.conflicts).filter(id => !recentEventIds.has(id)))

  return <Grid className={props.classes.root} container spacing={3}>
    <Grid item xs={6}>
       <EventList
         {...props.eventHandlers}
         events={recentEvents}
         eventCount={props.eventCount}
         title={<UpdatesFilter title="Newly created since "
        defaultValue={props.newSince}
         placeholder="a day ago"
         onValidated={props.handleNewSince}/>}
       >
          <AddEvent onSubmit={props.eventHandlers.onAdd}/>
       </EventList>

     </Grid>
     <GridWithLoading isLoading={props.loading} item xs={6}>
       <EventList
         events={props.events.filter(e => conflictingIds.has(e.id))}
         eventCount={props.eventCount}
         title={<>Conflicts with newly created since <RelativeDate date={recent}/></>}
        />
     </GridWithLoading>
  </Grid>
}
