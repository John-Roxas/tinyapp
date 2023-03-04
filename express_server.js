const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

// In order to expose req.cookies. We must first run the cookieParser() function on our app! This function parses the cookier header on the request.
app.use(cookieParser());

const generateRandomString = () => {
  let result = "";
  // Declaring all valid characters for the random string. No symbols allowed!
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const charLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters[Math.floor(Math.random() * charLength)];
  }
  return result;
};

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// Important that this comes before all of our routes!
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

// Route to get the links in urlDatabase and print is out as a json object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to print out Hello World with world bolded.
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route handlers for urls
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

// Route handler for entering new URLs
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };

  res.render("urls_new", templateVars);
});

// Route handler for urls that are pointing at a specific ID in urlDatabase
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

// Post method to delete entries in our app!
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

// Post method which edits the LongURLs in our app!
app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

// Post method to handle logins
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect(`/urls`);
});

// Post method to handle logouts
app.post("/logout", (req, res) => {
  res.cookie("username", "");
  res.redirect(`/urls`);
});

// Post method to generate a new random 6 character string and attach it as the key of the url entered in the form on urls/new
app.post("/urls", (req, res) => {
  let newKey = generateRandomString();
  urlDatabase[newKey] = req.body.longURL;
  res.redirect(`/urls/:${newKey}`); // Redirects to urls/newKey
});

// Route handler for viewing an individual URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id.slice(1)];
  res.redirect(longURL);
});

console.log();

// When you connect to the server using node express_server.js, it should read "Example app listening on port 8080". Otherwise it's not working right!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
