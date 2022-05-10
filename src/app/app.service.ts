import { Injectable } from '@angular/core';
import { lastValueFrom, map, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

const url = 'https://jsonplaceholder.typicode.com/posts';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  getCompletion(): Promise<any> {
    return lastValueFrom(this.http.get<any>(url).pipe(map(() => ['table1', 'table2'])));
  }

  getCompletion2(): Observable<any> {
    return this.http.get<any>(url).pipe(map(() => ['table1', 'table2']));
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


  // let node = context.tokenBefore(['(', 'Identifier']);

  // EditorView.theme({}, {dark: true})
