import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { basicSetup } from '@codemirror/basic-setup';
import { EditorView } from "@codemirror/view";
import { EditorState, StateEffect, Compartment } from "@codemirror/state";
import { keymap, highlightActiveLine, ViewUpdate } from '@codemirror/view';
import { sql, keywordCompletion, StandardSQL, schemaCompletion } from '@codemirror/lang-sql';
import { indentWithTab } from '@codemirror/commands';
import { startCompletion, acceptCompletion, autocompletion, closeCompletion } from '@codemirror/autocomplete';

import { lineNumbers, GutterMarker } from '@codemirror/gutter';
import { history, undo, redo } from '@codemirror/history';
import { foldGutter } from '@codemirror/fold';
import { syntaxTree, indentOnInput } from '@codemirror/language';
import { defaultHighlightStyle } from '@codemirror/highlight';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets } from '@codemirror/closebrackets';
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { gutter, highlightActiveLineGutter } from '@codemirror/gutter';
import { ICompletion, ISelection, query1, query2, queryVars } from './queries';



import { toggleComment } from '@codemirror/comment';
import { lastValueFrom, map } from 'rxjs';
import { AppService } from './app.service';

const WORDS = ['SELECT', 'SET', 'UPDATE', 'ALTER', 'DROP', 'FROM', 'DATABASE', 'TABLE', 'VIEW', 'WHERE', 'JOIN', 'GROUP', 'ORDER', 'BY', 'ASC', 'DISTINCT', 'DESC', 'HAVING', 'COUNT', 'NULL', 'LIKE', 'LIMIT'];

const COLUMNS = {
  table1: [...Array(6)].map((_, i) => ({ label: `col1_${i}`, boost: 98, type: 'column' })),
  table2: [...Array(6)].map((_, i) => ({ label: `col2_${i}`, boost: 98, type: 'column' })),
  table3: [...Array(6)].map((_, i) => ({ label: `col3_${i}`, boost: 98, type: 'column' })),
  table4: [...Array(6)].map((_, i) => ({ label: `col4_${i}`, boost: 98, type: 'column' }))
}
const TABLES = Object.keys(COLUMNS);

function getCurrentStatement(state: EditorState, from: number): ISelection | null {
  let node = syntaxTree(state).resolve(from, 1);
  if ((node as any).index === 0) {
    node = syntaxTree(state).resolve(from, -1);
  }
  // console.log(node.type, node.name, node.from, node.to);
  while (node?.parent && node.name !== 'Statement') {
    node = node.parent;
  }

  if (node.name === 'Statement') {
    return { from: node.from, to: node.to };
  }

  return null;
}


function myCompletions(context: CompletionContext): CompletionResult | any {
  console.clear();

  let word = context.matchBefore(/{{/)
  let token = context.tokenBefore(['{', '}']);
  console.log(word, token);
  
  if(word?.to){
    return {
      from: word?.to,
      options: queryVars.map(q => ({ label: q.label, type: 'query-variable'}))
    }
  }

  const query: ISelection | null = getCurrentStatement(context.state, context.pos);
  let defaultTable = '';
  if (query) {
    const doc = context.state.sliceDoc(query?.from, query?.to);
    defaultTable = TABLES.find(t => doc.includes(t)) || '';
  }

  const customExt: any = schemaCompletion({
    tables: TABLES.map(t => ({ label: t, boost: 97, type: 'table' })),
    defaultTable: defaultTable,
    schema: COLUMNS
  });

  const custom: ICompletion = customExt.value.autocomplete(context);

  const baseExt: any = keywordCompletion(StandardSQL, true);
  const base: ICompletion = baseExt.value.autocomplete(context);
  
  console.table(custom?.options);
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

  selection: ISelection[] = [];

  constructor(private service: AppService){}

  onSubmit(view: EditorView): boolean {
    console.log(view);
    StateEffect.appendConfig.of
    return false;
  }

  ngAfterViewInit() {
    const self = this;
    this.view = new EditorView({
      state: EditorState.create({
        doc: '',//query1,
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


          autocompletion({
            override: [
              myCompletions,
              // async (ctx: CompletionContext): Promise<CompletionResult | any> => {
              //   return await lastValueFrom(
              //     this.service.getCompletion2().pipe(
              //       map(tables => {
              //         // console.log(tables.map((t:any) => ({ label: t, boost: 97, type: 'table' })));
              //         const customExt: any = schemaCompletion({
              //           tables: tables.map((t:any) => ({ label: t, boost: 97, type: 'table' })),
              //           schema: COLUMNS,
              //         });
              //         return customExt.value.autocomplete(ctx);
              //       })
              //     )
              //   );
              // }
            ]
          }),
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

    // this.view.contentDOM.onclick = (event => {
    //   closeCompletion(this.view);
    // })
  }

  findActiveQuery(view: ViewUpdate): boolean {
    this.selection = [];
    const self = this;
    const main = view.state.selection.main;

    if (main.from < main.to) {
      syntaxTree(view.state).iterate({
        enter(type, from_, to_, get_) {
          // console.log(from_, to_, type, get_());
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
      const s = getCurrentStatement(view.state, main.from);
      this.selection = s ? [s] : [];
    }

    // this.selection.map(s => (console.log(view.state.sliceDoc(s.from, s.to))));
    // console.log(this.selection);

    return true;
  }

  themeToggle() {
    
  }
}