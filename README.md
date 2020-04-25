Event Manny
===========

Bring a bit of structure to your chaotic schedule.

Features
--------
 * Create: Easy entering of multiple events
 * Conflicts: See conflicts for recently entered events
 * Recent updates: See recent updates for events in the next month.
     This is to support syncing recent changes to a paper calendar

TODO
----
 * Select (multiple) calendars
 * Grouping of events (e.g. concert series or rehearsals that are related,
      but not regularly scheduled)
 * Easy exception handling (e.g. school is out, so no regularly scheduled
      events)
 * Attach image to events / series (e.g. picture of poster for concert series)
 * Even easier entering of series (e.g. concert series that has mostly the
     same info,  but different dates, times, location, headline acts, etc)
 * A better way to mix-and-match creating, seeing conflicts, seeing updates, grouping, etc.
   Possibly as a command interface.  E.g. be able to type:
   * "updates since last Tuesday [until the end of the month]" or
   * "conflicts for choir events" or
   * "new schedule Le Nozze di Figaro" or
   * "show schedule Tae Kwon Do" or
   * "updates to choir schedule"


TECHNICAL TODO
--------------
 * Refactor into smaller, testable components
 * Better state handling + event fetching
 * Unit testing of components
 * End-to-end testing
 * Implement as a CLUI, see https://blog.repl.it/clui or https://github.com/IBM/kui
