import { BookHome, AddBook } from "../views/books";

export default [
  { path: "/books", name: "books", component: BookHome },
  { path: "/books/add", name: "addBook", component: AddBook },
];
