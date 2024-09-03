import axios from 'axios';
import puppeteer, { Browser, Page, Protocol } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const sleep = async (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

let chromiumPath: string | undefined;

export const setChromiumPath = (path: string): void => {
  chromiumPath = path;
};


export const authenticateWithToken = async (accessToken: string): Promise<void> => {
  if (!accessToken) {
    throw 'Access token is required!';
  }

  console.log('Opening browser');
  const browser: Browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: chromiumPath || undefined,
    headless: true,
  });

  const page: Page = await browser.newPage();

  console.log('Loading session...');
  try {
    const cookie: puppeteer.Protocol.Network.CookieParam = {
      domain: 'web.getcontact.com',
      httpOnly: true,
      name: 'accessToken',
      path: '/',
      sameSite: 'Strict',
      secure: true,
      value: accessToken,
    };

    await page.setCookie(cookie);
    await page.goto('https://web.getcontact.com', { waitUntil: 'networkidle2' });

    const invalidToken = await page.$('img[src="/get-qr-code"][alt="Getcontact"]');
    if (invalidToken) {
      await browser.close();
      console.log('Token is invalid');
      throw 'Token is invalid';
    }
  } catch (err) {
    await browser.close();

    if (err instanceof Error) { 
      if (err.message.includes('Token invalid')) {
        throw err.message; 
      }
      throw 'Failed to load session or navigate to the URL: ' + err.message;
    } else {
      throw 'Token is invalid.';
    }
  }

  try {
    await page.waitForSelector('a.hn-btn.hn-search', { timeout: 30000 });
  } catch (error) {
    await browser.close();
    console.log('You are logged in.');
    throw new Error('Failed to find the required element.');
  }
  try {
    const cookies = await page.cookies();
    const authCookie = cookies.find(cookie => cookie.name === 'accessToken');

    if (authCookie) {
      page.on('request', async (request) => {
        if (request.url().includes('https://web.getcontact.com/search')) {
          const postData = request.postData();
          if (postData) {
            const formData = new URLSearchParams(postData);
            const hash = formData.get('hash');
            const sessionData = { accessToken: authCookie.value, hash };
            function mkdir(dirPath: string): void {
              const resolvedPath = path.resolve(dirPath);
            
              if (!fs.existsSync(resolvedPath)) {
                fs.mkdirSync(resolvedPath, { recursive: true });
                console.log(`Directory created at: ${resolvedPath}`);
              } else {
                console.log(`Directory already exists at: ${resolvedPath}`);
              }
            }
            const session_dir = './gtc_session'
            mkdir(session_dir);
            fs.writeFileSync(`${session_dir}/session.json`, JSON.stringify(sessionData, null, 2));
            console.log('Access token has been saved to ' + session_dir);
          }
        }
      });
    } else {
      throw new Error('Cookie "accessToken" not found!');
    }
  } catch (error) {
    await browser.close();
    throw new Error('Failed to retrieve or save cookies.');
  }

  try {
    console.log('Sleeping...');
    await sleep(1000);

    await page.click('a.hn-btn.hn-search');
    await page.screenshot({ path: './screenshot.png' });

    await page.type('input#numberInput[name="phoneNumber"]', '82115554458');
    await page.keyboard.press('Enter');
    await page.waitForSelector('div.rpbi-info', { timeout: 30000 });
  } catch (error) {
    await browser.close();
    throw new Error('Failed during page interaction.');
  }
  await browser.close();
};



/**
(async () => {
  try {
    const token = 'user_provided_token_here'; // Replace with the actual token
    setChromiumPath('/path/to/your/chromium'); // Optional: Set the path to Chromium
    await authenticateWithToken(token); // Authenticate using the token
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
})();
 */
export const getNumberTag = async (
  phoneNumber: string,
  countryCode: string = ''
): Promise<{ name: string; phoneNumber: string; provider: string; messages: string[] }> => {

  if (!/^\d+$/.test(phoneNumber)) {
    return { name: '', phoneNumber, provider: '', messages: ['Nomor telepon hanya boleh berisi angka.'] };
  }

  let token: string;

  try {
    const session = JSON.parse(fs.readFileSync('./gtc_session/session.json', 'utf-8'));
    token = session.accessToken;
    if (!token) {
      return { name: '', phoneNumber, provider: '', messages: ['Autentikasi diperlukan'] };
    }
  } catch (error) {
    return { name: '', phoneNumber, provider: '', messages: ['Autentikasi diperlukan'] };
  }

  console.log('Opening browser');
  const browser: Browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page: Page = await browser.newPage();
  console.log('Setting cookies...');
  try {
    const cookie: puppeteer.Protocol.Network.CookieParam = {
      domain: 'web.getcontact.com',
      httpOnly: true,
      name: 'accessToken',
      path: '/',
      sameSite: 'Strict',
      secure: true,
      value: token,
    };
    await page.setCookie(cookie);

    console.log('Navigating to the website...');
    await page.goto('https://web.getcontact.com', { waitUntil: 'networkidle2' });

    const invalidToken = await page.$('img[src="/get-qr-code"][alt="Getcontact"]');
    if (invalidToken) {
      return { name: '', phoneNumber, provider: '', messages: ['Token invalid'] };
    }

    console.log('You are logged in.');
    console.log('Performing phone number search...');
    console.log('Sleeping');
    await sleep(1000);
    await page.click('a.hn-btn.hn-search');
    if (countryCode) {
      console.log('Selecting country code:', countryCode);
      await page.click('span.select2-selection__arrow');
      await page.type('input.select2-search__field', countryCode);
      await page.waitForSelector('ul.select2-results__options li.select2-results__option', { visible: true });
      const options = await page.$$('ul.select2-results__options li.select2-results__option');
      if (options.length === 0) {
        throw new Error(`Country code '${countryCode}' not found`);
      }
      await page.click('ul.select2-results__options li.select2-results__option');
    }
    await page.type('input#numberInput[name="phoneNumber"]', phoneNumber);
    await page.keyboard.press('Enter');

    await page.waitForSelector('div.rpbi-info, div.alert.alert-danger.mb-0, p.mb-0.alert-text', { timeout: 30000 });

    const messages: string[] = [];
    const numberInvalid = await page.$('div.alert.alert-danger.mb-0');
    if (numberInvalid) {
      const numberInvalidMessage = await page.evaluate(() => document.querySelector('div.alert.alert-danger.mb-0')?.textContent?.trim());
      if (numberInvalidMessage) messages.push(numberInvalidMessage);
    }

    const invisibleOwner = await page.$('p.mb-0.alert-text');
    if (invisibleOwner) {
      const invisibleMessage = await page.evaluate(() => document.querySelector('p.mb-0.alert-text')?.textContent?.trim());
      if (invisibleMessage) messages.push(invisibleMessage);
    }

    const rpbiInfo = await page.$('div.rpbi-info');
    let result = { name: '', phoneNumber: '', provider: '' };
    if (rpbiInfo) {
      result = await page.evaluate(() => {
        const infoDiv = document.querySelector('div.rpbi-info');
        if (infoDiv) {
          const name = (infoDiv.querySelector('h1') as HTMLElement)?.innerText || '';
          const phoneNumber = (infoDiv.querySelector('strong > a') as HTMLElement)?.innerText || '';
          const provider = (infoDiv.querySelector('em') as HTMLElement)?.innerText.trim() || '';
          return { name, phoneNumber, provider };
        }
        return { name: '', phoneNumber: '', provider: '' };
      });

      if (result.name || result.phoneNumber || result.provider) {
        messages.push(`Info: ${result.name}, ${result.phoneNumber}, ${result.provider}`);
      }
    }

    if (messages.length === 0) {
      messages.push('No information found.');
    }

    return { ...result, messages };
  } catch (error) {
    console.error('Error during search:', (error as Error).message);
    throw error;
  } finally {
    await browser.close();
  }
};
export async function getAllTags(phoneNumber: string): Promise<any> {
  let token: string;
  let hash: string;

  try {
    const session = JSON.parse(fs.readFileSync('./gtc_session/session.json', 'utf-8'));
    token = session.accessToken;
    hash = session.hash
    if (!token) {
      return { name: '', phoneNumber, provider: '', messages: ['Autentikasi diperlukan'] };
    }
  } catch (error) {
    return { name: '', phoneNumber, provider: '', messages: ['Autentikasi diperlukan'] };
  }
  const url = 'https://web.getcontact.com/list-tag';
  const body = `hash=${hash}&phoneNumber=${encodeURIComponent(phoneNumber)}`;

  const headers = {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'cookie': `accessToken=${token}; lang=en;`,
    'origin': 'https://web.getcontact.com',
    'referer': 'https://web.getcontact.com/search',
    'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-requested-with': 'XMLHttpRequest'
  };

  try {
    const response = await axios.post(url, body, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}