import _ from 'lodash';
import {Router} from 'express';
import passwordHash from 'password-hash';
import bodyParser from 'body-parser';

import User from '../model/user';

const router = Router();
export default router;

const jsonParser = bodyParser.json();

// Get the currently logged in user
//  - Returns 403 if not logged-in
router.get('/auth/user', LoggedInRequired, (req, res) => {
  const user = req.session.user;
  const userData = {
    username: user.username,
    fullname: user.fullname
  };
  res.send(userData);
});

// Creates a new user
//  - Returns 403 if not logged-in
router.post('/auth/user', jsonParser, (req, res) => {
  var userData = req.body;

  // Hash the password before-hand
  const unSecurePassword = userData.password;
  userData.password = passwordHash.generate(unSecurePassword, {algorithm: 'sha512'});

  var newUser = User(userData);
  newUser.save((err) => {
    if (err) {
      res.status(500);
      res.send(err);
      throw err;
    }

    console.log('New user created: ' + newUser.username);

    // Respond with a username stripped of the
    // password
    res.send({
      username: userData.username,
      fullname: userData.fullname
    });
  });
});

// Login a user
//  - Logs out the previous user if any
router.post('/auth/login', LoggedInRequired, jsonParser, (req, res) => {
  const userData = req.body;

  User.find({username: userData.username}, (err, users) => {
    if (err) {
      res.status(500);
      res.send(err);

      throw err;
    }

    if (_.isEmpty(users)) {
      res.status(404);
      res.end();
    } else {
      const user = _.head(users);
      
      // Verify the password
      if (passwordHash.verify(userData.password, user.password)) {
        req.session.user = user;
        res.send(user);
      } else {
        res.status(403);
        res.end();
      }
    }
  });
});

// Logout the currently logged-in user
//  - Returns 404 if not logged-in
router.post('/auth/logout', (req, res) => {
  if (req.session === undefined || req.session.user === undefined) {
    res.status(404);
    res.end();
  } else {
    req.session.destroy();
  }
});

// Middleware for express to ensure
//  that a valid user is logged-in before continuing.
export function LoggedInRequired(req, res, next) {
  if (req.session !== undefined && req.session.user !== undefined) {
    next();
  } else {
    res.status(403);
    res.end();
  }
};
