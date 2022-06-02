'use strict'

const axios = require('axios');
const qs = require('qs');
const config = require('config');

exports.handler = async (event, context, callback) => {

  const formData = qs.parse(event.body);
  const formDataForQuery = formData;
  let submittingURL = formData.submittingURL + "?";
  
  
  const gRecaptchaResponse = formData['g-recaptcha-response'];
  const hp = formData['CustId'];
  // prod secret
  const CAPTCHA_SECRET = config.get('CAPTCHA_SECRET');
  // testing secret
  // const CAPTCHA_SECRET = config.get('TEST_CAPTCHA_SECRET');
  const CAPTCHA_URL = `https://www.google.com/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET}&response=${gRecaptchaResponse}`;
  let redirectURL = "";

  console.log("----- FORM SUBMISSION");
  console.log(formData);
  
  
/******************************************************************************** 
 * 
 * STEP 1: CHECK THAT HONEY POT WASN'T FILLED IN
 * 
*********************************************************************************/
  
  const honeypot = () => {
    if (hp != '') {
      let errorMsg = "----- Honey Pot submission was found. Likely Spam. Do not allow."
      throw new Error(errorMsg);
    } else {
      let passMsg = "----- PASSED STEP 1. No honey pot."
      console.log(passMsg)
      return new Promise(resolve => {
        resolve(passMsg)
      })
    }
  }

/******************************************************************************** 
 * 
 * STEP 2: CHECK THAT G-RECAPTCHA RESPONSE VALUE WAS PROVIDED
 * 
*********************************************************************************/
  
  const confirmGoogleRecaptchaResponse = () => {
    if (gRecaptchaResponse === undefined || gRecaptchaResponse === '' || gRecaptchaResponse === null) {
      let errorMsg = "----- Google Recaptcha Response NOT included in the submission. Do not allow."
      console.log(errorMsg)
      throw new Error(errorMsg);
    } else {
      let passMsg = "----- PASSED STEP 2. Google Recaptcha Response found."
      console.log(passMsg)
      return new Promise(resolve => {
        resolve(passMsg)
      })
    }
  }


/******************************************************************************** 
 * 
 * STEP 3: SCORE THE GOOGLE RECAPTCHA RESPONSE TO DETERMINE IF IT CAN PASS
 * 
*********************************************************************************/
  
  const scoreRecaptcha = async () => {
    try {
      const res = await axios.post(CAPTCHA_URL, {
        method: 'post',
        data: {
          secret: CAPTCHA_SECRET,
          response: gRecaptchaResponse
        }
      });
      console.log("----- Begin recaptcha scoring")
      console.log(res.data);
      // ! here is where I'm deciding when to submit to Acoustic. Right now submissions go to Acoustic if score is greater than or equal to 0.8
      if(res.data.success === true && res.data.score >= 0.8) {
        
        // ! when testing uncomment this section and comment out the submitToAcoustic function. The below will return the submission details in the browser for you to review
        console.log("----- PASSESD STEP 3. Recaptcha response was submitted successfully and score at or above 0.8");
        return {
          statusCode: res.status,
          body: res
        }
      }
      else {
        throw new Error("Scoring the recaptcha response failed. It either returned false or the score was below 0.8.");
      }
    }
    catch(error) {
      console.log("----- scoreRecaptcha axios ERROR: ");
      throw error;
    }
  }


/******************************************************************************** 
 * 
 * STEP 4: BUILD THE SUBMITTING URL
 * 
*********************************************************************************/

  const buildSubmittingURL = () => {
    delete formDataForQuery.action;
    delete formDataForQuery.submittingURL;
    delete formDataForQuery['g-recaptcha-response'];
    submittingURL = submittingURL + Object.keys(formDataForQuery).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(formDataForQuery[key])).join('&');
    
    let passMsg = "----- PASSED STEP 4. Submitting Url has been built. " + submittingURL
    console.log(passMsg)
    return new Promise(resolve => {
      resolve(passMsg)
    })
  }

/******************************************************************************** 
 * 
 * STEP 5: SUBMIT TO ACOUSTIC
 * 
*********************************************************************************/
  
  const submitToAcoustic = async () => {
    await axios.post(submittingURL)
      .then((res) => {
        // console.log(res.data);
        console.log("----- Submission to Acoustic successful. Compiling redirect url for final redirect.")
        // this value is navigating down the JSON tree of data Acoustic provides in the response to get the url you redirect to after a successful submission. We can redirect the page here
        redirectURL = res.request._redirectable._currentUrl;
        console.log(redirectURL);
      }).catch((error) => {
        console.error(error);
      });
  }

 

  async function main() {
    console.log("----- Begin Main");
    // step 1
    await honeypot();
    // step 2
    await confirmGoogleRecaptchaResponse();
    // step 3
    await scoreRecaptcha();
    //step 4
    await buildSubmittingURL();
    // step 5
    await submitToAcoustic();
    console.log("----- Main complete")
  }


  try {
    await main();
    // this will return the form data on screen for testing
    // return {
    //   statusCode: 200,
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(formData),
    // };

    return {
      statusCode: 301,
      headers: {
          Location: redirectURL
      }
    }
  }
  catch (error) {
    console.log('Error ', error);
    // return {
    //   statusCode: 400,
    //   body: error.message,
    // };
    return {
      statusCode: 301,
      headers: {
          Location: 'https://www.whereoware.com/404'
      }
    }
  }    
};