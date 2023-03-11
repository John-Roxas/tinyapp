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

module.exports = {
  urlsForUser,
  emailLookup,
  generateRandomString,
};
