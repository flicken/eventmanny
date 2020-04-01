
import { CALENDAR_ID, GOOGLE_CLIENT_ID } from "./config.js";

class EventFetcher {

  fetch({callback}) {
    if (!window.gapi.client) {
      console.log("Loading gapi client")
      let initAndFetchEvents = () => this.initClient().then(() => this.start(callback))
      window.gapi.load("client", initAndFetchEvents);
    } else {
      console.log("Gapi client already loaded")
    }
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
                     ',start,end,extendedProperties)'
          }
    this.nextPage({request, callback, count: 0})
  }

  initClient = () => {
    var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
    var SCOPES = "https://www.googleapis.com/auth/calendar";

    return window.gapi.client
      .init({
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
