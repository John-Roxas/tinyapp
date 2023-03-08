const { assert } = require("chai");
const {
  emailLookup,
  urlsForUser,
  generateRandomString,
} = require("../helpers.js");

const testUsers = {
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
};

describe("emailLookup", function () {
  it("should return a user with valid email", function () {
    const user = emailLookup("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, expectedUserID);
    // Write your assert statement here
  });
  it('should return "" if an invalid email is entered', () => {
    const user = emailLookup("DOES NOT EXIST", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(user, expectedUserID);
  });
});

describe("urlsForUser", () => {
  it("should return an object that only contain a specific userID", () => {
    const urlDatabase = {
      b2xVn2: {
        longURL: "http://www.lighthouselabs.ca",
        userID: "WRONG",
      },
      "9sm5xK": {
        longURL: "http://www.google.com",
        userID: "WRONG",
      },
      b2xVn5: {
        longURL: "https://www.youtube.com",
        userID: "test32",
      },
    };

    const testID = "test32";
    const result = urlsForUser(testID, urlDatabase);
    const expected = {
      b2xVn5: {
        longURL: "https://www.youtube.com",
        userID: "test32",
      },
    };

    assert.deepEqual(result, expected);
  });
});

describe("generateRandomString", () => {
  it("should return a string", () => {
    const expected = "string";
    const result = typeof generateRandomString();
    assert.strictEqual(expected, result);
  });
  it("should return a string with length 6", () => {
    const expected = 6;
    const result = generateRandomString().length;
    assert.strictEqual(expected, result);
  });
});
