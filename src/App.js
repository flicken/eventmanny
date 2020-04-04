import React from 'react';
import './App.css';

import AddEvent from "./AddEvent";

import EventList from "./EventList";
import WithLoading from "./WithLoading";
import EventFetcher from "./EventFetcher";

import IntervalTree from '@flatten-js/interval-tree';
import { DateTime } from "luxon";

import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

import chrono from "chrono-node";

import { BrowserRouter, Route, Link } from "react-router-dom";

const useStyles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  });

const GridWithLoading = WithLoading(Grid);

class App extends React.Component{

  constructor(props) {
    super(props)
    this.state = {
      conflictedEvents: [],
      eventsConflicting: [],
      events: [],
      eventCount: 0,
      loading: true,
      intervals: new IntervalTree(),
    };
    this.fetcher = new EventFetcher()
  }

  componentDidMount = () => {
    this.setState({ loading: true });
    this.fetcher.fetch({callback: this.addEvents})
  }

  toMillis = (event, fieldName, responseTz) => {
    let value = event[fieldName];
    return DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz }).ts
  }

  handleEvent = (intervals, responseTz, event) => {
    event.conflicts = [];
    let start = this.toMillis(event, 'start', responseTz)
    let end = this.toMillis(event, 'end', responseTz)
    let interval = [start, end - 1];
    event.start.ms = start;
    event.end.ms = end;
    intervals.search(interval).forEach( (e) => {
      console.log("Found conflict: " + e)
      event.conflicts.push(e.id);
      e.conflicts.push(event.id);
    });

    intervals.insert(interval, event);
  }

  addEvents = ({newEvents, responseTz}) => {
    this.setState((state, props) => {
      let events = state.events.concat(newEvents)
      let intervals = new IntervalTree();

      events.forEach((event) => this.handleEvent(intervals, responseTz, event));

      let conflictedEvents = events.filter(e => {return e.conflicts.length > 0;});

      return {
        loading: false,
        events: events,
        conflictedEvents: conflictedEvents,
        intervals: intervals,
        eventCount: events.length,
        responseTz: responseTz
      };
    });
  }

  doSearch = (event) => {
    this.setState({searchTerm: event.target.value},
       this.fetcher.fetch(this.addEvents));
  }

  handleEventClick = (e, event) => {
    console.log("Trying to filter by event")
    console.log(event)
    console.log(e)

    this.setState((state, props) => {
      let eventsConflicting = state.events.filter((e) => event.conflicts.includes(e.id));
      return {
        focusedEvent: event,
        eventsConflicting
      };
    }
    )
  }

  handleDeleteClick = (e, event) => {
    console.log("Trying to delete event")
    console.log(event)
    console.log(e)
    this.fetcher.delete(event, () => this.setState((state, props) => {
      let eventsWithThisEvent = state.events.filter((e) => e.id !== event.id);
      return {
        events: eventsWithThisEvent
      }
    }))
  }


  toDatetime = (components, other) => {
    if (!components) {
      if (other.date) {
        return other;
      } else {
        return {
          dateTime: DateTime.fromISO(other.dateTime).plus({ hours: 1 })
        }
      }
    }
    let values = {...components.impliedValues, ...components.knownValues}
    let d = DateTime.fromObject({
      year: values.year,
      month: values.month,
      day: values.day,
      hour: values.hour,
      minute: values.minute,
      second: values.second
    })

    if (components.knownValues.hour) {
      return {
        dateTime: d.toISO()
      }
    } else {
      return {
        date: d.toISODate()
      }
    }
  }

  handleAddEvent = (input) => {
    console.log(input)

    let datetimes = chrono.parse(input.datetimes, new Date(), { forwardDate: true })
    console.log(datetimes)

    let start = this.toDatetime(datetimes[0].start)
    console.log(start)
    let end = this.toDatetime(datetimes[0].end, start)
    console.log(end)


    const event = {
      summary: input.summary,
      start: start,
      end: end
    }

    console.log(event)

    this.fetcher.insert(event, (createdEvent) => {
      console.log("Event created")
      console.log(createdEvent)
      this.setState(({intervals, events, responseTz}, {props}) => {
        this.handleEvent(intervals, responseTz, createdEvent)
        console.log(createdEvent)
        return {
          events: [...events, createdEvent]
        }
      }
    )
    })
  }

  render() {
    const { classes } = this.props;

    const { eventsConflicting, conflictedEvents, eventCount,
      events} = this.state;

    const conflicts =
    <GridWithLoading className={classes.root} container isLoading={this.state.loading} spacing={3}>
     <Grid item xs={6}>
            <EventList
              onClick={(e, event) => this.handleEventClick(e, event)}
              events={conflictedEvents}
              eventCount={eventCount}
              title="Events With Conflicts"
            />
      </Grid>
        <Grid item xs={6}>
          <EventList
            events={eventsConflicting}
            eventCount={eventCount}
            title="Conflicts"
           />
        </Grid>
    </GridWithLoading>

    let recent = new DateTime({}).minus({days: 1})
    let recentEvents = events.filter(e => {
      let created = DateTime.fromISO(e.created)
      let a = created.diff(recent)
      return a.valueOf() > 0
    })

    const recentEventIds = new Set(recentEvents.map(e => e.id))
    const conflictingIds = new Set(recentEvents.flatMap(e => e.conflicts).filter(id => !recentEventIds.has(id)))

    const creation = <Grid className={classes.root} container spacing={3}>
    <Grid item xs={6}>
           <EventList
             onClick={(e, event) => this.handleEventClick(e, event)}
             onDelete={(e, event) => this.handleDeleteClick(e, event)}
             events={recentEvents}
             eventCount={eventCount}
             title="Recent events"
           >
              <AddEvent onSubmit={this.handleAddEvent}/>
           </EventList>

         </Grid>
         <GridWithLoading isLoading={this.state.loading} item xs={6}>
           <EventList
             events={events.filter(e => conflictingIds.has(e.id))}
             eventCount={eventCount}
             title="Conflict with"
            />
         </GridWithLoading>
    </Grid>

    return (
      <BrowserRouter initialEntries={['/conflicts']} initialIndex={0}>
        <div className={classes.root}>
          <Route exact path='/'>
          <nav>
            <Link to="/create" >Create</Link>  |
            <Link to="/conflicts">Conflicts</Link>
          </nav>
          </Route>
          <Route path='/create'>
            {creation}
          </Route>
          <Route path='/conflicts'>
            {conflicts}
          </Route>
        </div>
      </BrowserRouter>
    )
  }
}

export default withStyles(useStyles)(App)
