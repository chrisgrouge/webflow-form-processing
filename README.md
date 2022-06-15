# Whereoware Webflow Form Processing

Welcome to the Whereoware Webflow Form Processing serverless application! This node app was created using AWS Lambda, Axios, Config, and qs (Query String) to allow form submissions from the Whereoware Webflow Website to be processed and pass/reject based on certain cirteria.
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
    2.  If a bot is smart enough to ignore the hidden honey pot field, they must also pass the google recaptcha validation before submissions will be accepted. We're allowing recaptca scores of 0.8 and higher to continue through the form. Anything below 0.8 will be blocked.
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

### 1. config

The config file is used to store sensetive information, like the Google Recaptcha secret. This makes it easy to store as a variable to use through out the application, not just in one file. Since we only have one file using it, it's not super helpful, but we may introduce more files in the future.<br>
*Note: the config file was setup for testing purposes but these secrets have now been added as environment variables on the lambda function. Leaving config file in place if needed for future testing*

### 2. html

-   *honeypot-example.html* is just an example of what the honeypot field will be when it's placed on the form.
-   *test-form.html* can be used for local testing. You'll have to manually set the form action url to a dev link so you can trigger a dev lambda function.

### 3. index.js

Here is where all the magic happens. I'm going to break down the file into sections and discuss them individually.

1.  **Global node requirements**
    -  In the `package.json` you should already have dependencies installed. The global variables are requiring the use of these dependencies and are used later in the function.
1.  **`exports.handler` function**
    -  Everything for this function is wrapped in here. You can see we have the option for event, context, and callback but as of today we're only focused on the event. The event is the form submission coming in.
1.  **Honey, I stopped the bots**
    -  The honey pot function is the first funtion to run because I know if a value is submitted in this hidden field, a human didn't write it in. It's hidden on the front-end and a human won't see it to fill in anyway.
1.  **Don't forget your grecaptcha token**
    -  Ok, so, the honey pot field was blank. Still could be a bot smarter than the average bot. Let's make sure Google Recaptcha ran and returned a token for Google to grade them.
1.  **Your fate is in Google's hands now**
    -  We're using the node pacakge, Axios, to perform a post request to the Google Recaptcha site veritication url. We need to pass a few parameters such as the secret and the toekn we received on the front-end. Google will score the interaction and return it back to us. We can then use that score to determine if we should allow the submission to proceed to the next step.
    -  Normally, a human submitting the form will receive a score of 0.9. To be generous, we're allowing anyone with a score of 0.8 or above to proceed. 0.8 was just a starting point and may be adjusted in the future.
1.  **You may now board the plane**
    -  You didn't submit a value with the honey pot, you received a token from grecaptcha, and Google determined you to be a safe flyer. We trust you're safe and can now proceed to your final destination. We'll build the submitting url for you so all the form data you sent to us can make its way to Acoustic.
    -  This submitting url is composed of the site url and a long query string of each field name from the form and the accompanied value that was paired with it. We're including some fields which are not Acoustic fields and that's ok. Those will just be ignored when submitting.
1.  **Safe travels, come again soon!**
    -  You're now set to fly. We're using Axios again but this time to perform a post request to the url we built in the previous stage. On successful submission, we received a long Json message of all the details of what just happened. But, within that message we receive a url that will be used as the redirect. This url is stored on the webform in Acoustic and we're just grabbing it from the response. This redirect url will be used shortly.
1.  **main()**
    -  This function is running all the above in the order in which they're shown. Each function is dependant on a successful resolve from the function above it.
1.  **try and catch**
    -  Assuming the main() function successfully resolves, we'll return a 301 status code and perform the redirect to the url we received from the end of main(). Catch is in place if main() doesn't resolve, we're displaying errors on why it didn't and sending the end user to a 404 page.
<br>


## Who do I talk to?

**Repo owner**: Chris Grouge, Lead Digital Marketer, Whereoware