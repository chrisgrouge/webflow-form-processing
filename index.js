'use strict'

const axios = require('axios');
const qs = require('qs');

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET;
const HONEY_POT_FIELD_NAME = 'CustId';
const GRECAPTCHA_RESPONSE_FIELD_NAME = 'g-recaptcha-response';
const FORM_FIELDS_TO_EXCLUDE_FROM_SUBMISSION = [
  'action',
  'formSubmittedFromUrl',
  'submittingURL',
  GRECAPTCHA_RESPONSE_FIELD_NAME,
  HONEY_POT_FIELD_NAME
];
const CAPTCHA_PASSING_SCORE = 0.7;
const CAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';
const ERROR_URL = "https://www.whereoware.com/error";

/**
 * Object containing methods for processing form submissions.
 * @namespace webflowFormProcessingForAcoustic
 */
const webflowFormProcessingForAcoustic = {
  /**
   * Ensure the honey pot field wasn't filled in
   * @param {string} value - The value of the honey pot field
   * @throws Will throw an error if the honey pot field was filled in
   * @returns {void}
   */
  _checkHoneyPotValue: function(value) {
    if (value !== '') {
      throw new Error('----- Honey Pot submission was found. Likely Spam. Do not allow.');
    }
    
    console.log('----- PASSED STEP 1. No honey pot.');
    return;
  },
  /**
   * Score the Google Recaptcha response to determine if it can pass. If the score is too low, an error will be thrown.
   * @param {string} responseValue - The value of the GRECAPTCHA_RESPONSE_FIELD_NAME field
   * @throws Will throw an error if the Google Recaptcha score is too low
   * @returns {void}
   */
  _scoreRecaptcha: async function(responseValue) {
    if (!responseValue) {
      throw new Error(`----- Google Recaptcha Response NOT included in the submission. Do not allow. Will redirect to: ${ERROR_URL}`);
    }

    try {
      const res = await axios.post(CAPTCHA_URL, qs.stringify({
        secret: CAPTCHA_SECRET,
        response: responseValue
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // If the request was not successful or the score is null or undefined, throw an error
      if (!res?.data?.success || res?.data?.score == null) {
        throw new Error('----- Google Recaptcha API request was not successful.');
      }

      const score = res.data.score;
      if (score < CAPTCHA_PASSING_SCORE) {
        throw new Error(`----- Google Recaptcha score is too low. Score: ${score}`);
      }
  
      console.log(`----- PASSED STEP 2. Google Recaptcha score is acceptable. Score: ${score}`);
    }
    catch (error) {
      throw error;
    }
  },
  /**
   * Build the submitting URL with the form data appended as a query string and return the URL
   * @param {Object} formData - The form data to be submitted
   * @returns {string} The submitting URL with the form data appended as a query string
   */
  _buildSubmittingURL: function(formData) {
    // Remove the fields that should not be included in the submission
    const data = Object.fromEntries(
      Object.entries(formData)
        .filter(([key]) => !FORM_FIELDS_TO_EXCLUDE_FROM_SUBMISSION.includes(key))
    );
  
    // Stringify the form data
    const queryString = qs.stringify(data);

    // Build the submitting URL
    const submittingUrl = `${formData.submittingURL}?${queryString}`;

    console.log(`----- PASSED STEP 3. Submitting Url has been built: ${submittingUrl}`);
    return submittingUrl;
  },
  /**
   * Submit the form data to Acoustic and get the redirect URL
   * @param {string} submittingUrl - The URL to submit the form data to
   * @returns {string} The redirect URL returned from Acoustic
   */
  _submitToAcoustic: async function(submittingUrl) {
    try {
      // Submit the form data to Acoustic
      const res = await axios.post(submittingUrl);

      // If the request was not successful or the redirect URL is null, undefined, or empty, throw an error
      if (!res?.request?._redirectable || !res?.request?._redirectable?._currentUrl) {
        throw new Error('----- Submission to Acoustic was not successful or did not return a redirect URL.');
      }

      // Get the redirect URL from the response and return it
      const redirectURL = res.request._redirectable._currentUrl;
      console.log(`----- PASSED STEP 4. Submitted to Acoustic. Redirecting to: ${redirectURL}`);
      return redirectURL;
    } catch (error) {
      throw error;
    }
  },
  /**
   * Main method for processing form submissions
   * @param {Object} formData - The form data to be submitted
   * @returns {string} The redirect URL returned from Acoustic
   */
  main: async function(formData) {
    console.log("----- FORM SUBMISSION", formData);

    let redirectURL = '';
    const honeyPotFieldValue = formData[HONEY_POT_FIELD_NAME];
    const gRecaptchaResponse = formData[GRECAPTCHA_RESPONSE_FIELD_NAME];

    try {
      // Ensure the honey pot field wasn't filled in
      this._checkHoneyPotValue(honeyPotFieldValue);
  
      // Ensure the GRECAPTCHA_RESPONSE_FIELD_NAME value was provided
      this._confirmGoogleRecaptchaResponse(gRecaptchaResponse);
  
      // Score the Google Recaptcha response to determine if it can pass
      await this._scoreRecaptcha(gRecaptchaResponse);
      
      // Build the submitting URL
      const submittingUrl = this._buildSubmittingURL(formData);

      // Submit the form data to Acoustic and get the redirect URL
      redirectURL = await this._submitToAcoustic(submittingUrl);
    }
    catch (error) {
      redirectURL = ERROR_URL;
      throw error;
    }

    return redirectURL;
  }
}

exports.handler = async (event, context, callback) => {
  const formData = qs.parse(event.body);

  // defaulting to the error page.
  let redirectURL = ERROR_URL;

  try {
    redirectURL = await webflowFormProcessingForAcoustic.main(formData);
  }
  catch (error) {
    console.error('Error occurred during form processing: ', formData);
    console.error(error);
  }

  return {
    statusCode: 301,
    headers: {
        Location: redirectURL
    }
  }
};
