# README #

Welcome to the Whereoware Webflow Form Processing application! This node app was created using Express, Nodemon, and Axios to allow form submissions coming from the Whereoware Webflow Website to be processed and allowed if certain criteria are met.


### What is this repository for? ###

* The need for this app came from Alyson Hunter who was "getting inundated by spam" form submissions on the website. We've not identified how bots are getting to the site but this app is setup to prevent them from submitting forms.
* Version 0.1.0


### How do I get set up? ###

**Requirements**: Node and Git    
**Install**:  
`npm install`   
**Dependencies**: Axios and Express   
**Dev Dependencies**: Nodemon   
**Run**:  
`npm start`   


### AWS Setup ###

This application is hosted on AWS and uses multiple services listed below:  
**Elastic Beanstalk** 
This service will host the app for us and give us an environment to access.

**CodePipeline**  
This service was connected to the WhereowareDP Bitbucket Space using this repo. This serivces allows us to make changes to the master branch and immediately publish those changes live in AWS.   


### Who do I talk to? ###

**Repo owner**: Chris Grouge, Lead Digital Marketer, Whereoware