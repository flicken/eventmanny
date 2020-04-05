
import { CALENDAR_ID,  GOOGLE_CLIENT_ID, } from "./config.js";
import { DateTime } from "luxon";

class EventFetcher {

  constructor(props) {
    this.isSignedOnCallback = props && props.isSignedOnCallback
  }

  insert(event, callback) {
    const request = window.gapi.client.calendar.events.insert({
      'calendarId': CALENDAR_ID,
      'resource': event
    });

    request.execute(function(e) {
      callback(e)
    });
  }

  delete(event, callback) {
    const request = window.gapi.client.calendar.events.delete({
      'calendarId': CALENDAR_ID,
      'eventId': event.id
    });

    request.execute(function(e) {
      callback(e)
    });
  }

  fetch({callback}) {
    this.ensureAuthenticated().then(() => this.start(callback, "events"))
  }

  fetchUpdatedIdsOnly({callback, since}) {
    let now = new DateTime({})
    let aBitLater = now.plus({days: 3})
    let timeMax = aBitLater.plus({month: 1}).startOf("month")
    console.log(`Finding updates for events from ${now} to ${timeMax} since ${since}`)
    console.log(since)
    let request = {
          'calendarId': CALENDAR_ID,
          'timeMin': now.toISO(),
          'timeMax': timeMax.toISO(),
          'updatedMin': since.toISO(),
          'showDeleted': true,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'updated',
          'fields': 'nextPageToken,etag'+
                     ',items(id)'
          }

    this.ensureAuthenticated()
      .then(() => this.nextPage({request, callback, count: 0, name: "updates"}))
  }

  start = (callback, name) => {
    let request = {
          'calendarId': CALENDAR_ID,
          'timeMin': new DateTime({}).toISO(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'startTime',
          'fields': 'nextPageToken,etag,timeZone,summary'+
                     ',items(etag,id,htmlLink,summary,description'+
                     ',start,end,updated,created,extendedProperties)'
          }
    this.nextPage({request, callback, count: 0, name: name})
  }

  initSignedOnCallback = () => {
    let isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn
    if (!isSignedIn.get()) {
      window.gapi.auth2.getAuthInstance().signIn();
    }
    if (this.isSignedOnCallback) {
      this.isSignedOnCallback(isSignedIn.get())
      isSignedIn.listen(this.isSignedOnCallback)
    }
  }

  ensureAuthenticated = (callback) => {
    if (!window.gapi.client || window.gapi.auth2) {
      console.log("loading client")
      const promise = new Promise(function(resolve, reject) {
        try {
          window.gapi.load("auth2:client", resolve);
        } catch(e) {
          reject(e)
        }
      });

      return promise
        .then(() => this.initClient())
        .then(() => this.initSignedOnCallback());
    } else {
      console.log("Gapi client already loaded")
      return this.initClient()
        .then(() => this.initSignedOnCallback());
    }
  }


  initClient = () => {
    var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
    var SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly"

    return window.gapi.client
      .init({
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      })
  };

  nextPage = ({request, callback, count, name}) => {
    window.gapi.client.calendar.events.list(request).then((response) => {
        let responseTz = response.result.timeZone;
        let newEvents = response.result.items;
        let totalEventCount = count + newEvents.length
        let hasMore = !!response.result.nextPageToken

        console.log(`Got new ${name} events: ${newEvents.length}`);

        callback({
          loading: false,
          newEvents,
          totalEventCount,
          responseTz,
          hasMore,
        });

        if (response.result.nextPageToken) {
          console.log(`Fetching next ${name} page`);
          this.nextPage({request: {
              ...request,
              pageToken: response.result.nextPageToken
            },
            callback,
            count: totalEventCount,
            name: name});
        } else {
          console.log(`Done, no more ${name} pages`);
          console.log(response.result.nextPageToken);
        }
      })
    }
}

export default EventFetcher;
