# Whereoware Webflow Form Processing

Welcome to the Whereoware Webflow Form Processing serverless application! This node app was created using AWS Lambda, Axios, and qs (Query String) to allow form submissions from the Whereoware Webflow Website to be processed and pass/reject based on certain cirteria.
<br>


## What is this repository for?

The need for this app came from Alyson Hunter who made it very clear she was underwater with spam form submissions.

> <br>
> "The Recapcha on our website is broken, and we're getting inundated with Spam. The web agency we used has no idea what is causing the problem, as they don't have any experience with Acoustic webforms." - Alyson
> <br><br>

We've not identified how bots are getting to the site but this app is setup to prevent them from submitting forms.
<br>


## What criteria are we using to pass or reject submissions?

1.  **A hidden honey pot text field**
    1.  The idea behind this honey pot field is to catch bots attempting to submit forms and stopping them before anything else can take place. The honey pot field is a non-visible text field hidden in the form. A human submitting this form won't see the field and can submit without issues. Bots submitting the form can see the HTML of the input and will attempt to submit a value. This application will identify when a value has been submitted for this honey pot field and will block the submission.
2.  **Google Recaptcha V3**
    2.  If a bot is smart enough to ignore the hidden honey pot field, they must also pass the google recaptcha validation before submissions will be accepted. We're allowing recaptca scores of 0.7 and higher to continue through the form. Anything below 0.7 will be blocked.
<br>


## How do I get set up?

**Requirements**: Node and Git    
**Install**: `npm install`   
**Dependencies**: Axios, Config, qs   
**Run**: `npm start`
<br>


## AWS Setup

This application is hosted on AWS and uses multiple services listed below:<br>

**Lambda**<br>
Allows us to run code on the backend with AWS without the need for managing any servers. AWS will run the code and perform the actions as needed.
<br>

**API Gateway**<br>
Allows us to connected our lambda function, generate a unique url, and trigger the code in the lambda function to run.
<br><br>


## Understanding the code

The entire lambda function is built in the *index.js* file. This is what AWS will run when the function is called. Since this is a node project there are a few dependencies that need to be installed. Fortunately, AWS can handle the use of dependencies as long as you import your node modules folder. <br>

Now, let's look at the three most important pieces of this project and break them down individually.

### 1. html

-   *honeypot-example.html* is just an example of what the honeypot field will be when it's placed on the form.
-   *test-form.html* can be used for local testing. You'll have to manually set the form action url to a dev link so you can trigger a dev lambda function.
-   *formhandler.js* is responsible for all the front-end validation and submission of all Acoustic forms on the site.
-   *custom-code--footer.html* this is code that lives in the custom css footer section of the webflow site. This has the contents of the formhandler.js file along with other code that was placed there by various teams. Saving here for backup purposes.

### 1. index.js

Here is where all the magic happens. I'm going to break down the file into sections and discuss them individually.

1.  **Global node requirements**
    -  In the `package.json` you should already have dependencies installed. The global variables are requiring the use of these dependencies and are used later in the function.
1.  **`exports.handler` function**
    - This is the main function that AWS will run when the lambda function is triggered. It's the first function to run and will call all other functions in the order they're listed. You can see we have the option for event, context, and callback but as of today we're only focused on the event. The event is the form submission coming in.
1.  **`honeypot()` function**
    - This function is the first to run and is used to check if the honeypot field has a value. The form field is hidden on the front-end and a human won't be able to see it to add a value. If this field contains a value, we blocking the submission and redirect to a 404 page. If it doesn't, we're allowing the submission to continue to the next function.
1.  **`scoreRecaptcha()` async function**
    -  We're using the node pacakge, Axios, to perform a post request to the Google Recaptcha site veritication url. We need to pass a few parameters such as the secret and the token we received on the front-end. Google will score the interaction and return it back to us. We can then use that score to determine if we should allow the submission to proceed to the next step.
    -  Normally, a human submitting the form will receive a score of 0.9. To be generous, we're allowing anyone with a score of 0.7 or above to proceed. 0.7 was just a starting point and may be adjusted in the future.
1.  **`buildSubmittingURL()` function**
    - This function is used to build the url that will be used to submit the form data to Acoustic. We're using the query string package to build the url. Field from the `FORM_FIELDS_TO_EXCLUDE_FROM_SUBMISSION` array will be excluded. All other fields from the form will be included.
1.  **`submitToAcoustic()` async function**
    -  We're using Axios again to perform a post request to the url we built in the previous function. On successful submission, we receive a long json message of all the details of what just happened with the post to Acoustic. But, within that message we receive a url that will be used as the redirect. This url is stored on the webform in Acoustic and we're just grabbing it from the response to return it.
1.  **`main()` async function**
    -  This function is running all the above in the order in which they're shown. If any of the above functions fail, we're catching the error and redirecting to a 404 page. If everything is successful, we're returning the url we received from the end of `submitToAcoustic()` to be used in the redirect.
1.  **try and catch**
    -  We're using a try and catch to catch any errors that may occur in the `main()` function. If an error is caught, we're redirecting to a 404 page. If no error is caught, we're redirecting to the url we received from the `submitToAcoustic()` function.
<br>

## Local Testing
If choosing to test changes to the lambda function locally, you can use the `test-form.html` file to submit a form to the lambda function. You'll need to manually set the form action url to a dev link so you can trigger a dev lambda function.

* To return information on screen after submitting the form you can make the following modifications:
```javascript
exports.handler = async (event, context, callback) => {
  // ... rest of the code
  try {
    // ... rest of the code for the try
    // this will return the form data on screen for testing
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData),
    };
  }
  catch (error) {
    // ... rest of the code for the catch
    // this will return the error message on screen for testing
    return {
      statusCode: 400,
      body: error.message,
    };
  }

  // ... rest of the code
};
```

* There is a test captcha secret environment variable that can be used for local testing. You can set this in the `index.js` file.
```javascript
// testing secret using aws environment variable
const CAPTCHA_SECRET = process.env.TEST_CAPTCHA_SECRET;
```

## Who do I talk to?

**Repo owner**: Chris Grouge, Frontend Developer, Whereoware