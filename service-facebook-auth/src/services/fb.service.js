const {
  PageFacebookModel,
  GroupFacebookModel,
  UserFacebookModel,
} = require("../models");
const {
  FACEBOOK: { APP_ID, APP_SECRET, URL_REDIRECT },
  kafka: kafkaConfig,
  facebook: FACEBOOK_HOST
} = require("../../config");
const { get } = require('lodash');
const { sendMessageKafka, fetchAPI, facebookSDK } = require('@trongnv/backend-helper');

const cachePagesToken = (req, pages) => {
  try {
    for (const page of pages) {
      const key = facebookSDK.keyCachePage(page._id);
      const keyAuth = facebookSDK.keyCachePageAuth(page._id, req.user.userId);
      facebookSDK.setCache(key, page.accessToken, 3600);
      facebookSDK.setCache(keyAuth, page.accessToken, 3600);
    }
  } catch (error) {
    console.log("cachePagesToken error: ", error);
  }
};

const cacheUserToken = (req, userFB) => {
  try {
    const key = facebookSDK.keyCacheUser(userFB.userFacebookID);
    const keyAuth = facebookSDK.keyCacheUserAuth(
      userFB.userFacebookID,
      req.user.userId
    );
    facebookSDK.setCache(key, userFB.accessToken, 3600);
    facebookSDK.setCache(keyAuth, userFB.accessToken, 3600);
  } catch (error) {
    console.log("cacheUserToken error: ", error);
  }
};

const onClonePage = async (req, facebook, fbPages) => {
  const { user } = req;
  // add to db
  const dataUpsert = fbPages.map((fbPage) => ({
    updateOne: {
      filter: {
        userFacebookID: facebook.userFacebookID,
        pageFacebookID: fbPage.id,
      },
      update: {
        $set: {
          userID: user.userId,
          accessToken: fbPage.access_token,
          category: fbPage.category,
          name: fbPage.name,
          link: fbPage.link,
          unreadMessageCount: fbPage.unread_message_count,
          picture: get(fbPage, "picture.data.url", ""),
          isRemoved: false,
          status: "SUBSCRIBE",
        },
      },
      upsert: true,
    },
  }));
  // remove old
  const idFbPages = fbPages.map((v) => v.id);
  const dataRemove = {
    updateMany: {
      filter: {
        pageFacebookID: { $nin: idFbPages },
        userFacebookID: facebook.userFacebookID,
        isRemoved: false,
      },
      update: {
        $set: {
          isRemoved: true,
          status: "UNSUBSCRIBE",
        },
      },
    },
  };
  dataUpsert.push(dataRemove);
  await PageFacebookModel.bulkWrite(dataUpsert);
  // update cache
  PageFacebookModel.find(
    {
      userID: user.userId,
      userFacebookID: facebook.userFacebookID,
      isRemoved: false,
    },
    function (err, pages) {
      if (err) return;
      cachePagesToken(req, pages);
    }
  );

  // subscribe
  for (const fbPage of fbPages) {
    const data = {
      access_token: fbPage.access_token,
      subscribed_fields: ["feed", "live_videos", "messages", "message_echoes", "message_deliveries", "message_reads"]
      // process.env.NODE_ENV === "development"
      //   ? ["feed", "live_videos", "messages", "message_echoes", "message_deliveries", "message_reads"]
      //   : ["feed", "live_videos"],
    };
    fetchAPI(
      `${FACEBOOK_HOST}/${fbPage.id}/subscribed_apps`,
      "POST",
      null,
      data
    )
      .then((res) =>
        console.log(
          `subscribe success: pageFBID: ${fbPage.id}, userFBID: ${facebook.userFacebookID}, userFBName: ${facebook.userFacebookName}`,
          res
        )
      )
      .catch((err) =>
        console.log(
          `subscribe err: pageFBID: ${fbPage.id}, userFBID: ${facebook.userFacebookID}, userFBName: ${facebook.userFacebookName}`,
          err.response.data
        )
      );
  }
  sendMessageKafka(kafkaConfig.sendCloneConversation.TOPIC, { userID: user.userId, fbPages })
}

module.exports = {
  getAccessTokenByCode: async (code) => {
    try {
      const data = {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: URL_REDIRECT,
        code: code,
      };
      const rs = await fetchAPI(
        `${FACEBOOK_HOST}/oauth/access_token`,
        "GET",
        null,
        null,
        data
      );
      return rs;
    } catch (error) {
      console.log(error.response.data);
      return { error };
    }
  },
  getLongAccessToken: async (accessToken) => {
    try {
      const params = {
        grant_type: "fb_exchange_token",
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: accessToken,
      };
      const rs = await fetchAPI(
        `${FACEBOOK_HOST}/oauth/access_token`,
        "GET",
        null,
        null,
        params
      );
      return rs;
    } catch (error) {
      console.log(error.response.data);
      return { error };
    }
  },
  getUser: async (accessToken) => {
    try {
      const params = {
        fields:
          "id,name,email,link,picture,accounts.limit(10000){link,access_token,category,name,picture.height(1000),unread_message_count}",
        access_token: accessToken,
      };
      const rs = await fetchAPI(
        `${FACEBOOK_HOST}/me`,
        "GET",
        null,
        null,
        params
      );
      return rs;
    } catch (error) {
      console.log(error.response.data);
      return { error };
    }
  },
  cloneGroups: async (req) => {
    const { facebook, user } = req;
    const params = {
      limit: 10000,
      admin_only: true,
      access_token: facebook.accessToken,
      fields: "name,picture.height(1000)",
    };
    console.log("cloneGroups", params);
    const groups = await fetchAPI(
      `${FACEBOOK_HOST}/${facebook.userFacebookID}/groups`,
      "GET",
      null,
      null,
      params
    );
    fbGroups = groups.data;
    const dataUpsert = fbGroups.map((group) => ({
      updateOne: {
        filter: {
          userFacebookID: facebook.userFacebookID,
          groupFacebookID: group.id,
        },
        update: {
          $set: {
            userID: user.userId,
            name: group.name,
            picture: get(group, "picture.data.url", ""),
            isRemoved: false,
          },
        },
        upsert: true,
      },
    }));
    const idFbGroups = fbGroups.map((v) => v.id);
    const dataRemove = {
      updateMany: {
        filter: {
          groupFacebookID: { $nin: idFbGroups },
          userFacebookID: facebook.userFacebookID,
          isRemoved: false,
        },
        update: {
          $set: {
            isRemoved: true,
          },
        },
      },
    };
    dataUpsert.push(dataRemove);
    await GroupFacebookModel.bulkWrite(dataUpsert);
  },
  clonePageMulti: async (req) => {
    const { userId } = req.user;
    const userFBs = await UserFacebookModel.find({
      userID: userId,
      isRemoved: false,
    });
    for (const facebook of userFBs) {
      const params = {
        limit: 10000,
        fields:
          "link,access_token,category,name,picture.height(1000),unread_message_count",
        access_token: facebook.accessToken,
      };
      const pages = await fetchAPI(
        `${FACEBOOK_HOST}/${facebook.userFacebookID}/accounts`,
        "GET",
        null,
        null,
        params
      );
      const fbPages = pages.data;
      await onClonePage(req, facebook, fbPages);
    }
  },
  clonePage: async (req, fbPages) => {
    const { facebook } = req;
    if (!fbPages) {
      const params = {
        limit: 10000,
        fields:
          "link,access_token,category,name,picture.height(1000),unread_message_count",
        access_token: facebook.accessToken,
      };
      const pages = await fetchAPI(
        `${FACEBOOK_HOST}/${facebook.userFacebookID}/accounts`,
        "GET",
        null,
        null,
        params
      );
      fbPages = pages.data;
    }
    await onClonePage(req, facebook, fbPages);
  },
  getPicture: async (req, accessToken) => {
    try {
      console.log(
        `${FACEBOOK_HOST}/${req.params.psid}/picture?type=large&access_token=${accessToken}`
      );
      const rs = await fetchAPI(
        `${FACEBOOK_HOST}/${req.params.psid}/picture?type=large&access_token=${accessToken}`,
        "GET"
      );
      return rs;
    } catch (error) {
      console.log(error.response.data);
      return { error };
    }
  },
  cacheUserToken,
  cachePagesToken,
};
