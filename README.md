# README

Welcome to the Whereoware Webflow Form Processing serverless application! This node app was created using AWS Lambda, Axios, Config, and qs (Query String) to allow form submissions from the Whereoware Webflow Website to be processed and pass/reject based on certain cirteria.
<br><br>


## What is this repository for?

The need for this app came from Alyson Hunter who made it very clear she was underwater with spam form submissions.

> <br>
> "The Recapcha on our website is broken, and we're getting inundated with Spam. The web agency we used has no idea what is causing the problem, as they don't have any experience with Acoustic webforms." - Alyson
> <br><br>

We've not identified how bots are getting to the site but this app is setup to prevent them from submitting forms.
<br><br>


## What criteria are we using to pass or reject submissions?

1. **A hidden honey pot text field**
  1. The idea behind this honey pot field is to catch bots attempting to submit forms and stopping them before anything else can take place. The honey pot field is a non-visible text field hidden in the form. A human submitting this form won't see the field and can submit without issues. Bots submitting the form can see the HTML of the input and will attempt to submit a value. This application will identify when a value has been submitted for this honey pot field and will block the submission.
1. **Google Recaptcha V3**
  1. If a bot is smart enough to ignore the hidden honey pot field, they must also pass the google recaptcha validation before submissions will be accepted. We're allowing recaptca scores of 0.8 and higher to continue through the form. Anything below 0.8 will be blocked.
<br><br>


## How do I get set up?

**Requirements**: Node and Git    
**Install**: `npm install`   
**Dependencies**: Axios, Config, qs   
**Run**: `npm start`
<br><br>


## AWS Setup

This application is hosted on AWS and uses multiple services listed below:<br>

**Lambda**<br>
Allows us to run code on the backend with AWS without the need for managing any servers. AWS will run the code and perform the actions as needed.
<br><br>


**API Gateway**<br>
Allows us to connected our lambda function, generate a unique url, and trigger the code in the lambda function to run.
<br><br>


## Who do I talk to?

**Repo owner**: Chris Grouge, Lead Digital Marketer, Whereoware

<br><br>