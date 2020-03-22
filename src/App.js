import React from 'react';
import './App.css';

import { CALENDAR_ID, GOOGLE_CLIENT_ID } from "./config.js";

import { TagCloud } from "react-tagcloud";

import { DateTime } from "luxon";

import IntervalTree from '@flatten-js/interval-tree'

class App extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      events: [],
      eventCount: 0,
    }
  }

  componentDidMount = () => {
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

  getEvents() {
    let that = this;
    window.gapi.client.calendar.events.list({
          'calendarId': CALENDAR_ID,
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 1500,
          'orderBy': 'startTime',
          'fields': 'nextPageToken,etag,timeZone,summary'+
                     ',items(etag,id,htmlLink,summary,description'+
                     ',start,end,extendedProperties)',
          'q': this.state.searchTerm
        }).then( (response) => {


      let responseTz = response.result.timeZone;
      let toMillis = (event, fieldName) => {
        let value = event[fieldName];
        return DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz }).ts
      };

      let events = response.result.items
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
        events: conflictedEvents,
        intervals: intervals,
        eventCount: events.length,
      }, ()=>{
        console.log(that.state.events);
      });
    }, (reason) => {
      console.log(reason);
    });
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

    let eventsList = <ul>
     {events.length} / {eventCount} events has conflicts
     { events.map((event) => {
      return (
        <li key={event.id}>
        {event.conflicts.length} - {event.summary}{" "}
          (<a
            href={event.htmlLink}
            target="_blank" rel="noopener noreferrer"
          >
            {DateTime.fromMillis(event.start.ms).toFormat("h:mm a").toString()},{" "}
            {DateTime.fromMillis(event.end.ms).diff(
                  DateTime.fromMillis(event.start.ms),
                  "minutes"
                ).toFormat("mm")}{" "}
            minutes, {DateTime.fromMillis(event.start.ms).toFormat("MMMM Do")}{" "}
            </a>)
          </li>
      );
    }) }
    </ul>;

    let emptyState = (
      <div className="empty">
        <h3>
        Empty
        </h3>
      </div>
    );

    let loadingState = (
      <div className="loading">
        Loading...
      </div>
    );

    return (
      <div className="container">
      <form>
        <input type="text" placeholder="Search" onChange={this.doSearch}/>
      </form>

        <div>
          <SimpleCloud/>
          <h1>Upcoming Conflicts</h1>
          <div>
            {this.state.isLoading && loadingState}
            {events.length > 0 && eventsList}
            {this.state.isEmpty && emptyState}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
