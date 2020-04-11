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
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';


import chrono from "chrono-node";

import { BrowserRouter, Route, Link } from "react-router-dom";

import { GoogleLogin, GoogleLogout } from 'react-google-login';

import { GOOGLE_CLIENT_ID, } from "./config.js";

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

const emptyState = {
  conflictedEvents: [],
  eventsConflicting: [],
  events: [],
  eventCount: 0,
  loading: true,
  intervals: new IntervalTree(),
  isSignedIn: false,
  signInError: null,
  tabValue: 0,
}

class App extends React.Component{

  constructor(props) {
    super(props)
    this.state = emptyState;
    this.fetcher = new EventFetcher()
  }

  onLoginSuccess = (response) => {
    this.setState({isSignedIn: true, signInError: null})
    console.log("Logged in")
    console.log(response)
    this.fetcher.setAuth(response.tokenObj)
    this.fetcher.fetch({callback: this.addEvents})
  }

  onLogoutSuccess = (response) => {
    this.setState(emptyState)
    console.log("Logged out")
    console.log(response)
  }

  onLoginFailure = (response) => {
    this.setState({isSignedIn: false, signInError: response})
    console.log(`Error logging in ${response}`)
  }

  toMillis = (event, fieldName, responseTz) => {
    let value = event[fieldName];
    return DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz }).ts
  }

  addComputedFields = (responseTz, event) => {
    event.conflicts = [];
    let start = this.toMillis(event, 'start', responseTz)
    let end = this.toMillis(event, 'end', responseTz)
    event.start.ms = start;
    event.end.ms = end;
  }

  handleEvent = (intervals, responseTz, event) => {
    this.addComputedFields(responseTz, event)
    let interval = [event.start.ms, event.end.ms - 1];
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

  handleChange = (event, newValue) => {
    console.log(event)
    console.log(newValue)
    this.setState({tabValue: newValue});
  };

  render() {
    const { classes } = this.props;

    const { isSignedIn, signInError, eventsConflicting, conflictedEvents, eventCount,
      events, tabValue} = this.state;

    const conflicts =
    <GridWithLoading className={classes.root} container isLoading={this.state.loading} spacing={3}>
     <Grid item xs={6}>
            <EventList
              onClick={(e, event) => this.handleEventClick(e, event)}
              events={conflictedEvents}
              eventCount={eventCount}
              title="Has Conflicts"
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

    let now = new DateTime({})
    let recent = now.minus({days: 1})
    let recentEvents = events.filter(e => {
      let created = DateTime.fromISO(e.created)
      let a = created.diff(recent)
      return a.valueOf() > 0
    })

    let aWeekAgo = now.minus({days: 7})
    let startOfNextMonth = new DateTime({}).plus({month: 1, days: 3}).startOf("month")
    let updatedEventIds = new Set(events.filter(e =>
      DateTime.fromISO(e.updated).diff(aWeekAgo).valueOf() > 0 &&
      DateTime.fromMillis(e.start.ms).diff(startOfNextMonth).valueOf() < 0
    ).map(e => e.id))
    let updatedEvents = events.filter(e => updatedEventIds.has(e.id))
    let conflictWithUpdatedEventIds = new Set(updatedEvents.flatMap(e => e.conflicts).filter(id => !updatedEventIds.has(id)))

    const recentEventIds = new Set(recentEvents.map(e => e.id))
    const conflictingIds = new Set(recentEvents.flatMap(e => e.conflicts).filter(id => !recentEventIds.has(id)))

    const creation = <Grid className={classes.root} container spacing={3}>
    <Grid item xs={6}>
           <EventList
             onClick={(e, event) => this.handleEventClick(e, event)}
             onDelete={(e, event) => this.handleDeleteClick(e, event)}
             events={recentEvents}
             eventCount={eventCount}
             title="Recently created"
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

    var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
    var SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly profile email"
    console.log(DISCOVERY_DOCS)
    console.log(SCOPES)

    const tabs = [
      {label: "Home", path: "/"},
      {label: "Conflicts", path: "/conflicts"},
      {label: "Create", path: "/create"},
      {label: "Updates", path: "/updates"},
    ]

    return (
      <div>
    <BrowserRouter initialIndex={0}>
        <div className={classes.root}>
            <AppBar position="static">
          <Toolbar>

          <Tabs value={tabValue} onChange={this.handleChange} variant="fullWidth">
            {
              tabs.map(
                ({label, path})=><Tab key={label}
                                      label={label}
                                      style={{
                                          display:"flex",
                                          alignItems:"center",
                                          justifyContent:"center"
                                      }}
                                      component={Link}
                                      to={path} />
              )
            }
          </Tabs>
          <div style={{flexGrow: 1}}/>
              { isSignedIn ?
                <GoogleLogout
                    clientId={GOOGLE_CLIENT_ID}
                    buttonText="Logout"
                    onLogoutSuccess={this.onLogoutSuccess}
                  /> : <GoogleLogin
                      clientId={GOOGLE_CLIENT_ID}
                      buttonText="Login"
                      onSuccess={this.onLoginSuccess}
                      onFailure={this.onLoginFailure}
                     isSignedIn={true}
                      scope = {SCOPES}
                      discoveryDocs = {DISCOVERY_DOCS}
                      cookiePolicy={'single_host_origin'}
                    />
              }
            </Toolbar>
          </AppBar>

          {signInError && <div>Sign on error: {signInError}</div>}
          <Route exact path='/'>
          <div>Bring a bit of structure to your chaotic schedule.</div>
          <ul>
            <li><Link to="/create" onClick={() => this.setState({tabValue: 1})}>Create</Link> events easily</li>
            <li><Link to="/conflicts" onClick={() => this.setState({tabValue: 2})}>Conflicts</Link> shown for recently entered events</li>
            <li><Link to="/updates" onClick={() => this.setState({tabValue: 3})}>Updates</Link> to calendar for past week, so you can sync to a paper calendar</li>
          </ul>

          </Route>
          <Route path='/create'>
            {creation}
          </Route>
          <Route path='/conflicts'>
            {conflicts}
          </Route>
          <Route path='/updates'>
            <Grid className={classes.root} container spacing={3}>
              <Grid item xs={6}>
                   <EventList
                     onClick={(e, event) => this.handleEventClick(e, event)}
                     onDelete={(e, event) => this.handleDeleteClick(e, event)}
                     events={updatedEvents}
                     eventCount={eventCount}
                     title="Recent updates for month"
                   >
                      <AddEvent onSubmit={this.handleAddEvent}/>
                   </EventList>

                 </Grid>
                 <GridWithLoading isLoading={this.state.loading} item xs={6}>
                   <EventList
                     events={events.filter(e => conflictWithUpdatedEventIds.has(e.id))}
                     eventCount={eventCount}
                     title="Conflict with"
                    />
                 </GridWithLoading>
            </Grid>
          </Route>
        </div>
      </BrowserRouter>
      </div>
    )
  }
}

export default withStyles(useStyles)(App)
