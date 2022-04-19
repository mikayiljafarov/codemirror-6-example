import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { MySQL, PostgreSQL, MSSQL, sql, keywordCompletion, SQLDialect, StandardSQL, schemaCompletion } from '@codemirror/lang-sql';
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view';
import { indentWithTab, selectSyntaxRight, selectGroupForward, selectLineBoundaryForward, selectParentSyntax } from '@codemirror/commands';
import { Text } from '@codemirror/state';
import { startCompletion, acceptCompletion, autocompletion } from '@codemirror/autocomplete';

import { lineNumbers } from '@codemirror/gutter';
import { history } from '@codemirror/history';
import { foldAll, unfoldAll, foldCode, foldedRanges, foldGutter } from '@codemirror/fold';
import { syntaxTree, foldService, foldable, ensureSyntaxTree, indentOnInput } from '@codemirror/language';
import { defaultHighlightStyle, tags, HighlightStyle } from '@codemirror/highlight';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets } from '@codemirror/closebrackets';
import { CompletionContext, currentCompletions } from "@codemirror/autocomplete";
import { gutter, highlightActiveLineGutter } from '@codemirror/gutter';
import { ICompletion, query1 } from './queries';

// const myHighlightStyle = HighlightStyle.define([
//   { tag: tags.keyword, color: "#10ebd8" },
//   { tag: tags.comment, color: "#f5d", fontStyle: "italic" }
// ])


const WORDS = ['SELECT', 'UPDATE', 'ALTER', 'DROP', 'FROM', 'DATABASE', 'TABLE', 'VIEW', 'WHERE', 'JOIN', 'GROUP', 'ORDER', 'BY', 'ASC', 'DISTINCT', 'DESC', 'HAVING', 'COUNT', 'NULL', 'LIKE', 'LIMIT'];

const customExt: any = schemaCompletion({
  tables: [
    {
      label: 'table1',
      detail: 'Table detail',
      info: 'Table info',
      type: 'table',
      boost: 99
    }
  ],
  schema: {
    table1: [
      {
        label: 'col-1',
        detail: 'Column detail',
        info: 'Column info',
        type: 'column',
        boost: 99
      },
    ],
  },
});

function myCompletions(context: CompletionContext): any {
  // let word = context.matchBefore(/\w*/);
  // console.log(context.explicit, word);
  // if ((word && word?.from == word?.to && !context.explicit)) {
  //   return {
  //     from: word?.from,
  //     options: WORDS.map((w, i) => ({ label: w, type: "variable", boost: (-1 * i) }))
  //   };
  // }

  const baseExt: any = keywordCompletion(StandardSQL, true);
  const base: ICompletion = baseExt.value.autocomplete(context);

  const custom: ICompletion = customExt.value.autocomplete(context);

  // console.log(base, custom);

  if (base?.options) {
    for (let i = 0; i < base.options.length; i++) {
      if (WORDS.includes(base.options[i].label)) {
        base.options[i].boost = 98;
      }
    }
    base.options.push(...custom.options);
    return base;
  }
  return custom;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {

  @ViewChild('texteditor') texteditor: any = null;

  view!: EditorView;

  ngAfterViewInit() {
    this.view = new EditorView({
      state: EditorState.create({
        doc: query1,
        extensions: [
          keymap.of([
            {
              mac: 'Mod-Space',
              run: startCompletion
            },
            {
              key: 'Tab',
              run: acceptCompletion,
            },
            indentWithTab
          ]),
          gutter({ class: "cm-mygutter" }),
          autocompletion({ override: [myCompletions] }),
          sql(),

          basicSetup,

          // lineNumbers(),

          // history(),

          // foldGutter(),

          // indentOnInput(),

          // defaultHighlightStyle.extension,

          // bracketMatching(),
          // closeBrackets(),

          // highlightActiveLine(),
          // highlightActiveLineGutter()
        ],
      }),
      parent: this.texteditor.nativeElement,
    });
  }

  getSelection() {
    const range = this.view.state.selection.main;

    const selection = this.view.state.sliceDoc(range.from, range.to);
    const line = this.view.state.doc.lineAt(range.from);

    console.log(currentCompletions(this.view.state))

    const foldableRanges = this.getFoldedRanges();
  }

  getFoldedRanges() {
    const rangeSet = foldedRanges(this.view.state).iter(0);

    const foldableRanges = <any>[];

    while (rangeSet.to !== rangeSet.from) {
      const line = this.view.state.doc.lineAt(rangeSet.from);

      foldableRanges.push({
        range: [line.from, rangeSet.to],
        selected: false
      });

      rangeSet.next();
    }

    unfoldAll(this.view);

    return foldableRanges;
  }
}