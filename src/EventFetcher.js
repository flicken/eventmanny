
import { CALENDAR_ID, GOOGLE_API_KEY,  GOOGLE_CLIENT_ID, } from "./config.js";

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

  fetch({callback}) {
    this.ensureAuthenticated().then(() => this.start(callback))
  }

  start = (callback) => {
    let request = {
          'calendarId': CALENDAR_ID,
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'startTime',
          'fields': 'nextPageToken,etag,timeZone,summary'+
                     ',items(etag,id,htmlLink,summary,description'+
                     ',start,end,updated,created,extendedProperties)'
          }
    this.nextPage({request, callback, count: 0})
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
        window.gapi.load("auth2:client", resolve);
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
    var SCOPES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events profile"

    return window.gapi.client
      .init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      })
  };

  nextPage = ({request, callback, count}) => {
    window.gapi.client.calendar.events.list(request).then((response) => {
        let responseTz = response.result.timeZone;
        let newEvents = response.result.items;
        let totalEventCount = count + newEvents.length
        let hasMore = !!response.result.nextPageToken

        console.log("Got new events: " + newEvents.length);

        callback({
          loading: false,
          newEvents,
          totalEventCount,
          responseTz,
          hasMore,
        });

        if (response.result.nextPageToken) {
          console.log("Fetching next page");
          this.nextPage({request: {
              ...request,
              pageToken: response.result.nextPageToken
            },
            callback,
            count: totalEventCount});
        } else {
          console.log("Done, no more pages");
          console.log(response.result.nextPageToken);
        }
      })
    }
}

export default EventFetcher;
