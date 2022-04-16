import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { MySQL, PostgreSQL, sql, keywordCompletion, SQLDialect, StandardSQL, schemaCompletion } from '@codemirror/lang-sql';
import { keymap } from '@codemirror/view';
import { indentWithTab, selectSyntaxRight, selectGroupForward, selectLineBoundaryForward, selectParentSyntax } from '@codemirror/commands';
import { Text } from '@codemirror/state';
import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import { gutter } from '@codemirror/gutter';
import { foldAll, unfoldAll, foldCode, foldedRanges } from '@codemirror/fold';
import { syntaxTree, foldService, foldable, ensureSyntaxTree } from '@codemirror/language';
import {CompletionContext, currentCompletions} from "@codemirror/autocomplete";

function myCompletions(context: CompletionContext) {
  const baseAutoCompletionExtension: any = keywordCompletion(StandardSQL, true);
  const baseAutoCompletion = baseAutoCompletionExtension.value.autocomplete(context);
  
  const customAutoCompletionExtension: any = schemaCompletion({
    schema: {
      table1: [
        {
          label: 'col-1',
          detail: 'Details',
          info: 'Documentation',
          type: 'column',
        },
      ],
    }
  });
  const customAutoCompletion = customAutoCompletionExtension.value.autocomplete(context);

  if(!baseAutoCompletion) return { from: 0, options: [], span: null };

  const newOptions = baseAutoCompletion.options.map((option: any) => {
      if(option && (option.label === 'SELECT' || option.label === 'FROM')) {
        return {
          label: option.label,
          type: option.type,
          boost: 99
        }
      }

      return option;
    });

  newOptions.push(...customAutoCompletion.options);

  return {
    from: baseAutoCompletion.from,
    options: newOptions,
    span: baseAutoCompletion.span
  };
}


const sqlLang = sql({
  schema: {
    table1: [
      {
        label: 'col-1',
        detail: 'Details',
        info: 'Documentation',
        type: 'column',
      },
    ],
  },
  upperCaseKeywords: true,
});

sqlLang.language.data.of({
  autocompletion: myCompletions
})

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
        extensions: [
          basicSetup,
          keymap.of([
            {
              key: 'Tab',
              run: acceptCompletion,
            },
            indentWithTab
          ]),
          sqlLang,
          autocompletion({override: [myCompletions]}),
          gutter({class: "cm-mygutter"})
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

    while(rangeSet.to !== rangeSet.from) {
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
