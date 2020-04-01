import React from 'react';
import './App.css';

import { CALENDAR_ID, GOOGLE_CLIENT_ID } from "./config.js";
import EventList from "./EventList";
import WithLoading from "./WithLoading";


import { TagCloud } from "react-tagcloud";
import { DateTime } from "luxon";
import IntervalTree from '@flatten-js/interval-tree';


const EventListWithLoading = WithLoading(EventList);

class App extends React.Component{
  constructor(props) {
    super(props)
    this.state = { events: [], eventCount: 0, loading: true};
  }

  componentDidMount = () => {
    this.setState({ loading: true });
    // 1. Load the JavaScript client library.
    window.gapi.load("client", this.initClient);
  }

  initClient = () => {
    var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
    var SCOPES = "https://www.googleapis.com/auth/calendar";

    // 2. Initialize the JavaScript client library.
    window.gapi.client
      .init({
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      })
      .then(() => {
        // 3. Initialize and make the API request.
        this.getEvents();
    });
  };

  nextPage(nextPageToken, count){
    let that = this;
    console.log(nextPageToken)
    window.gapi.client.calendar.events.list({
          'calendarId': CALENDAR_ID,
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'startTime',
          'fields': 'nextPageToken,etag,timeZone,summary'+
                     ',items(etag,id,htmlLink,summary,description'+
                     ',start,end,extendedProperties)',
          'pageToken': nextPageToken,
          'q': this.state.searchTerm
        }).then( (response) => {

      let responseTz = response.result.timeZone;
      let toMillis = (event, fieldName) => {
        let value = event[fieldName];
        return DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz }).ts
      };

      let events = nextPageToken ?
        this.state.events.concat(response.result.items) :
        response.result.items;
      let intervals = new IntervalTree();

      events.forEach((event) => {
        event.conflicts = [];
        let start = toMillis(event, 'start')
        let end = toMillis(event, 'end')
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

      console.log("Got event count: " + events.length);
      console.log("Events with conflicts count: " + conflictedEvents.length);
      that.setState({
        loading: false,
        allEvents: events,
        events: conflictedEvents,
        intervals: intervals,
        eventCount: events.length,
      }, ()=>{
        //console.log(that.state.events);
        if (response.result.nextPageToken) {
          this.nextPage(response.result.nextPageToken)
        } else {
          console.log("Skipping ")
          console.log(response.result.nextPageToken)
        }
      });
    }, (reason) => {
      console.log(reason);
    });
  }

  getEvents() {
    this.nextPage()
  }

  doSearch = (event) => {
    console.log("Want to search for '"+event.target.value+"'")
    this.setState({searchTerm: event.target.value},
       this.getEvents);
  }



  render() {
    const tags = {};

    const { events, eventCount } = this.state;

    events.forEach((e) => {
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

    console.log("tags");
    console.log(tags);
    console.log(data);

    const SimpleCloud = () => (
      <TagCloud minSize={12}
                maxSize={35}
                tags={data}
                onClick={tag => alert(`'${tag.value}' was selected!`)} />
    );

    return (<div>
      <SimpleCloud/>
      <EventListWithLoading isLoading={this.state.loading} events={events} eventCount={eventCount} title="Conflicts"/>
    </div>);
  }
}

export default App;
