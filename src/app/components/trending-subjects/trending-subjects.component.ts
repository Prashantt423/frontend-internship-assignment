import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SubjectsService } from '../../core/services/subjects.service';
import { Book } from 'src/app/core/models/book-response.model';
import { catchError, throwError } from 'rxjs';

@Component({
  selector: 'front-end-internship-assignment-trending-subjects',
  templateUrl: './trending-subjects.component.html',
  styleUrls: ['./trending-subjects.component.scss'],
})
export class TrendingSubjectsComponent implements OnInit {

  isLoading: boolean = false;
  subjectName: string = '';
  errorMessage: string = '';
  allBooks: Book[] = [];


  constructor(
    private route: ActivatedRoute,
    private subjectsService: SubjectsService
  ) {
  }

  replacer(key:string, value:[Book]) {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()), 
      };
    } else {
      return value;
    }
  }
  getFromCache (key:string): Book[] {
    if(!Boolean(localStorage.getItem('cache'))) return [];
    let map = JSON.parse(localStorage.getItem('cache') || "",this.reviver);
    console.log(map);
    return map.get(key) || [];
  }
  setTheCache (key:string,data:Book[]) : void {
    let map;
    if(!Boolean(localStorage.getItem('cache'))){
      map = new Map<string,Book[]>;
    }
    else
    map = JSON.parse(localStorage.getItem('cache') || "" , this.reviver);
    map.set(key, data)
    localStorage.setItem('cache',JSON.stringify(map,this.replacer));
  }
  reviver(key:string, value:any) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }
  getAllBooks() {
    this.subjectsService.getAllBooks(this.subjectName).pipe(
      catchError((error) => {
        this.isLoading = false;
        this.errorMessage =
          'An error occurred while fetching search results. Please try again later.';
        return throwError(error);
      })
    ).subscribe((data) => {
      this.allBooks = data?.works;
      this.isLoading = false;
      this.setTheCache(this.subjectName,this.allBooks);
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.subjectName = params.get('name') || '';
      this.isLoading = true;
      this.errorMessage=""
      if(Boolean(this.getFromCache(this.subjectName).length!=0)){
        console.log("cached")
        this.allBooks = this.getFromCache(this.subjectName) || [];
        this.isLoading = false;
      }else{
        this.getAllBooks();
      }
    });
  }

}
