# Members Only

The idea of this project is taken from [Members Only](https://www.theodinproject.com/lessons/nodejs-members-only) of [The Odin Project](https://www.theodinproject.com). It's not exactly the same but the main features of the project is taken.

My goal in this project was to practice authentication using [Passport.js](https://www.passportjs.org) local strategy. Aside from this, I learned other things too.

The technologies I used:
- JavaScript on server-side,
- [Node.js](https://nodejs.org/en) runtime environment,
- [Express.js](https://expressjs.com) framework,
- [MongoDB](https://mongodb.com) database and [Mongoose](https://mongoosejs.com/) library,
- [Pug](https://pugjs.org/api/getting-started.html) view engine,
- [Multer](https://github.com/expressjs/multer) package,
- [bcrypt.js](https://www.npmjs.com/package/bcryptjs) for hashing and comparing passwords,
- and the local strategy of [Passpost.js](https://passportjs.org).

I tried my best on the server-side code, but the cliend-side might not be pretty. Sorry for that!

You can see a demo [here](https://sheltered-hollows-91024.herokuapp.com/).

## How to run

To run this site and see if it works well, you need to take a few steps.

First, you need to download and install [Node.js](https://nodejs.org/en/download/).

Second, you need to have a MongoDB database so the app can connect to it. You can get a free tier of [MongoDB Atlas](https://www.mongodb.com/atlas/database). There's a guide [here](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose#setting_up_the_mongodb_database). 

Third, you need an [AWS S3](https://aws.amazon.com/s3/) storage. I myself used [Arvan Cloud](https://www.arvancloud.com/en) storage service (for ease).

For the last part, you need to clone this repo. Go to any directory you want in your computer. Then, open the terminal and write the command below (I assume you already have Git installed):

```
git clone https://github.com/mahdiHash/members-only.git
```  

After that:  

```
cd members-only
```

Now you need to create a `.env` file in the root directory. This file is needed so the app can read the important and non-public information from environment variables. Here's the list of variables you need to create:
- `SECRET_KEY`: your online storage service secret key,
- `ACCESS_KEY`: your online storage service access key,
- `BUCKET`: your online storage service bucket name,
- `ENDPOINT`: your online storage service endpoint,
- `MONGODB`: your mongodb URI.
- `PREMIUM_CODES`: the codes to become premium, seperated by a semicolon,
- `SESSION_SECRET`: a random long string so the express-session package can use.

After these steps, you need to install the dependencies. For that, you can write `npm install` in the terminal. This will install all the dependencies the project needs.

Now to run a local server, enter `npm run start` (you can also write `npm run startserver` to use [nodemon](https://github.com/remy/nodemon)). After starting the server, you can open a browser and write `127.0.0.1:3000` in the address bar. You should see the homepage now.
