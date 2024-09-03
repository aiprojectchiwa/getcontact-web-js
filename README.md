# GetContact Web JS

This project is an implementation using **Puppeteer** and **Axios** to interact with the GetContact website, allowing you to authenticate with a token, retrieve tag information, and search for phone number details.

## Features

- **Token Authentication:** Authenticate using an access token to log into the GetContact web interface.
- **Tag Retrieval:** Retrieve all tags associated with a phone number using a hash.
- **Phone Number Search:** Search for information related to a specific phone number, including the owner's name and provider.

## Prerequisites

Ensure that [Node.js](https://nodejs.org/) is installed before proceeding.

## Installation

1. Install the npm package:

```bash
npm i @akane_chiwa/getcontact-web-js
```

2. (Optional) If you have a custom path to Chromium, set it using the `setChromiumPath` function:

```javascript
const chiwa = require('@akane_chiwa/getcontact-web-js');

chiwa.setChromiumPath('/path/to/your/chromium');
```
## Obtaining an Access Token

1. Install the [EditThisCookie](https://chromewebstore.google.com/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) extension.
2. Open [GetContact Web](https://web.getcontact.com) on your PC.
3. Scan the QR code.
4. After logging in, you can obtain the access token from the `accessToken` value.

![Alt text](https://telegra.ph/file/e02c6cfa695a3ad27b386.png)

## Usage

### Token Authentication

To authenticate with the provided access token:

```javascript
const chiwa = require('@akane_chiwa/getcontact-web-js');

(async () => {
  try {
    const token = 'user_provided_token_here'; // Replace with your access token
    chiwa.setChromiumPath('/path/to/your/chromium'); // Optional: Set the path to Chromium if needed
    await chiwa.authenticateWithToken(token); // Authenticate using the token
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

### Retrieve All Tags

To retrieve all tags associated with a phone number:

```javascript
const chiwa = require('@akane_chiwa/getcontact-web-js');

(async () => {
  try {
    // You MUST provide the complete number along with the country code.
    const phoneNumber = '+6285701203115'
    const tags = await chiwa.getAllTags(phoneNumber);
    console.log(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
  }
})();
```

### Search Phone Number Information

To search for information related to a phone number:
Note: 
You can search for a phone number without including the country code, but this search will be limited to numbers within your own country code. To search for numbers outside your country, make sure to include the country code.
```javascript
const chiwa = require('@akane_chiwa/getcontact-web-js');

(async () => {
  try {
    // You don't need to enter the country code because the country code is already provided by Getcontact in the search field.
    const phoneNumber = '85701203115'; // The phone number you want to search
    const info = await chiwa.getNumberTag(phoneNumber);
//
//  Use this to search for numbers outside your country code.
//  const countryCode = '+62'
//  const info = await chiwa.getNumberTag(phoneNumber, countryCode);
//  This will change the default country code before performing the search.
//
    console.log(info);
  } catch (error) {
    console.error('Error during search:', error.message);
  }
})();
```

## Directory Structure

- `./gtc_session/`: Directory where sessions are stored in JSON files.
- `./screenshot.png`: Screenshot of the page accessed after authentication.

## Contribution

If you'd like to contribute to this project, please fork this repository and submit a pull request with your changes.

## License

This project is licensed under the [MIT License](LICENSE).

---

### Reach me!

- **Instagram:** [@akane_chiwa](https://www.instagram.com/akane_chiwa/)
- **Web:** [api.chiwa.my.id](https://api.chiwa.my.id) | [chiwa.my.id](https://chiwa.my.id)
