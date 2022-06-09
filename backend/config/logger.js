// using winston module to manage logs
const { createLogger, transports, format } = require("winston");
const logger = createLogger({
  transports: [
    new transports.Console({
      //filename: "info.log", // to store logs in a file....just initialise object with transports.File instead
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
    }),

    new transports.File({
      filename: "info.log", // to store logs in a file....just initialise object with transports.File instead
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.File({
      filename: "info.log", // to store logs in a file....just initialise object with transports.File instead
      level: "error",
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.File({
      filename: "info.log", // to store logs in a file....just initialise object with transports.File instead
      level: "warn",
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});

module.exports = logger;
