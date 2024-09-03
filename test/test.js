require('dotenv').config();
const chiwa = require('../dist/chiwa')
const token = process.env.GTC_TOKEN;
async function auth() {
    try {
      await chiwa.authenticateWithToken(token)
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }

async function getNumberTag() {
    try{
    /**
     * Possible Error Passing
     * const anu = await chiwa.getNumberTag('8882743482', '+1')
{
  name: '"+18882743482" is not yet available.',
  phoneNumber: '+18882743482',
  provider: '',
  messages: [
    'Unable to display as the owner of this phone number prefers to be invisible on Getcontact! If you are doing business with the owner of this number, please be careful. You can also contact the owner of the number and ask them to make their tags visible.',
    'Info: "+18882743482" is not yet available., +18882743482, '
  ]
}
     * const anu = await chiwa.getNumberTag('448751484', '+48') // Random Number
{
  name: '"+48448751484" is not yet available.',
  phoneNumber: '+48448751484',
  provider: '',
  messages: [
    'We will begin to show results soon for this country.',
    'Info: "+48448751484" is not yet available., +48448751484, '
  ]
}
     */
const anu = await chiwa.getNumberTag('8882743482', '+1') // Cloudflare Sales Contact >_<
    console.log(anu)
    } catch (error) {
        return;
    }
}
async function getAlltag() {
    try{
    const anu = await chiwa.getAllTags('+6283891278026')
    console.log(anu)
    } catch (error) {

    }
    
}
// auth() // Passed
// getNumberTag() // Passed
// getAlltag() // Passed