const express = require("express"),
  // this is our app or instance of express
  app = express(),
  // used to submi form data on server
  axios = require('axios'),
  // port 3000 can be used for local testing. Otherwise, we're using the environment port.
  port = process.env.PORT || 3000;


// API middlewares
// this will accept data in json format
app.use(express.json());
// will support url-encoded bodies
app.use(express.urlencoded({
  extended: true
}));
// this will serve the public folder as the static folder
app.use(express.static("public"));



// showing my test form no mater where you try to navigate
app.get("/*", (req, res) => {
  res.sendFile(__dirname + '/public/test-form.html');
});



// This is where the magic happens. Lets validate the form post request to "/captcha"
app.post("/captcha", (req, res) => {

  // storing various data points from the request
  const formData = req.body;
  const formDataForQuery = formData;
  let submittingURL = req.body.submittingURL + "?";

  /******************************************************************************** 
   * 
   * STEP 1: MAKE SURE A G-RECAPTCHA RESPONSE VALUE WAS PASSED AND HONEY POT WASN'T FILLED IN
   * 
  *********************************************************************************/

  // validate recaptcha response was provided. If it wasn't show error page
  if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    res.writeHead(404, {'Content-Type' : 'text/html'});
    res.end(`<h1>ERROR: Google Recaptcha was not included in your submissions</h1>`);
    return
  }

  // validate the honey pot field is blank --- All valid form submissions should go here. 
  else if (req.body['hp_ex'] === "") {
    delete formDataForQuery.action;
    delete formDataForQuery.submittingURL;

    // I need to create the submitting url so when I post the data to it acoustic will pick it up
    submittingURL = submittingURL + Object.keys(formDataForQuery).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(formDataForQuery[key])).join('&');
    
    // enable this when you want to stop before step 2 for testing
    // return res.json({
    //   "body": formData,
    //   "submittingURL": submittingURL
    // });
  }

  // catch all just to be safe
  else {
    res.writeHead(404, {'Content-Type' : 'text/html'});
    res.end(`<h1>ERROR: Something went wrong</h1>`);
  }


  /******************************************************************************** 
   * 
   * STEP 2: LET GOOGLE SCORE THE G-RESPONSE SO WE CAN DETERMINE IF ITS VALID OR NOT
   * 
  *********************************************************************************/

  // storing keys and the grecaptcha verification url
  const SECRET_KEY = "6LcAv7AfAAAAAK29uglbPG4txi_0g5LO0E1ztA85",
  TOKEN = req.body['g-recaptcha-response'],
  VERIFY_URL = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${TOKEN}`;

  const scoreRecaptcha = async () => {
    await axios.post(VERIFY_URL, TOKEN)
      .then(
        (res) => {
          console.log("Scoring Recaptcha...");
          console.log(res.data);
          console.log("Scoring Complete...");
          console.log("Showing form data:");
          console.log(formData)
          // ! here is where I can validate what google scored the submission as. What score should I start blocking submissions?
          if (res.data.score > 0.8) {
            console.log("Score is greater than 0.8. Start function to submit to Acoustic");
            submitToAcoustic()
          }
          else {
            console.log("Score is less than 0.8. Likely spam submission. Redirect to 404 page.");
            redirect("https://www.whereoware.com/404");
          }
        }
      ).catch((err) => {
          console.error(err);
      });
  }

  /******************************************************************************** 
   * 
   * STEP 3: SUBMIT THE DATA TO ACOUSTIC CAMPAIGN AND REDIRECT
   * 
  *********************************************************************************/
  
  const submitToAcoustic = async () => {
    await axios.post(submittingURL)
    .then((res) => {
      // console.log(res.data);
      console.log("Submission to Acoustic successful. Compiling redirect url for final redirect.")
      // this value is navigating down the JSON tree of data Acoustic provides in the response to get the url you redirect to after a successful submission. We can redirect the page here
      let redirectURL = res.request._redirectable._currentUrl;
      redirect(redirectURL)
    }).catch((err) => {
      console.error(err);
    });
  }

  // this actually starts step 2. Step 2, if successful, will continue into this step 3.
  scoreRecaptcha();

  // this ends step 3
  const redirect = (url) => {
    res.redirect(url);
  }
  
});






// This is listening for the server created on our port
app.listen(port, () => {
  console.log('Server is running at port: ', port);
});