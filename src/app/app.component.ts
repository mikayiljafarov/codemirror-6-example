import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {MySQL, PostgreSQL, sql} from "@codemirror/lang-sql";
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { Text } from '@codemirror/state';
import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import { gutter } from '@codemirror/gutter';
import { foldedRanges } from '@codemirror/fold';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('texteditor') texteditor: any = null;

  view!: EditorView;

  ngAfterViewInit() {
    this.view = new EditorView({
      state: EditorState.create({extensions: [
        basicSetup,
        keymap.of([
        {
          key: 'Tab',
          run: acceptCompletion
        },
        indentWithTab,
      ]),
        sql({
          schema: {
            'table1': [
              {
                label: 'col-1',
                detail: 'Details',
                info: 'Documentation',
                type: 'column'
              }
            ]
          },
          upperCaseKeywords: true
        }),
        gutter({class: 'cm-selected-gutter'})
      ]}),
      parent: this.texteditor.nativeElement
    });
  }

  getSelection() {
    const range = this.view.state.selection.main;
    console.log(range);

    const selection = this.view.state.sliceDoc(range.from, range.to);
    console.log(selection);

    console.log(this.view.state.doc.toJSON());
  }
}
