export const Session = {
  secret: "SmartMonitor",
  cookie: {
    // Max Time for Cookie Existence
    // In MilliSeconds
    maxAge: 4 * 24 * 60 * 60 * 1000,
    secure: false
  },
  name: "Smart Monitor",
  resave: false,
  saveUninitialized: true
};
