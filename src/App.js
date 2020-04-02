import React from 'react';
import './App.css';

import EventList from "./EventList";
import WithLoading from "./WithLoading";
import EventFetcher from "./EventFetcher";

import { TagCloud } from "react-tagcloud";
import IntervalTree from '@flatten-js/interval-tree';
import { DateTime } from "luxon";

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const EventListWithLoading = WithLoading(EventList);

class App extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      conflictedEvents: [],
      eventsConflicting: [],
      events: [],
      eventCount: 0,
      loading: true
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

  addEvents = ({newEvents, responseTz}) => {
    this.setState((state, props) => {
      let events = state.events.concat(newEvents)
      let intervals = new IntervalTree();

      events.forEach((event) => {
        event.conflicts = [];
        let start = this.toMillis(event, 'start', responseTz)
        let end = this.toMillis(event, 'end', responseTz)
        let interval = [start, end - 1];
        event.start.ms = start;
        event.end.ms = end;
        intervals.search(interval).forEach( (e) => {
          event.conflicts.push(e.id);
          e.conflicts.push(event.id);
        });

        intervals.insert(interval, event);
      });

      let conflictedEvents = events.filter(e => {return e.conflicts.length > 0;});

      return {
        loading: false,
        events: events,
        conflictedEvents: conflictedEvents,
        intervals: intervals,
        eventCount: events.length,
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

  render() {
    const tags = {};

    const { eventsConflicting, conflictedEvents, eventCount, events } = this.state;

    conflictedEvents.forEach((e) => {
      //  [A-Za-z0-9 \-_.\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]

        e.summary.split(/[^A-Za-z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/).forEach((u) => {
            const count = tags[u] || 0;
            tags[u] = count + 1;
        });
    });

    delete tags[""];

    const data = []
    Object.keys(tags).forEach((key) => {
      const count = tags[key];
      if (count > 5 ) {
        data.push({value: key, count: tags[key]})
      }
    });

    const SimpleCloud = () => (
      <TagCloud minSize={12}
                maxSize={35}
                tags={data}
                onClick={tag => alert(`'${tag.value}' was selected!`)} />
    );

    return (<div>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <EventListWithLoading
          onClick={(e, event) => this.handleEventClick(e, event)}
          isLoading={this.state.loading}
          events={conflictedEvents}
          eventCount={eventCount}
          title="Events With Conflicts"/>
        </Grid>
        <Grid item xs={6}>
          <EventListWithLoading isLoading={this.state.loading} events={eventsConflicting} eventCount={eventCount} title="Conflicts"/>
        </Grid>
      </Grid>
    </div>);
  }
}

export default App;
