import React from 'react';
import './App.css';

import Home from "./Home"
import UpdatesFilter from "./UpdatesFilter"

import {parseUpdatesSince} from "./dates"

import { DateTime } from "luxon";

import { withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import RequireLogin from "./RequireLogin"

import { BrowserRouter, Route, Link, Switch} from "react-router-dom"
import { withRouter } from "react-router"

import { GoogleLogout } from 'react-google-login';

import { GOOGLE_CLIENT_ID, } from "./config.js";

import {addEvent, deleteEvent, setFocusedEvent, fetchEvents, eventsSelectors} from "./redux/eventsSlice"
import {onLoginSuccess, onLogoutSuccess, onLoginFailure} from "./redux/sessionSlice"
import {setVisibilityFilterSince} from "./redux/visibilitySlice"

import { connect } from 'react-redux'

import EventList from "./EventList";
import WithLoading from "./WithLoading";

import Grid from '@material-ui/core/Grid';

const GridWithLoading = WithLoading(Grid);


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

const getVisibleEventIds = (state, location, filter) => {

  let recent = parseUpdatesSince(filter.since)
  console.log(`Recent ${recent}`)
  console.log("Visible events")
  console.log(state)
  console.log(location.pathname)

  switch (location.pathname) {
    case "/new":
      console.log(`Filtering new since ${filter.since}`)
      return eventsSelectors.selectAll(state).filter(e =>
        DateTime.fromISO(e.created).diff(recent).valueOf() > 0
      ).map(e => e.id)

    case "/updates":
      let startOfNextMonth = new DateTime({}).plus({month: 1, days: 3}).startOf("month")
      console.log(`Filtering updates since ${filter.since} through ${startOfNextMonth}`)
      return eventsSelectors.selectAll(state).filter(e =>
          DateTime.fromISO(e.updated).diff(recent).valueOf() > 0 &&
          DateTime.fromMillis(e.start.ms).diff(startOfNextMonth).valueOf() < 0
        ).map(e => e.id)

    case "/conflicts":
      console.log(`Filtering conflicts`)
      console.log(state.events.conflicts)
      let conflicts = new Set(Object.keys(state.events.conflicts))
      return state.events.ids.filter(id => conflicts.has(id))

    default:
      console.log("Returning all events for " + location.pathname)
      return state.events.ids
  }
}

const mapStateToProps = (state, props) => {
    return {
      eventIds: getVisibleEventIds(state, props.location, state.visibilityFilter),
      totalEventCount: eventsSelectors.selectTotal(state),
      since: state.visibilityFilter.since,
      focusedEventId: state.events.focusedEventId,
      isSignedIn: state.session.isSignedIn,
      signInError: state.session.signInError,
      loading: !state.events.atLeastOneFetched,
    }
}



function InnerApp(props) {
    const { location, classes, store, eventIds, eventsCount, totalEventCount,
      focusedEvent, focusedTitle, since,
      isSignedIn, signInError} = props;

    const eventHandlers = {
      onDelete: (e, event) => {
        console.log("onDelete")
        console.log(event)
        store.dispatch(deleteEvent(event))
      },
      onClick: (e, event) => {
        console.log("onClick")
        console.log(event)
        store.dispatch(setFocusedEvent(event))
      },
      onAdd: (e) => {
        store.dispatch(addEvent(e))
      },
    }

    const tabs = [
      {label: "Home", path: "/"},
      {label: "Conflicts", path: "/conflicts"},
      {label: "New", path: "/new"},
      {label: "Updates", path: "/updates"},
    ]

    let requireSignon = (children) => {
      let onSuccess = e => {
        console.log(e)
        store.dispatch(onLoginSuccess({token: e.tokenObj, profile: e.profileObj}))
        store.dispatch(fetchEvents())
      }

      return <RequireLogin
      isSignedIn={isSignedIn}
                  onSuccess={onSuccess}
                  onLoginFailure={e => store.dispatch(onLoginFailure(e))}>
                  {children}
              </RequireLogin>
    }

    return (<>
        <div className={classes.root}>
          <AppBar position="static">
          <Toolbar>
          <Tabs value={location.pathname} variant="fullWidth">
            {
              tabs.map(
                ({label, path})=><Tab key={label}
                                      label={label}
                                      value={path}
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
                    onLogoutSuccess={e => store.dispatch(onLogoutSuccess(e))}
                  />
                )}
            </Toolbar>
          </AppBar>
          </div>

          {signInError && <div>Sign on error: {signInError}</div>}
          <Switch>
            <Route exact path='/'>
              <Home>
                {requireSignon(<></>)}
              </Home>
            </Route>
            <Route path='/'>
              {requireSignon(<GridWithLoading className={props.classes.root} container isLoading={props.loading} spacing={3}>
               <Grid item xs={6}>
                      <EventList
                        {...eventHandlers}
                        ids={eventIds}
                        eventCount={totalEventCount}
                        focusedEvent={focusedEvent}
                        title={<UpdatesFilter title="since "
                        defaultValue={since}
                        placeholder="a week ago"
                        onValidated={value => store.dispatch(setVisibilityFilterSince(value))}/>}
                      />
                </Grid>
                  <Grid item xs={6}>
                    {focusedEvent &&  <EventList
                             events={[]}
                             eventCount={totalEventCount}
                             title={focusedTitle}
                            />
            }
                  </Grid>
              </GridWithLoading>)}
            </Route>
          </Switch>
          </>
    )
  }

const InnerAppWithRouter = withStyles(useStyles)(withRouter(connect(mapStateToProps)(InnerApp)))

function App(props) {
  return (
    <BrowserRouter initialIndex={0}>
            <InnerAppWithRouter {...props}/>
    </BrowserRouter>
  )
}
export default App
