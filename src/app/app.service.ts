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