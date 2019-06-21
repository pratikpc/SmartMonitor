export const Session = {
  secret: "SmartMonitor",
  cookie: {
    expires: true,
    // Max Time for Cookie Existence
    // In MilliSeconds
    maxAge: 24 * 60 * 60 * 60 * 1000,
    secure: false
  },
  name: "Smart Monitor",
  resave: true,
  saveUninitialized: true
};
