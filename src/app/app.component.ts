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
import { timer } from 'rxjs';

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

  selection: { from: number, to: number }[] = [];

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

          // EditorView.updateListener.of((vu) => {
          //   const pos = vu.state.selection.main.from;
          //   let token = syntaxTree(vu.state).resolve(pos, -1);
          //   console.log(token);

          //   // token = syntaxTree(vu.state).resolveInner(pos, -1);

          //   while (token?.parent && token.name !== 'Statement' ) {
          //     token = token.parent;
          //   }

          //   const a = {
          //     from: token.from,
          //     to: token.to,
          //     selection: vu.state.sliceDoc(token.from, token.to)
          //     // line: vu.state.doc.lineAt(token.from)
          //   }
          //   console.log(token);
          //   // console.log(a.selection);
          // }),

          EditorView.updateListener.of((vu) => {
            console.clear();
            // const length = vu.state.doc.length;
            // const lines = vu.state.doc.lines;
            // console.log('length => ', length);
            // console.log('lines => ', lines);

            const main = vu.state.selection.main;
            // this.selection = vu.state.selection.ranges.filter(r => r.from < r.to).map(r => ({ from: r.from, to: r.to }));
            this.selection = main.from < main.to ? [{ from: main.from, to: main.to }] : [];
            if (this.selection.length) {
              console.log(this.selection);
              this.selection.map(s => (console.log(vu.state.sliceDoc(s.from, s.to))));
              return;
            }

            let token = syntaxTree(vu.state).resolve(main.from, 1);
            if ((token as any).index === 0) {
              token = syntaxTree(vu.state).resolve(main.from, -1);
            }
            // console.log('Current => ', token.type.name, token.from, token.to);
            // console.log(token.type);
            while (token?.parent && token.type.name !== 'Statement') {
              token = token.parent;
              // console.log(token.type);
            }

            if (token.name === 'Statement') {
              this.selection = [{ from: token.from, to: token.to }];
              this.selection.map(s => (console.log(vu.state.sliceDoc(s.from, s.to))));
            }

            console.log(this.selection.length);
          }),

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
    console.log(range, selection);

    const lineStart = this.view.state.doc.lineAt(range.from);
    const lineEnd = this.view.state.doc.lineAt(range.to);
    console.log(lineStart, lineEnd);
  }

  getFoldedRanges() {
    foldAll(this.view);

    const rangeSet = foldedRanges(this.view.state).iter(0);

    const foldableRanges: { range: number[], selection?: string }[] = [];

    while (rangeSet.to !== rangeSet.from) {
      const line = this.view.state.doc.lineAt(rangeSet.from);
      console.log(line);

      foldableRanges.push({
        range: [line.from, rangeSet.to],
      });

      rangeSet.next();
    }
    unfoldAll(this.view);

    for (let i = 0; i < foldableRanges.length; i++) {
      const r = foldableRanges[i];
      r.selection = this.view.state.sliceDoc(r.range[0], r.range[1]);
    }

    console.log(foldableRanges);
  }

  getFoldable() {
    const rangeSet = foldable(this.view.state, 5, 14);
    console.log(rangeSet);
  }

  getTree() {
    // console.log(this.view.state);

    const tree = syntaxTree(this.view.state);
    console.log(tree);

    // const tree2 = ensureSyntaxTree(this.view.state, this.view.state.doc.length, 3000);
    // console.log(tree2);

  }
}