import React from 'react';
import './App.css';

import AddEvent from "./AddEvent";
import Conflicts from "./Conflicts"
import Creation from "./Creation"
import Updates from "./Updates"

import EventList from "./EventList";
import WithLoading from "./WithLoading";
import EventFetcher from "./EventFetcher";
import UpdatesFilter from "./UpdatesFilter"

import IntervalTree from '@flatten-js/interval-tree';
import { DateTime } from "luxon";

import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import RequireLogin from "./RequireLogin"

import {parseUpdatesSince} from "./dates"


import chrono from "chrono-node";

import { BrowserRouter, Route, Link } from "react-router-dom";

import { GoogleLogout } from 'react-google-login';

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
  intervals: new IntervalTree(),
  eventCount: 0,
  loading: true,
  isSignedIn: false,
  signInError: null,
  tabValue: 0,
  updatesSince: "a week ago",
  newSince: "a day ago"
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

  deleteEvent = (deletedEvent) => {
    this.setState((state, props) => {
      let events = state.events.filter((e) => e.id !== deletedEvent.id);
      let intervals = new IntervalTree();

      let conflictedEvents = events.filter(e => {return e.conflicts.length > 0;})
      conflictedEvents.forEach((e) => e.conflicts = e.conflicts.filter(id => id !== deletedEvent.id))

      return {
        loading: false,
        events: events,
        conflictedEvents: conflictedEvents,
        intervals: intervals,
        eventCount: events.length
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
    this.fetcher.delete(event, () => this.deleteEvent(event))
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

  handleUpdatesSince = (since) => {
      this.setState({updatesSince: since})
  }

  handleNewSince = (since) => {
      this.setState({newSince: since})
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
      events, tabValue, updatesSince, newSince} = this.state;

    const eventHandlers = {
      onDelete: this.handleDeleteClick,
      onClick: this.handleEventClick,
      onAdd: this.handleAddEvent,
    }

    const tabs = [
      {label: "Home", path: "/"},
      {label: "Conflicts", path: "/conflicts"},
      {label: "New", path: "/new"},
      {label: "Updates", path: "/updates"},
    ]

    const self = this;
    let requireSignon = (children) => {
      return <RequireLogin isSignedIn={isSignedIn} onSuccess={self.onLoginSuccess} onLoginFailure={self.onLoginFailure}>{children}</RequireLogin>
    }

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
              {requireSignon(
                <GoogleLogout
                    clientId={GOOGLE_CLIENT_ID}
                    buttonText="Logout"
                    onLogoutSuccess={this.onLogoutSuccess}
                  />
                )}
            </Toolbar>
          </AppBar>

          {signInError && <div>Sign on error: {signInError}</div>}
          <Route exact path='/'>
          <div>Bring a bit of structure to your chaotic schedule.</div>
          <ul>
            <li><Link to="/new" onClick={() => this.setState({tabValue: 1})}>New</Link> events, easily created</li>
            <li><Link to="/conflicts" onClick={() => this.setState({tabValue: 2})}>Conflicts</Link> shown for recently entered events</li>
            <li><Link to="/updates" onClick={() => this.setState({tabValue: 3})}>Updates</Link> to calendar since e.g. a week ago, so you can sync to a paper calendar</li>
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

          <div>
          {requireSignon(<></>)}
          </div>

          </Route>
          <Route path='/new'>
            {requireSignon(<Creation eventHandlers={eventHandlers}
              handleNewSince={this.handleNewSince}
               {...this.props}
               {...this.state}/>)}
          </Route>
          <Route path='/conflicts'>
            {requireSignon(<Conflicts
              eventHandlers={eventHandlers}
              {...eventHandlers}
              {...this.props}
              {...this.state}/>)}
          </Route>
          <Route path='/updates'>
          {requireSignon(<Updates
            eventHandlers={eventHandlers}
            handleUpdatesSince={this.handleUpdatesSince}
            {...eventHandlers}
            {...this.props}
            {...this.state}/>)}
          </Route>
        </div>
      </BrowserRouter>
      </div>
    )
  }
}

export default withStyles(useStyles)(App)
