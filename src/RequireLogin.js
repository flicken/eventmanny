import React from 'react';

import { GOOGLE_CLIENT_ID } from "./config.js";
import { GoogleLogin } from 'react-google-login';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly profile email"

export default function ({isSignedIn, children, onSuccess, onFailure}) {

  if (isSignedIn) {
    return children || <></>;
  } else {
    return <GoogleLogin
        clientId={GOOGLE_CLIENT_ID}
        buttonText="Login"
        onSuccess={onSuccess}
        onFailure={onFailure}
        isSignedIn={true}
        scope = {SCOPES}
        discoveryDocs = {DISCOVERY_DOCS}
        cookiePolicy={'single_host_origin'}
      />
  }
}
