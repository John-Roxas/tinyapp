const cookieParser = require("cookie-parser");
const cookiesession = require("cookie-session");
const bcrypt = require("bcryptjs");
const express = require("express");
const salt = bcrypt.genSaltSync(10);

// Helper functions from helper.js
const {
  emailLookup,
  urlsForUser,
  generateRandomString,
} = require("./helpers.js");

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

// Database where all of our short URL IDs and longURL pairs are stored.
const urlDatabase = {};

// Database where all of our user and password information is stored.
const users = {
  // Need the undefined case, or else everything breaks on logout
  [undefined]: {
    email: "",
    id: "",
    password: null,
  },
};

app.set("view engine", "ejs");
// Important that this comes before all of our routes!
app.use(express.urlencoded({ extended: true }));

// Route handler for our landing page. Redirect to login!
app.get("/", (req, res) => {
  // List of commonly used variables
  const params = req.params.id;
  const urlDatabaseParams = urlDatabase[params];
  res.redirect(`login`);
});

// Route handlers for urls (our homepage)
app.get("/urls", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("Need to be logged in to access! Log in or register!");
  }

  const templateVars = {
    username: users[req.session.userID].email,
    urls: urlsForUser(req.session.userID, urlDatabase),
    users,
  };
  res.render("urls_index", templateVars);
});

// Route handler for entering new URLs
app.get("/urls/new", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("Need to be logged in to access! Log in or register!");
  }
  const templateVars = {
    username: users[req.session.userID].email,
    urls: urlDatabase,
  };

  res.render("urls_new", templateVars);
});

// Route handler for urls that are pointing at a specific ID in urlDatabase
app.get("/urls/:id", (req, res) => {
  const params = req.params.id;
  const urlDatabaseParams = urlDatabase[params];
  let exist = false;
  for (const key in urlDatabase) {
    if (params === key) {
      exist = true;
    }
  }
  if (exist === false) {
    res.status(403).send("Error SHORT URL does not exist");
  }

  //
  if (!req.session.userID || req.session.userID !== urlDatabaseParams.userID) {
    res
      .status(403)
      .send(
        "You are not authorized to view the details for this shortURL! Please login using the correct details!"
      );
  }

  // Determines the date/ time at the moment we open the page for urls/:id in terms of PST timezone and stores as currentTime.
  const currentTime = JSON.stringify(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Vancouver",
    })
  );

  // Tracks total visits to a URL
  urlDatabaseParams.totalVisits += 1;
  urlDatabaseParams.visitTracker["V" + generateRandomString()] = currentTime;

  // Start of code block to track unique visits
  let unique = true;
  // If the stored cookie matches one of the cookies in our list of cookies (stored in each short URL object), set to false and jump out of the loop, This will then skip past
  // the next code block and jump into rendering the page.
  for (const element of urlDatabaseParams.uniqueVisitors) {
    if (req.cookies["uniqueID"] === element) {
      unique = false;
      break;
    }
  }
  // If we see a truly unique user, set a new cookie using our handy generateRandomString function and store it in our list of uniqueIDs within that shortURL object.
  if (unique === true) {
    let uniqueID = generateRandomString();
    res.cookie("uniqueID", uniqueID);
    urlDatabaseParams.uniqueVisits += 1;
    urlDatabaseParams.uniqueVisitors.push(uniqueID);
  }
  const templateVars = {
    username: users[req.session.userID].email,
    id: params,
    longURL: urlDatabaseParams.longURL,
    totalVisits: urlDatabaseParams.totalVisits,
    uniqueVisits: urlDatabaseParams.uniqueVisits,
    visitTracker: urlDatabaseParams.visitTracker,
  };
  res.render("urls_show", templateVars);
});

// Route handler for viewing an individual URL
app.get("/u/:id", (req, res) => {
  const urlDatabaseParams = urlDatabase[req.params.id];
  const longURL = urlDatabaseParams.longURL;
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

// Route handler for the login page
app.get("/login", (req, res) => {
  const templateVars = {
    username: users[req.session.userID].email,
    urls: urlDatabase,
    users,
  };
  res.render(`login`, templateVars);
});

// Post method to delete entries in our app!
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.userID === undefined || req.session.userID === "") {
    res.send("Error, must be logged in to delete shortURLs!");
  }

  if (req.session.userID === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
  } else {
    res.send("You cannot delete short URLS you do not own!");
  }

  res.redirect(`/urls`);
});

// Post method which edits the LongURLs in our app!
app.post("/urls/:id/edit", (req, res) => {
  const urlDatabaseParams = urlDatabase[req.params.id];
  // the if statement will allow edits only IF we are the correct user
  if (req.session.userID === urlDatabaseParams.userID) {
    urlDatabaseParams.longURL = req.body.longURL;
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

  // Need this to clear the cookies and end our session
  req.session = null;

  // redirects to the /urls page
  res.redirect(`login`);
});

// Post method to generate a new random 6 character string and attach it as the key of the url entered in the form on urls/new
app.post("/urls", (req, res) => {
  if (req.session.userID === undefined || req.session.userID === "") {
    res.send("Error, must be logged in to create new short URLs");
  } else {
    if (req.body.longURL !== "") {
      let newKey = generateRandomString();

      urlDatabase[newKey] = {};

      let newURLKey = urlDatabase[newKey];
      newURLKey.longURL = req.body.longURL;
      newURLKey.userID = req.session.userID;
      // Need to initialize these in order for the view counter to work properly!
      newURLKey.totalVisits = 0;
      newURLKey.visitTracker = {};
      newURLKey.uniqueVisits = 0;
      newURLKey.uniqueVisitors = [];
      res.redirect(`/urls/${newKey}`); // Redirects to urls/newKey
    }
  }
});

// Post method for user registration!
// Creates a new user in our users global object. req.body.newEmail and req.body.newPassword come from whatever is entered into the form on our register page.

app.post("/userReg", (req, res) => {
  const newUserID = generateRandomString();
  const body = req.body;
  if (body.newEmail === "" || body.newPassword === "") {
    // Send an error if the user tries to register with either a blank email address or blank password field
    res
      .status(400)
      .send("Cannot accept an empty username or password. Try Again!");
  } else if (emailLookup(body.newEmail, users) !== "") {
    console.log(body.newEmail);
    // Send an error IF the user tries to register an email that is already in the database
    res.status(400).send("User is already registered! Try Again!");
  } else {
    users[newUserID] = {
      id: newUserID,
      email: body.newEmail,
      password: bcrypt.hashSync(body.newPassword, 10),
    };
    // 12MAR_23 Added after first evaluation. Now when a new user is created, user should now be logged in with their new credentials!
    req.session.userID = newUserID;
  }
  // redirects to the /urls page
  res.redirect(`/urls`);
});

// When you connect to the server using node express_server.js, it should read "Example app listening on port 8080". Otherwise it's not working right!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
