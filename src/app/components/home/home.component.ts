import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { catchError, debounceTime, filter, map, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SubjectsService } from '../../core/services/subjects.service';
import {
  Book,
  searchedBooksResponse,
} from 'src/app/core/models/book-response.model';
@Component({
  selector: 'front-end-internship-assignment-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  bookSearch: FormControl;
  searchedBooks: Book[] = [];
  searchQuery!: string;
  currentPage: number = 1;
  totalPages!: number;
  isLoading: boolean = false;
  isTableVisible: boolean = false;
  errorMessage: string="";
  totalResults: number = 0;

  constructor(
    private http: HttpClient,
    private subjectsService: SubjectsService
  ) {
    this.bookSearch = new FormControl('');
  }

  trendingSubjects: Array<any> = [
    { name: 'JavaScript' },
    { name: 'CSS' },
    { name: 'HTML' },
    { name: 'Harry Potter' },
    { name: 'Crypto' },
  ];

  replacer(key:string, value:Book[]) {
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
    return map.get(key) || [];
  }
  setTheCache (key:string,data:Book[]) : void {let map;
    if(!Boolean(localStorage.getItem('cache'))){
      map = new Map<string,Book[]>;
    }
    else
    map = JSON.parse(localStorage.getItem('cache') || "" , this.reviver);

    map.set(key, data)
    localStorage.setItem('cache',JSON.stringify(map,this.replacer));
    console.log(map);
  }
  reviver(key:string, value:any) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }


  searchBooks() {
    if (Boolean(this.getFromCache(this.currentPage+'/'+this.searchQuery).length!=0)) {
      this.searchedBooks = this.getFromCache(this.currentPage+'/'+this.searchQuery) || [];
      this.isLoading = false;
      this.isTableVisible = true;
    } else {
      this.subjectsService
        .getBooksByPage(this.currentPage, this.searchQuery)
        .pipe(
          catchError((error) => {
            this.isLoading = false;
            this.isTableVisible = false;
            this.errorMessage =
              'An error occurred while fetching search results. Please try again later.';
            return throwError(error);
          })
        )
        .subscribe((data) => {
          this.searchedBooks =  data?.docs;
          if(this.searchedBooks.length === 0){
            this.errorMessage="No results found!";
            this.isLoading = false;
            this.isTableVisible = false;
            return;
          }
          this.totalResults = data?.numFound;
          this.setTheCache(this.currentPage+'/'+this.searchQuery,data?.docs);
          this.isLoading = false;
          this.isTableVisible = true;
          this.errorMessage="";
        });
    }
  }

  showNextPage() {
    if (this.currentPage < this.totalResults / 10) {
      this.currentPage++;
      this.isLoading = true;
      this.searchBooks();
    }
  }
  showPrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.isLoading = true;
      this.searchBooks();
    }
  }

  ngOnInit(): void {
    this.bookSearch.valueChanges
      .pipe(debounceTime(300))
      .subscribe((value: string) => {
        this.searchQuery = value;
        this.isLoading = true;
        // check if searchQuery is already in cache
        if (Boolean(this.getFromCache(this.currentPage+'/'+this.searchQuery).length!=0)) {
          this.searchedBooks = this.getFromCache(this.currentPage+'/'+this.searchQuery) || [];
          this.isLoading = false;
          this.isTableVisible = true;
          this.errorMessage="";
        } else {
          this.searchBooks();
        }
      });
  }
}
