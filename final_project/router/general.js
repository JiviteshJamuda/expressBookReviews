const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const axios = require('axios');
const public_users = express.Router();

/**
 * Route: POST /register
 * Description: Registers a new user with a username and password if they don't already exist.
 */
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!isValid(username)) { 
      users.push({"username": username, "password": password});
      return res.status(200).json({message: "User successfully registered. Now you can login"});
    } else {
      return res.status(404).json({message: "User already exists!"});    
    }
  } 
  return res.status(404).json({message: "Unable to register user."});
});

/**
 * Task 10: Get all books using Async-Await with Axios
 * Description: Asynchronously fetches the full list of books from the internal data provider.
 */
public_users.get('/', async function (req, res) {
  try {
    // Requests raw book data from the decoupled endpoint to avoid request looping
    const response = await axios.get('http://localhost:5000/data/books');
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error fetching books via Axios" });
  }
});

/**
 * Task 11: Get book details based on ISBN using Promises with Axios
 * Description: Uses standard Promise chaining (.then / .catch) to request single book data.
 */
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // Axios execution targeting the dedicated ISBN data resolver
  axios.get(`http://localhost:5000/data/isbn/${isbn}`)
    .then((response) => {
      return res.status(200).send(JSON.stringify(response.data, null, 4));
    })
    .catch((error) => {
      return res.status(404).json({ message: "Book not found" });
    });
});
  
/**
 * Task 12: Get book details based on Author using Async-Await with Axios
 * Description: Asynchronously pulls all data through Axios, then parses out matching authors.
 */
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;

  try {
    const response = await axios.get('http://localhost:5000/data/books');
    const allBooks = response.data;
    
    // Iterate over the fetched collection to match requested author property
    let booksByAuthor = [];
    for (let isbn in allBooks) {
      if (allBooks[isbn].author === author) {
        booksByAuthor.push({
          "isbn": isbn,
          "title": allBooks[isbn].title,
          "reviews": allBooks[isbn].reviews
        });
      }
    }
    return res.status(200).send(JSON.stringify({ booksbyauthor: booksByAuthor }, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error filtering by author" });
  }
});

/**
 * Task 13: Get book details based on Title using Async-Await with Axios
 * Description: Asynchronously pulls all data through Axios, then parses out matching titles.
 */
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;

  try {
    const response = await axios.get('http://localhost:5000/data/books');
    const allBooks = response.data;

    // Iterate over the fetched collection to match requested title property
    let booksByTitle = [];
    for (let isbn in allBooks) {
      if (allBooks[isbn].title === title) {
        booksByTitle.push({
          "isbn": isbn,
          "author": allBooks[isbn].author,
          "reviews": allBooks[isbn].reviews
        });
      }
    }
    return res.status(200).send(JSON.stringify({ booksbytitle: booksByTitle }, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error filtering by title" });
  }
});

/**
 * Route: GET /review/:isbn
 * Description: Returns the reviews object linked to a specified book ISBN.
 */
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    return res.status(200).send(JSON.stringify(book.reviews, null, 4));
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

// =====================================================================
// INTERNAL DATA PROVIDER ENDPOINTS
// Architectural Note: Separating the data logic into these standalone
// routes prevents Axios from triggering infinite request recursion loops.
// =====================================================================

/**
 * Internal Endpoint: GET /data/books
 * Purpose: Returns raw local books database array for Axios tasks.
 */
public_users.get('/data/books', (req, res) => {
  res.status(200).json(books);
});

/**
 * Internal Endpoint: GET /data/isbn/:isbn
 * Purpose: Resolves specific raw book entry by ISBN for Axios tasks.
 */
public_users.get('/data/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    res.status(200).json(book);
  } else {
    res.status(404).json({ message: "Book not found" });
  }
});

module.exports = {
  general: public_users
};