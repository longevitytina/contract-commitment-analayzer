We’d like you to build a super small, simplified-beyond-all-recognition, miniature version of a contract commitment analyzer.

# Constraints

- We’re going to ask that you use (a subset of) our tech stack:
    - Postgres for the database
    - Python (your choice of tool or framework) for the api
    - React and Typescript for the frontend.

    Beyond that, feel free to pull in any tools or libraries that seem helpful to you!

- We’d prefer you to complete this in about a week of calendar time, but we understand people’s lives are busy so let us know if you need more.
- There’s no explicit time limit as to how long you should spend on this, but we’ve tried to design it to be respectful of your time and anticipate it taking 3-5 hours.  If you hit 10 hours, there’s a strong chance that what you’ve built is significantly overkill.

# Project

AWS customers who spend a lot on AWS every month generally sign contracts with Amazon.  Those contracts give those customers big discounts on their spend in exchange for commitments that look “you’ll spend at least $5m on S3 every month” or “you’ll spend at least $1.3m on RDS each 6-month period.”  A commitment has one or more “checkins” - a period where your spend will be measured.  If they miss those commitments, they owe shortfall fees to AWS.

We’re going to give you a CSV full of billing data for customers and a JSON file containing their commitments.  Your task will be to build a toy web-app to analyze them.

## Data files

- [spend_commitments.json](../data/spend_commitments.json)
- [aws_billing_data.csv](../data/aws_billing_data.csv)

### Billing data

Each row contains some billing event for a specific company - eg “cyberdyne spend $224.86 on ec2 on 2024-01-01”


### Commitment data

Each commitment in here represents a contractual commitment to spend money on AWS for a specific service (eg `s3`  or `ec2`).  A commitment is made up of a bunch of checkins with amounts and start/end dates.  Eg a checkin of $1000 from 2024-01-01 00:00:00 to 2024-02-02 00:00:00 means that you commit to spending $1000 that month on whatever service that commitment is for.

## Specific Requirements

1. Write a script that will read the billing data and put it into a postgres database
2. Create a python api and a react/typescript SPA frontend that reads that billing data, along with the commitments, and displays the commitment performance for a given company.  Your webapp should support:
    1. A concept of which company you’re currently viewing and a way to change that
    2. A way to view all commitments for the current company and a way to view details of a specific commitment.  For each commitment, a company wants to solve several problems:
        - As a customer, I want to know if my company is meeting its commitments so that I can present this to other departments
        - As a company, I want to know if we’re on track to meet our future commitments so I can adjust our spend in the future
        - As a company, I want to know how much we’ve missed our commitments by so that I know how much we’ll owe AWS at the end of our contract
        - As a company, I want to know which periods our commitments are getting evaluated for and what the shortfalls are for those periods so that I can check it against my own data to see if it’s right

        It’s up to you how you want to structure your interface to solve these problems.

### Non-Requirements

A non-exhaustive list of things you don’t have to worry about:

- Auth
- Testing
- Performance
- Security

### Misc

- You can load the commitments data into postgres or load it at runtime - whatever works for you.


## Readme

Please include a readme for this project as if you’re writing for your team. Be sure to cover, at a minimum, setup instructions, assumptions, and future areas that need attention. The questions below may also serve as helpful guidance for what you wish to include. We’ll be primarily evaluating your written communication skills on this point.

## Possible content to discuss:

1. Did you make any assumptions about the project and/or its requirements that we should know?
2. If you were building this over again, is there anything you’d change?
3. If you were making a production version of this (and feel free to make assumptions about what that looks like), what would you change?
4. If you had to do this work on a dataset that was 100x the size, what would you change?

Please *definitely* describe why you chose the UI/UX that you did, and any alternatives you considered.
