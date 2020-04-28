import { createSlice } from '@reduxjs/toolkit'

const emptyState = {
    isSignedIn: false
}


const sessionSlice = createSlice({
  name: 'session',
  initialState: emptyState,
  reducers: {
    onLoginSuccess(state, action) {
      console.log("Logged in")
      console.log(action)
      state.isSignedIn = true
      state.signInError = null
      state.auth = action.payload
      
    },

    onLogoutSuccess(state, action) {
      return emptyState
    },

    onLoginFailure(state, action) {
      console.log(`Error logging in ${action}`)
      return {isSignedIn: false, signInError: action.payload}
    },
  }
})

export const {onLoginSuccess, onLogoutSuccess, onLoginFailure} = sessionSlice.actions

export default sessionSlice
