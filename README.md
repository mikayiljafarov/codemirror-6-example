# Codemirror6

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
# codemirror-6-example
Angular Language servise
Git History
Git lens
IntelliSense for CSS class names in HTML
Prettier - Code fromatter

>npm install @codemirror/basic-setup @codemirror/view @codemirror/state @codemirror/language @codemirror/lang-sql @codemirror/commands @codemirror/autocomplete @codemirror/gutter @codemirror/history @codemirror/fold @codemirror/highlight @codemirror/matchbrackets @codemirror/closebrackets @codemirror/comment

{
  "key": "cmd+space",
  "command": "editor.action.triggerSuggest",
  "when": "editorHasCompletionItemProvider && textInputFocus && !editorReadonly"
}

{
  "key": "cmd+e",
  "command": "workbench.action.quickOpen"
}

{
  "key": "cmd+up",
  "command": "editor.action.moveLinesUpAction",
  "when": "editorTextFocus && !editorReadonly"
}

{
  "key": "cmd+down",
  "command": "editor.action.moveLinesDownAction",
  "when": "editorTextFocus && !editorReadonly"
}