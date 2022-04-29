import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { basicSetup } from '@codemirror/basic-setup';
import { EditorView } from "@codemirror/view";
import { EditorState, StateEffect } from "@codemirror/state";
import { keymap, highlightActiveLine, ViewUpdate } from '@codemirror/view';
import { sql, keywordCompletion, StandardSQL, schemaCompletion } from '@codemirror/lang-sql';
import { indentWithTab } from '@codemirror/commands';
import { startCompletion, acceptCompletion, autocompletion } from '@codemirror/autocomplete';

import { lineNumbers, GutterMarker } from '@codemirror/gutter';
import { history, undo, redo } from '@codemirror/history';
import { foldGutter } from '@codemirror/fold';
import { syntaxTree, indentOnInput } from '@codemirror/language';
import { defaultHighlightStyle } from '@codemirror/highlight';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets } from '@codemirror/closebrackets';
import { CompletionContext } from "@codemirror/autocomplete";
import { gutter, highlightActiveLineGutter } from '@codemirror/gutter';
import { ICompletion, query1, query2 } from './queries';


import { toggleComment } from '@codemirror/comment';

const WORDS = ['SELECT', 'SET', 'UPDATE', 'ALTER', 'DROP', 'FROM', 'DATABASE', 'TABLE', 'VIEW', 'WHERE', 'JOIN', 'GROUP', 'ORDER', 'BY', 'ASC', 'DISTINCT', 'DESC', 'HAVING', 'COUNT', 'NULL', 'LIKE', 'LIMIT'];

const COLUMNS = {
  table1: [...Array(6)].map((_, i) => ({ label: `col1_${i}`, boost: 98, type: 'column' })),
  table2: [...Array(6)].map((_, i) => ({ label: `col2_${i}`, boost: 98, type: 'column' })),
  table3: [...Array(6)].map((_, i) => ({ label: `col3_${i}`, boost: 98, type: 'column' })),
  table4: [...Array(6)].map((_, i) => ({ label: `col_${i}`, boost: 98, type: 'column' }))
}
const TABLES = Object.keys(COLUMNS);

function myCompletions(context: CompletionContext): any {
  console.clear();
  console.log(context);
  console.log(COLUMNS);

  // let word = context.matchBefore(/Select | SELECT /);
  // console.log(word);
  // if ((word && word?.from !== word?.to)) {
  //   console.log('---ok---');

  //   return {
  //     from: word.to,
  //     options: [
  //       { label: "match", type: "keyword" },
  //       { label: "hello", type: "variable", info: "(World)" },
  //       { label: "magic", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro" }
  //     ]
  //     // options: [
  //     //   { label: "*", type: "keyword", boost: 99 },
  //     //   { label: "DISTINCT", type: "keyword", boost: 99 }
  //     // ]
  //     // options: WORDS.map((w, i) => ({ label: w, type: "variable", boost: (-1 * i) }))
  //   };
  // }

  // const customExt: any = schemaCompletion({
  //   tables: TABLES.map(t => ({ label: t, boost: 99 })),
  //   defaultTable: TABLES[0],
  //   schema: COLUMNS
  // })

  const customExt: any = schemaCompletion({
    tables: TABLES.map(t => ({ label: t, boost: 98, type: 'table' })),
    defaultTable: TABLES[0],
    schema: COLUMNS
  });

  console.log(customExt);

  const custom: ICompletion = customExt.value.autocomplete(context);

  const baseExt: any = keywordCompletion(StandardSQL, true);
  const base: ICompletion = baseExt.value.autocomplete(context);

  console.table(custom?.options);
  console.log(base);

  if (custom && base) {
    for (let i = 0; i < base.options.length; i++) {
      if (WORDS.includes(base.options[i].label)) {
        base.options[i].boost = 9
      }
    }
    base.options.push(...custom.options);
    return base;
  }

  return base || custom;
}

const emptyMarker = new class extends GutterMarker {
  override toDOM() { return document.createTextNode('') }
  override elementClass = 'my-test';
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

  onSubmit(view: EditorView): boolean {
    console.log(view);
    StateEffect.appendConfig.of
    return false;
  }

  ngAfterViewInit() {
    const self = this;
    this.view = new EditorView({
      state: EditorState.create({
        doc: 'Select * from table1',
        extensions: [
          // basicSetup,
          lineNumbers(),

          history(),

          indentOnInput(),

          defaultHighlightStyle.extension,

          bracketMatching(),
          closeBrackets(),
          //

          highlightActiveLine(),
          highlightActiveLineGutter(),

          keymap.of([
            {
              mac: 'Mod-Space',
              run: startCompletion
            },
            {
              key: 'Tab',
              run: acceptCompletion,
            },
            {
              key: 'Mod-/',
              run: toggleComment,
            },
            {
              key: 'Mod-z',
              run: undo,
            },
            {
              key: 'Mod-Shift-z',
              run: redo,
            },
            {
              key: 'Mod-Enter',
              run: self.onSubmit,
            },
            indentWithTab
          ]),


          autocompletion({ override: [myCompletions] }),
          sql(),

          gutter({
            class: "cm-my-gutter",
            lineMarkerChange(update) {
              return self.findActiveQuery(update);
            },
            lineMarker(view, line) {
              if (self.selection.some(s => (line.from >= s.from && line.from <= s.to))) {
                return emptyMarker;
              }
              return null;
            },
            initialSpacer: () => emptyMarker
          }),
          foldGutter()
        ]
      }),
      parent: this.texteditor.nativeElement,
    });
  }

  findActiveQuery(view: ViewUpdate): boolean {
    this.selection = [];
    const self = this;
    const main = view.state.selection.main;

    if (main.from < main.to) {
      syntaxTree(view.state).iterate({
        enter(type, from_, to_, get_) {
          console.log(from_, to_, type, get_());
          if (type.name === 'Statement') {
            const from = main.from <= from_ ? from_ : main.from;
            const to = main.to >= to_ ? to_ : main.to;
            if (from < to) {
              self.selection.push({ from, to });
            }
          }
        }
      });
      // this.recursive(syntaxTree(view.state).resolve(0, -1).firstChild, view.state.selection.main);
    } else {
      let token = syntaxTree(view.state).resolve(main.from, 1);
      // console.log(token);
      // Only TreeNode class has index property
      if ((token as any).index === 0) {
        token = syntaxTree(view.state).resolve(main.from, -1);
      }
      // console.log('Current => ', token.type.name, token.from, token.to);
      // console.log(token.type);
      while (token?.parent && token.type.name !== 'Statement') {
        token = token.parent;
        // console.log(token.type);
      }

      if (token.name === 'Statement') {
        this.selection = [{ from: token.from, to: token.to }];
      }
    }

    // this.selection.map(s => (console.log(view.state.sliceDoc(s.from, s.to))));
    // console.log(this.selection);

    return true;
  }
}


// const myHighlightStyle = HighlightStyle.define([
//   { tag: tags.keyword, color: "#10ebd8" },
//   { tag: tags.comment, color: "#f5d", fontStyle: "italic" }
// ])


// function validationErrorMarker(): any {
//   let diagnostics = [];
//   diagnostics.push({
//     from: 70, to: 76,
//     severity: "error",
//     message: `Invalid type. Expected Integer, Null but got String.`
//   });
//   return diagnostics
// }
// // linter(validationErrorMarker),
// // lintGutter()



// findQueriesFromSelections2(view: ViewUpdate): boolean {
//   console.clear();

//   this.selection = [];

//   const main = view.state.selection.main;

//   if (main.from < main.to) {
//     const from = main.from;
//     const to = main.to;
//     console.log(from, to);


//     let bufferNode = syntaxTree(view.state).resolve(0, -1).firstChild;

//     if (bufferNode) {

//       if (bufferNode.type?.name === 'Statement') {
//         const from = main.from <= bufferNode.from ? bufferNode.from : main.from;
//         const to = main.to >= bufferNode.to ? bufferNode.to : main.to;

//         console.log(bufferNode.type.name, bufferNode.from, bufferNode.to, '=>', from, to);

//         this.selection.push({ from, to });
//       }

//       while (bufferNode?.nextSibling) {
//         bufferNode = bufferNode.nextSibling;


//         if (bufferNode.type.name === 'Statement') {
//           const from = main.from <= bufferNode.from ? bufferNode.from : main.from;
//           const to = main.to >= bufferNode.to ? bufferNode.to : main.to;

//           console.log(bufferNode.type.name, bufferNode.from, bufferNode.to, '=>', from, to);

//           this.selection.push({ from, to });
//         }
//       }

//     }

//     this.selection.map(s => (console.log(view.state.sliceDoc(s.from, s.to))));
//   } else {
//     return true;
//   }
//   return true;
// }



// getAllQueryFromDoc(view: ViewUpdate): boolean {
//   console.clear();

//   this.selection = [];

//   let bufferNode = syntaxTree(view.state).resolve(0, -1).firstChild;

//   if (bufferNode) {
//     console.log(bufferNode.type.name, bufferNode.from, bufferNode.to);

//     if (bufferNode.type?.name === 'Statement') {
//       this.selection.push({ from: bufferNode.from, to: bufferNode.to });
//     }

//     while (bufferNode?.nextSibling) {
//       bufferNode = bufferNode.nextSibling;

//       if (bufferNode.type.name === 'Statement') {
//         this.selection.push({ from: bufferNode.from, to: bufferNode.to });
//       }
//       console.log(bufferNode.type.name, bufferNode.from, bufferNode.to);
//     }

//   }

//   this.selection.map(s => (console.log(s), console.log(view.state.sliceDoc(s.from, s.to))));

//   return true;
// }


// recursive(buffer: any, main: any) {
//   if (buffer?.type?.name === 'Statement') {
//     const from = main.from <= buffer.from ? buffer.from : main.from;
//     const to = main.to >= buffer.to ? buffer.to : main.to;

//     // console.log(buffer.type.name, buffer.from, buffer.to, '=>', from, to);

//     if (from < to) {
//       this.selection.push({ from, to });
//     }
//   }

//   if (buffer?.nextSibling) {
//     this.recursive(buffer.nextSibling, main);
//   }
// }




// changeDoc() {
//   // console.log(this.view.state);
//   this.view.dispatch({
//     changes: { from: 0, insert: "#!/usr/bin/env node\n" }
//   })

//   // this.view.dispatch({
//   //   effects: StateEffect.appendConfig.of(extension)
//   // })
// }


  // let token = context.tokenBefore(['(', 'Identifier']);
