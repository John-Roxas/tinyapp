const cookieParser = require("cookie-parser");
const cookiesession = require("cookie-session");
const bcrypt = require("bcryptjs");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// In order to expose req.cookies. We must first run the cookieParser() function on our app! This function parses the cookier header on the request.
app.use(cookieParser());
app.use(
  cookiesession({
    name: "session",
    keys: ["key1"],
  })
);

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

// Global function to sort through all urls for a certain userID.
const urlsForUser = (id, users) => {
  const resultObject = {};
  for (const key in users) {
    if (users[key].userID === id || users[key].userID === "EXAMPLE") {
      resultObject[key] = users[key];
    }
  }
  return resultObject;
};

// Database where all of our short URL IDs and longURL pairs are stored.
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "EXAMPLE",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "EXAMPLE",
  },
  b2xVn5: {
    longURL: "https://www.youtube.com",
    userID: "test32",
  },
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
  // For test purposes only
  test32: {
    id: "user3RandomID",
    email: "test@test.com",
    password: bcrypt.hashSync("test", 10),
  },
};

app.set("view engine", "ejs");
// Important that this comes before all of our routes!
app.use(express.urlencoded({ extended: true }));

// Route handlers for urls (our homepage)
app.get("/urls", (req, res) => {
  const templateVars = {
    username: users[req.session.userID].email,
    urls: urlsForUser(req.session.userID, urlDatabase),
    users,
  };
  res.render("urls_index", templateVars);
});

// Route handler for entering new URLs
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: users[req.session.userID].email,
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
    // res.status(403);
    res.send("Error SHORT URL does not exist");
  }

  const templateVars = {
    username: users[req.session.userID].email,
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
  };
  res.render("urls_show", templateVars);
});

// Post method to delete entries in our app!
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.userID === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
  } else {
    res.send("You cannot delete short URLS you do not own!");
  }

  res.redirect(`/urls`);
});

// Post method which edits the LongURLs in our app!
app.post("/urls/:id/edit", (req, res) => {
  // the if statement will allow edits only IF we are the correct user
  if (req.cookies["userID"] === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
  }

  res.redirect(`/urls`);
});

// Post method to handle logins
app.post("/login", (req, res) => {
  const loginKey = emailLookup(req.body.username, users);
  // Checks if the user exists in our object of users
  if (loginKey === "") {
    res.status(403).send("Error 403 USER NOT FOUND");
    // Checks if the password is correct
  } else if (
    bcrypt.compareSync(req.body.password, users[loginKey].password) === false
  ) {
    res.status(403).send("Error 403 INCORRECT PASSWORD");
  } else {
    // sets the cookie username to what gets entered in the login form.
    req.session.userID = loginKey;
    res.redirect(`/urls`);
  }
});

// Post method to handle logouts
app.post("/logout", (req, res) => {
  // clears the cookie when you hit the logout button.
  res.clearCookie(req.session.userID);
  // redirects to the /urls page
  res.redirect(`/login`);
});

// Post method to generate a new random 6 character string and attach it as the key of the url entered in the form on urls/new
app.post("/urls", (req, res) => {
  if (req.session.userID === undefined || req.session.userID === "") {
    res.send("Error, must be logged in to create new short URLs");
  } else {
    if (req.body.longURL !== "") {
      let newKey = generateRandomString();
      urlDatabase[newKey] = {};
      urlDatabase[newKey].longURL = req.body.longURL;
      urlDatabase[newKey].userID = req.session.userID;
      res.redirect(`/urls/${newKey}`); // Redirects to urls/newKey
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
    username: users[req.session.userID].email,
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
      password: bcrypt.hashSync(req.body.newPassword, 10),
    };
  }

  // Sets a user_id cookie using the new user's generated ID.
  res.cookie("userID", newUserID);
  // redirects to the /urls page
  res.redirect(`/urls`);
});

app.get("/login", (req, res) => {
  const templateVars = {
    username: users[req.session.userID].email,
    urls: urlDatabase,
    users,
  };
  res.render(`login`, templateVars);
});

// When you connect to the server using node express_server.js, it should read "Example app listening on port 8080". Otherwise it's not working right!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
