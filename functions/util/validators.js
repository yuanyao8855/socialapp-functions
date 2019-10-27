//help function

const isEmpty = str => {
  if (!str || str.trim() === '') return true;
  else return false;
};

const isEmail = email => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

exports.validateSignupData = newUser => {
  let errors = {};
  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid emaill address';
  }
  if (isEmpty(newUser.password)) errors.password = 'Must not be empty';
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = 'Passwird must match';
  if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = user => {
  let errors = {};
  if (isEmpty(user.email)) errors.email = 'Must not be empty';
  if (isEmpty(user.password)) errors.password = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

// prevent update user bio, website and locaton with empty string
exports.reduceUserDetail = data => {
  let userDetails = {};
  const { bio, website, location } = data;
  if (!isEmpty(bio)) userDetails.bio = bio;
  if (!isEmpty(website)) userDetails.website = website;
  if (!isEmpty(location)) userDetails.location = location;

  return userDetails;
};
