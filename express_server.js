const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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


// When you connect to the server using node express_server.js, it should read "Example app listening on port 8080". Otherwise it's not working right!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});