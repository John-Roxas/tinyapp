const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

// In order to expose req.cookies. We must first run the cookieParser() function on our app! This function parses the cookier header on the request.
app.use(cookieParser());

// Global function to generate a 6 character random string when called.
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

// Global function to lookup whether an email address exists in our database of users. Returns the 6 character userID identifier if found.
const emailLookup = (email, users) => {
  for (const key in users) {
    if (users[key].email === email) {
      return key;
    }
  }
  return "";
};

app.set("view engine", "ejs");

// Database where all of our short URL IDs and longURL pairs are stored.
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// Database where all of our user and password information is stored.
const users = {
  // Need the blank case, or else everything breaks on logout
  [undefined]: {
    email: "",
    id: "",
    password: null,
  },
  "": {
    id: "",
    email: "",
    password: null,
  },
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  test32: {
    id: "user3RandomID",
    email: "user3@example.com",
    password: "test",
  },
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
    username: users[req.cookies["userID"]].email,
    urls: urlDatabase,
    users,
  };
  res.render("urls_index", templateVars);
});

// Route handler for entering new URLs
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: users[req.cookies["userID"]].email,
    urls: urlDatabase,
  };

  res.render("urls_new", templateVars);
});

// Route handler for urls that are pointing at a specific ID in urlDatabase
app.get("/urls/:id", (req, res) => {
  let exist = false;
  for (const key in urlDatabase) {
    if (req.params.id === key) {
      exist = true;
    }
  }
  if (exist === false) {
    res.status(403).send("Error SHORT URL does not exist");
  }

  const templateVars = {
    username: users[req.cookies["userID"]].email,
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
  // sets the cookie username to what gets entered in the login form.
  const loginKey = emailLookup(req.body.username, users);

  if (loginKey === "") {
    res.status(403).send("Error 403 USER NOT FOUND");
  } else if (users[loginKey].password !== req.body.password) {
    res.status(403).send("Error 403 INCORRECT PASSWORD");
  } else {
    res.cookie("userID", loginKey);
    res.redirect(`/urls`);
  }
});

// Post method to handle logouts
app.post("/logout", (req, res) => {
  // sets the cookie to be blank upon logout.
  res.cookie("userID", "");
  // redirects to the /urls page
  res.redirect(`/login`);
});

// Post method to generate a new random 6 character string and attach it as the key of the url entered in the form on urls/new
app.post("/urls", (req, res) => {
  if (req.cookies["userID"] === undefined || req.cookies["userID"] === "") {
    res.send("Error, must be logged in to create new short URLs");
  } else {
    if (req.body.longURL !== "") {
      let newKey = generateRandomString();
      urlDatabase[newKey] = req.body.longURL;
      res.redirect(`/urls/:${newKey}`); // Redirects to urls/newKey
    }
  }
});

// Route handler for viewing an individual URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id.slice(1)];
  res.redirect(longURL);
});

// Route for the /register endpoint
app.get("/register", (req, res) => {
  const templateVars = {
    username: users[req.cookies["userID"]].email,
    urls: urlDatabase,
    users,
  };
  res.render(`register`, templateVars);
});

// Post method for user registration!
// Creates a new user in our users global object. req.body.newEmail and req.body.newPassword come from whatever is entered into the form on our register page.

app.post("/userReg", (req, res) => {
  const newUserID = generateRandomString();
  if (req.body.newEmail === "" || req.body.newPassword === "") {
    // Send an error if the user tries to register with either a blank email address or blank password field
    res.status(400);
    res.send("Cannot accept an empty username or password. Try Again!");
  } else if (emailLookup(req.body.newEmail, users) !== "") {
    // Send an error IF the user tries to register an email that is already in the database
    res.status(400);
    res.send("User is already registered! Try Again!");
  } else {
    users[newUserID] = {
      id: newUserID,
      email: req.body.newEmail,
      password: req.body.newPassword,
    };
  }

  // Sets a user_id cookie using the new user's generated ID.
  res.cookie("userID", newUserID);
  // redirects to the /urls page
  res.redirect(`/urls`);
});

app.get("/login", (req, res) => {
  const templateVars = {
    username: users[req.cookies["userID"]].email,
    urls: urlDatabase,
    users,
  };
  res.render(`login`, templateVars);
});

// When you connect to the server using node express_server.js, it should read "Example app listening on port 8080". Otherwise it's not working right!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
