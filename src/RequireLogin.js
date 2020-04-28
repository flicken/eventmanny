import React from 'react'

import { GOOGLE_CLIENT_ID } from "./config.js"
import { GoogleLogin, GoogleLogout } from 'react-google-login'
import { connect } from 'react-redux'

import {onLoginSuccess, onLoginFailure, onLogoutSuccess} from "./redux/sessionSlice"

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]

// const CALENDAR_READONLY = "https://www.googleapis.com/auth/calendar.readonly"
const EVENTS_READONLY = "https://www.googleapis.com/auth/calendar.events.readonly"
const EVENTS_READWRITE = "https://www.googleapis.com/auth/calendar.events"
const SCOPES = [
//  CALENDAR_READONLY, // not needed until feature for selecting calendar
  EVENTS_READONLY,
  EVENTS_READWRITE,
  "profile",
  "email"].join(" ")


const mapStateToProps = (state, props) => {
  return {
    isSignedIn: state.session.isSignedIn
  }
}

const mapDispatchToProps = (dispatch) => {
    return {
      onSuccess: e => {
        dispatch(onLoginSuccess({token: e.tokenObj, profile: e.profileObj}))
      },
      onFailure: e => dispatch(onLoginFailure(e)),
      onLogoutSuccess: e => dispatch(onLogoutSuccess(e))
    }
}

function RequireLogin({isSignedIn, children, callback, onSuccess, onFailure, onLogoutSuccess, showLogout}) {
  if (isSignedIn) {
    if (showLogout) {
      return <GoogleLogout
          clientId={GOOGLE_CLIENT_ID}
          buttonText="Logout"
          onLogoutSuccess={onLogoutSuccess}>{children}
      </GoogleLogout>
    } else {
      return children || <></>
    }
  } else {
    return <GoogleLogin
        clientId={GOOGLE_CLIENT_ID}
        buttonText="Login"
        onSuccess={e => {onSuccess(e); callback && callback(e)}}
        onFailure={onFailure}
        isSignedIn={true}
        scope = {SCOPES}
        discoveryDocs = {DISCOVERY_DOCS}
        cookiePolicy={'single_host_origin'}
      />
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(RequireLogin)
