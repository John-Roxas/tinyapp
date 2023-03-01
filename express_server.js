const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = () => {
  let result = "";
  // Declaring all valid characters for the random string. No symbols allowed!
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  const charLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters[Math.floor(Math.random() * charLength)];
  }
  return result;
};

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Important that this comes before all of our routes!
app.use(express.urlencoded({ extended: true}));

app.post("/urls", (req,res) => {
  // console.log(req.body); // Log the POST request body to the console
  let newKey = generateRandomString();
  urlDatabase[newKey] = req.body.longURL;
  res.send("Ok"); // Respond with 'Ok'
  // console.log(urlDatabase);
});

app.get("/", (req,res) => {
  res.send('Hello!');
});

// Route to get the links in urlDatabase and print is out as a json object
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

// Route to print out Hello World with world bolded.
app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route handlers for urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Route handler for entering new URLs
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Route handler for urls that are pointing at a specific ID in urlDatabase
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});



// When you connect to the server using node express_server.js, it should read "Example app listening on port 8080". Otherwise it's not working right!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});