import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { basicSetup } from '@codemirror/basic-setup';
import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView, keymap, highlightActiveLine, ViewUpdate, lineNumbers, GutterMarker, gutter, highlightActiveLineGutter } from '@codemirror/view';
import { sql, keywordCompletion, StandardSQL, schemaCompletion } from '@codemirror/lang-sql';
import { indentWithTab, history, undo, redo, toggleComment } from '@codemirror/commands';
import { startCompletion, acceptCompletion, autocompletion, closeCompletion, closeBrackets, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

import { syntaxTree, indentOnInput, foldGutter,syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { ICompletion, ISelection, query1, query2, queryVars } from './queries';

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
        doc: query1,
        extensions: [
          // basicSetup,
          lineNumbers(),

          history(),

          indentOnInput(),

          syntaxHighlighting(defaultHighlightStyle),
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
        enter(node) {
          if (node.type.name === 'Statement') {
            const from = main.from <= node.from ? node.from : main.from;
            const to = main.to >= node.to ? node.to : main.to;
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