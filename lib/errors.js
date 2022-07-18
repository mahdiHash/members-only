const errors = {};

errors.Unauthorized = class extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'Unauthorized';
    this.status = 401;
  }
}

errors.LoginFailure = class extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'LoginFailure';
    this.status = 401;
  }
}

errors.RegisterFailure = class extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'RegisterFailure';
  }
}

errors.ServerErr = class extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'ServerErr';
    this.status = 500;
  }
}

module.exports = errors;
