# Requests list

The ARC requests list module contains an UI and logic to render requests list in various contexts (saved list. history list, project list).

This module replaces:

- [x] history-list-mixin
- [x] requests-list-mixin
- [x] saved-list-mixin
- [x] projects-list-consumer-mixin
- history-panel
- saved-requests-panel

Work in progress.

TODO:

- create a component that combines all logic and ui r4elated to handling saved requests (arc-saved-request)
  - saved-request-detail
  - saved-request-editor
- redesign search experience to provide a single point of searching for:
  - history
  - saved
  - projects
  - API projects
