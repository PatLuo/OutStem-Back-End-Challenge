const axios = require("axios");
const _ = require("lodash");

const database = new Map();
let currTopEducator = "";

const runTestCase = async (testCase) => {
  try {
    const res = await axios.get(`https://interview.outstem.io/tests?test_case=${testCase}`);

    const educators = _.chunk(res.data.data, [(size = 3)]);
    const queries = res.data.query.split(", ");

    fillDatabase(educators);

    const postRequestBody = processQueries(queries);

    await axios
      .post(`https://interview.outstem.io/tests?test_case=${testCase}`, { results: postRequestBody }, { headers: { "Content-Type": "text/plain" } })
      .then((res) => {
        console.log(`Running test case ${testCase}...`);
        console.log("Body sent:");
        console.log(postRequestBody);
        console.log("Results:");
        console.log(res.data);
        console.log();
      })
      .catch((error) => {
        console.error("Error during GET request!\n" + error);
      });
  } catch (error) {
    console.log("Error during POST request!\n" + error);
  }
};

// query functions
const educatorOnline = (name, views, subject) => {
  database.set(name, [views, subject]);
  updateTopEducator(name);
};

const updateViews = (name, views, subject) => {
  if (subject == database.get(name)[1]) {
    database.set(name, [views, subject]);
    updateTopEducator(name);
  }
};

const updateSubject = (name, currentSubject, newSubject) => {
  if (currentSubject == database.get(name)[1]) {
    database.set(name, [database.get(name)[0], newSubject]);
  }
};

const educatorOffline = (name, subject) => {
  if (subject == database.get(name)[1]) {
    database.delete(name);
  }
};

const viewsInSubject = (subject) => {
  let views = 0;
  database.forEach((educator) => {
    if (educator[1] == subject) {
      views += parseInt(educator[0]);
    }
  });
  return views;
};

const topEducatorOfSubject = (subject) => {
  let currTopEducatorOfSubject = "";

  database.forEach((value, key) => {
    if (value[1] == subject) {
      if (currTopEducatorOfSubject == "") {
        currTopEducatorOfSubject = key;
      } else if (parseInt(value[0]) > parseInt(database.get(currTopEducatorOfSubject)[0])) {
        currTopEducatorOfSubject = key;
      }
    }
  });

  if (currTopEducatorOfSubject == "") {
    return null;
  } else {
    return currTopEducatorOfSubject;
  }
};

const topEducator = () => {
  if (database.size == 0) {
    return null;
  }
  return currTopEducator;
};

//helper functions
const fillDatabase = (educators) => {
  const keyValueArr = [];
  educators.forEach((educator) => keyValueArr.push([educator[0], [educator[1], educator[2]]]));
  keyValueArr.forEach((keyValuePair) => {
    database.set(keyValuePair[0], keyValuePair[1]);
    updateTopEducator(keyValuePair[0]);
  });
};

const processQueries = (q) => {
  let postRequestBody = [];

  let i = 0;
  while (i < q.length) {
    switch (q[i]) {
      case "EducatorOnline":
        educatorOnline(q[i + 1], q[i + 2], q[i + 3]);
        i += 4;
        break;
      case "UpdateViews":
        updateViews(q[i + 1], q[i + 2], q[i + 3]);
        i += 4;
        break;
      case "UpdateSubject":
        updateSubject(q[i + 1], q[i + 2], q[i + 3]);
        i += 4;
        break;
      case "EducatorOffline":
        educatorOffline(q[i + 1], q[i + 2]);
        i += 3;
        break;
      case "ViewsInSubject":
        postRequestBody.push(String(viewsInSubject(q[i + 1])));
        i += 2;
        break;
      case "TopEducatorOfSubject":
        postRequestBody.push(topEducatorOfSubject(q[i + 1]));
        i += 2;
        break;
      case "TopEducator":
        postRequestBody.push(topEducator());
        i += 1;
        break;
    }
  }
  return postRequestBody;
};

const updateTopEducator = (name) => {
  if (currTopEducator === "") {
    currTopEducator = name;
    return;
  }

  let topEducatorViews = parseInt(database.get(currTopEducator)[0]);
  let newEducatorViews = parseInt(database.get(name)[0]);
  let topEducatorSubject = database.get(currTopEducator)[1];
  let newEducatorSubject = database.get(name)[1];

  if (newEducatorViews > topEducatorViews) {
    currTopEducator = name;
  } else if (newEducatorViews == topEducatorViews) {
    if (viewsInSubject(newEducatorSubject) > viewsInSubject(topEducatorSubject)) {
      currTopEducator = name;
    }
  }
};

const resetDatabase = () => {
  database.clear();
  currTopEducator = "";
};

const callTestCases = async () => {
  await runTestCase(1);
  await resetDatabase();
  await runTestCase(2);
  await resetDatabase();
  await runTestCase(3);
  await resetDatabase();
  await runTestCase(4);
  await resetDatabase();
  await runTestCase(5);
  await resetDatabase();
  runTestCase(6);
};

callTestCases();
