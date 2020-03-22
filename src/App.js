import React from 'react';
import './App.css';

import moment from "moment";

import { CALENDAR_ID, GOOGLE_CLIENT_ID } from "./config.js";

import { TagCloud } from "react-tagcloud";

class App extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      events: []
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
          'maxResults': 100,
          'orderBy': 'startTime',
          'q': this.state.searchTerm
        }).then( (response) => {

      let events = response.result.items
      console.log("Got event count: " + events.length);
      that.setState({
        events
      }, ()=>{
        console.log(that.state.events);
      })
    }, function(reason) {
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

    const { events } = this.state;

    events.forEach(function(e) {
      //  [A-Za-z0-9 \-_.\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]

        e.summary.split(/[^A-Za-z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/).forEach(function(u) {
            const count = tags[u] || 0;
            tags[u] = count + 1;
        });
    });

    const data = []
    Object.keys(tags).forEach(function(key) {
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

    let eventsList = <ul> { events.map(function(event) {
      return (
        <li key={event.id}>
        {event.summary}{" "}
          (<a
            href={event.htmlLink}
            target="_blank"
	    rel="noopener noreferrer"
          >
            {moment(event.start.dateTime).format("h:mm a")},{" "}
            {moment(event.end.dateTime).diff(
                  moment(event.start.dateTime),
                  "minutes"
                )}{" "}
            minutes, {moment(event.start.dateTime).format("MMMM Do")}{" "}
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
          <h1>Upcoming Events</h1>
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
