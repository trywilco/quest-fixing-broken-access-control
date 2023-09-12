require("dotenv").config();
const axios = require("axios");

const createUser = async (client, username) => {
  const user = {
    user: {
      username,
      email: `${username}@wilco.gg`,
      password: "wilco1234",
    },
  };

  try {
    const loginRes = await client.post(`/api/users/login`, user);
    if (loginRes.data?.user?.token) {
      return loginRes.data.user.token;
    }
  } catch (e) {
    //User doesn't exists yet
  }

  const userRes = await client.post(`/api/users`, user);
  return userRes.data?.user?.token;
};

const createItem = async (client) => {
  const item = {
    item: {
      title: "title",
      description: "description",
      tag_list: ["tag1"],
      image: "",
      comments: [],
    },
  };

  const itemRes = await client.post(`/api/items`, item);
  return itemRes.data?.item;
};

const createComment = async (client, itemId) => {
  const comment = {
    body: "comment",
  };
  const commentRes = await client.post(`/api/items/${itemId}/comments`, comment);
  return commentRes.data?.comment;
}

const removeComment = async (client, itemId, commentId) => {
  return await client.delete(`/api/items/${itemId}/comments/${commentId}`);
};

const createUserClient = async (username) => {
  const client = axios.create({
    baseURL: `http://localhost:${process.env.PORT || 3000}`,
    timeout: 10 * 1000,
  });
  const token = await createUser(client, username);
  client.defaults.headers.common["Authorization"] = `Token ${token}`;
  return client;
}

const testItem = async () => {
  const userClientA = await createUserClient('userA');

  const itemA = await createItem(userClientA);
  const commentA = await createComment(userClientA, itemA.slug);

  try {
    await removeComment(userClientA, itemA.slug, commentA.id);
  } catch (err) {
    console.log({ err });
    console.log(`=!=!=!=!= ERROR: Item deletion for user A failed`);
    return false;
  }

  const itemB = await createItem(userClientA);
  const userClientB = await createUserClient('userB');
  const commentB = await createComment(userClientA, itemB.slug);

  let error;

  try {
    await removeComment(userClientB, itemB.slug, commentB.id);
  } catch (err) {
    error = err;
  }

  if (!error) {
    console.log(`=!=!=!=!= ERROR: Comment deletion for user B succeeded (should have failed)`);
    return false;
  }

  if (error?.response.status !== 403) {
    console.log(`=!=!=!=!= ERROR: Comment deletion for user B failed with wrong status code, should be 403 but was ${error?.response.status}`);
    return false;
  }

  return true;
};

testItem()
  .then((res) => process.exit(res ? 0 : 1))
  .catch((e) => {
    console.log("error while checking api: " + e);
    process.exit(1);
  });
