module.exports = {
  //FACEBOOK
  facebook: 'https://graph.facebook.com',
  ffmpeg: 'http://118.69.18.225:3002/api-live/live',
  SCP_MARKETING_BACKEND: process.env.SCP_API_ENDPOINT + '/marketing',
  kafka: {
    sendCloneConversation: {
      TOPIC: 'facebook-clone-conversation'
    }
  },
  FACEBOOK: {
    APP_ID: process.env.FB_APP_ID,
    APP_SECRET: process.env.FB_APP_SECRET,
    VERIFY_TOKEN_WEBHOOKS: process.env.FB_VERIFY_TOKEN_WEBHOOKS || 'trongnv',
    URL_REDIRECT: process.env.FB_URL_REDIRECT,
  },
};
