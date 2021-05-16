module.exports = {
  //FACEBOOK
  facebook: 'https://graph.facebook.com',
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
